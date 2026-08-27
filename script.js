const loginScreen = document.getElementById('login-screen');
const calculatorScreen = document.getElementById('calculator-screen');
const loginForm = document.getElementById('login-form');
const errorMsg = document.getElementById('error-msg');
const welcomeMsg = document.getElementById('welcome-msg');
const logoutBtn = document.getElementById('logout-btn');
const display = document.getElementById('calc-display');
const signupBtn = document.getElementById('signup-btn');
const googleBtn = document.getElementById('google-btn');

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function showCalculator(user) {
  errorMsg.textContent = '';
  welcomeMsg.textContent = `Hi, ${user.user_metadata?.full_name || user.email}`;
  loginScreen.classList.add('hidden');
  calculatorScreen.classList.remove('hidden');
}

function showLogin() {
  calculatorScreen.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  resetCalculator();
}

supabaseClient.auth.onAuthStateChange((_event, session) => {
  if (session?.user) {
    showCalculator(session.user);
  } else {
    showLogin();
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  errorMsg.textContent = error ? error.message : '';
});

signupBtn.addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    errorMsg.textContent = 'Enter an email and password to create an account.';
    return;
  }

  const { error } = await supabaseClient.auth.signUp({ email, password });
  errorMsg.textContent = error ? error.message : 'Account created. Check your email to confirm, then sign in.';
});

googleBtn.addEventListener('click', async () => {
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.href },
  });
  if (error) errorMsg.textContent = error.message;
});

logoutBtn.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
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
