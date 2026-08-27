const loginScreen = document.getElementById('login-screen');
const calculatorScreen = document.getElementById('calculator-screen');
const welcomeMsg = document.getElementById('welcome-msg');
const logoutBtn = document.getElementById('logout-btn');
const display = document.getElementById('calc-display');
const clerkSignInDiv = document.getElementById('clerk-sign-in');

function showCalculator(user) {
  welcomeMsg.textContent = `Hi, ${user.fullName || user.primaryEmailAddress?.emailAddress || user.primaryPhoneNumber?.phoneNumber}`;
  loginScreen.classList.add('hidden');
  calculatorScreen.classList.remove('hidden');
}

const phoneStatus = document.getElementById('phone-status');

window.phoneEmailListener = async function (userObj) {
  phoneStatus.textContent = 'Verifying phone number...';
  try {
    const res = await fetch('https://phoneauth.dreamprintz.com/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_json_url: userObj.user_json_url }),
    });
    const data = await res.json();

    if (!res.ok || !data.signInToken) {
      phoneStatus.textContent = 'Phone sign-in failed. Please try again.';
      return;
    }

    const signIn = await window.Clerk.client.signIn.create({
      strategy: 'ticket',
      ticket: data.signInToken,
    });
    await window.Clerk.setActive({ session: signIn.createdSessionId });
    phoneStatus.textContent = '';
  } catch (err) {
    phoneStatus.textContent = 'Phone sign-in failed. Please try again.';
  }
};

function showLogin() {
  calculatorScreen.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  resetCalculator();
  window.Clerk.mountSignIn(clerkSignInDiv);
}

window.addEventListener('load', async () => {
  await window.Clerk.load();

  if (window.Clerk.user) {
    showCalculator(window.Clerk.user);
  } else {
    showLogin();
  }

  window.Clerk.addListener(({ user }) => {
    if (user) {
      window.Clerk.unmountSignIn(clerkSignInDiv);
      showCalculator(user);
    } else {
      showLogin();
    }
  });
});

logoutBtn.addEventListener('click', async () => {
  await window.Clerk.signOut();
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
