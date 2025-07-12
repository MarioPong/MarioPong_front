// login.js

document.addEventListener('DOMContentLoaded', function () {
  // Forgot Password
  const forgot = document.querySelector('.text-wrapper-3');
  if (forgot) {
    forgot.addEventListener('click', function () {
      alert('Forgot Password clicked!');
      // window.location.href = 'fogot_pw.html';
    });
  }

  // Register
  const register = document.querySelector('.text-wrapper-4');
  if (register) {
    register.addEventListener('click', function () {
      alert('Register clicked!');
      // window.location.href = 'register.html';
    });
  }

  // Login button
  const loginBtn = document.querySelector('.text-wrapper-6');
  if (loginBtn) {
    loginBtn.addEventListener('click', function () {
      alert('Login clicked!');
      // Add login logic here
    });
  }
}); 