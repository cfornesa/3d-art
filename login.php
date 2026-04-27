<?php
/**
 * Creatrweb Data Art — Login Page
 *
 * Route: /login.php
 *
 * - If user is already authenticated, redirect to studio.php
 * - Otherwise, show login form
 */

require_once __DIR__ . '/config/bootstrap.php';

// Redirect if already logged in
if (is_authenticated()) {
    header('Location: /studio.php');
    exit;
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Log In — Creatrweb Data Art</title>
  <link rel="stylesheet" href="css/app.css">
  <style>
    body {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
    }
    
    .dta-login-container {
      background: #242018;
      border: 2px solid #c9922a;
      box-shadow: 4px 4px 0px #000000;
      padding: 32px;
      max-width: 320px;
      width: 100%;
    }
    
    .dta-login-container h1 {
      color: #c9922a;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 24px;
      text-align: center;
    }
    
    .dta-login-form label {
      display: block;
      margin-bottom: 4px;
      color: #a0a0a0;
      font-size: 14px;
    }
    
    .dta-login-form input {
      width: 100%;
      padding: 8px;
      margin-bottom: 16px;
      background: #1c1814;
      border: 1px solid #333;
      color: #f0ece4;
      font-family: system-ui, sans-serif;
      font-size: 14px;
    }
    
    .dta-login-form input:focus {
      outline: 2px solid #4a8fa8;
      outline-offset: -2px;
      border-color: #4a8fa8;
    }
    
    .dta-login-submit {
      width: 100%;
      padding: 12px;
      background: #c9922a;
      color: #1c1814;
      border: none;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      cursor: pointer;
      box-shadow: 4px 4px 0px #000000;
      transition: transform 0.15s, box-shadow 0.15s, filter 0.15s;
    }
    
    .dta-login-submit:hover {
      transform: translate(-2px, -2px);
      box-shadow: 6px 6px 0px #000000;
      filter: brightness(1.1);
    }
    
    .dta-login-submit:active {
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0px #000000;
      filter: brightness(0.9);
    }
    
    .dta-login-notice {
      margin-top: 16px;
      font-size: 12px;
      color: #606060;
      text-align: center;
    }
    
    .dta-error-message {
      color: #e8a0a0;
      font-size: 13px;
      margin-bottom: 16px;
      min-height: 18px;
      text-align: center;
    }
  </style>
</head>
<body>

  <div class="dta-login-container">
    <h1>Log In</h1>
    
    <div id="dta-login-error" class="dta-error-message"></div>
    
    <form id="dta-login-form" class="dta-login-form">
      <label for="dta-email">Email</label>
      <input type="email" id="dta-email" name="email" required autocomplete="email">

      <label for="dta-password">Password</label>
      <input type="password" id="dta-password" name="password" required autocomplete="current-password">

      <button type="submit" class="dta-login-submit">Log In</button>
    </form>
    
    <p class="dta-login-notice">Owner access only</p>
  </div>

  <script>
    // Login form handler
    document.getElementById('dta-login-form').addEventListener('submit', function(e) {
      e.preventDefault();
      
      var email = document.getElementById('dta-email').value.trim();
      var password = document.getElementById('dta-password').value;
      var errorEl = document.getElementById('dta-login-error');
      
      if (!email || !password) {
        errorEl.textContent = 'Email and password are required';
        return;
      }
      
      errorEl.textContent = '';
      
      fetch('api/auth/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      })
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        if (data.success) {
          window.location.href = 'studio.php';
        } else {
          errorEl.textContent = data.error || 'Login failed';
        }
      })
      .catch(function(err) {
        errorEl.textContent = 'Login failed: ' + err.message;
      });
    });
  </script>

</body>
</html>
