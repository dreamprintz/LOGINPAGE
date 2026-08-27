const loginScreen = document.getElementById('login-screen');
const calculatorScreen = document.getElementById('calculator-screen');
const errorMsg = document.getElementById('error-msg');
const welcomeMsg = document.getElementById('welcome-msg');
const logoutBtn = document.getElementById('logout-btn');
const display = document.getElementById('calc-display');

function decodeJwtPayload(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('')
  );
  return JSON.parse(json);
}

function handleGoogleLogin(response) {
  let profile;
  try {
    profile = decodeJwtPayload(response.credential);
  } catch (err) {
    errorMsg.textContent = 'Could not verify Google sign-in. Please try again.';
    return;
  }

  errorMsg.textContent = '';
  welcomeMsg.textContent = `Hi, ${profile.name || profile.email}`;
  loginScreen.classList.add('hidden');
  calculatorScreen.classList.remove('hidden');
}

logoutBtn.addEventListener('click', () => {
  calculatorScreen.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  if (window.google && google.accounts && google.accounts.id) {
    google.accounts.id.disableAutoSelect();
  }
  resetCalculator();
});

let expression = '';

function resetCalculator() {
  expression = '';
  display.value = '';
}

function evaluateExpression(expr) {
  const tokens = expr.match(/(\d+\.?\d*)|[+\-*/%]/g);
  if (!tokens) return NaN;

  const values = [];
  const ops = [];
  const precedence = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2 };

  const applyOp = () => {
    const op = ops.pop();
    const b = values.pop();
    const a = values.pop();
    let result;
    switch (op) {
      case '+': result = a + b; break;
      case '-': result = a - b; break;
      case '*': result = a * b; break;
      case '/': result = b === 0 ? NaN : a / b; break;
      case '%': result = a % b; break;
    }
    values.push(result);
  };

  for (const token of tokens) {
    if (/[+\-*/%]/.test(token) && token.length === 1) {
      while (ops.length && precedence[ops[ops.length - 1]] >= precedence[token]) {
        applyOp();
      }
      ops.push(token);
    } else {
      values.push(parseFloat(token));
    }
  }
  while (ops.length) {
    applyOp();
  }
  return values[0];
}

document.querySelectorAll('.calc-buttons button').forEach((button) => {
  button.addEventListener('click', () => {
    const value = button.dataset.value;

    if (value === 'clear') {
      resetCalculator();
      return;
    }

    if (value === 'backspace') {
      expression = expression.slice(0, -1);
      display.value = expression;
      return;
    }

    if (value === '=') {
      const result = evaluateExpression(expression);
      display.value = Number.isNaN(result) ? 'Error' : String(result);
      expression = Number.isNaN(result) ? '' : String(result);
      return;
    }

    expression += value;
    display.value = expression;
  });
});
