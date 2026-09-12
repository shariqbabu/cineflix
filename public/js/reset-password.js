// Client-side script for Password Reset
(async function() {
  let config = {
    supabaseUrl: '',
    supabaseAnonKey: '',
    appScheme: 'cineflix'
  };

  try {
    const res = await fetch('/api/config');
    config = await res.json();
  } catch (e) {
    console.warn('Failed to fetch /api/config, using defaults', e);
  }

  // Parse URL parameters from both Hash (#) and Query (?)
  function parseUrlTokens() {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);

    return {
      accessToken: hashParams.get('access_token') || params.get('access_token'),
      refreshToken: hashParams.get('refresh_token') || params.get('refresh_token'),
      type: hashParams.get('type') || params.get('type'),
      tokenHash: params.get('token_hash') || hashParams.get('token_hash'),
      code: params.get('code') || hashParams.get('code'),
      errorDescription: hashParams.get('error_description') || params.get('error_description')
    };
  }

  const tokens = parseUrlTokens();
  const alertBox = document.getElementById('alert-box');
  const formContainer = document.getElementById('reset-form-container');
  const successScreen = document.getElementById('success-screen');
  const errorScreen = document.getElementById('error-screen');
  const errorDesc = document.getElementById('error-desc');
  const form = document.getElementById('reset-form');
  const newPassInput = document.getElementById('new-password');
  const confirmPassInput = document.getElementById('confirm-password');
  const submitBtn = document.getElementById('submit-btn');
  const btnText = document.getElementById('btn-text');
  const btnSpinner = document.getElementById('btn-spinner');
  const strengthBar = document.getElementById('strength-bar');
  const strengthLabel = document.getElementById('strength-label');
  const openAppBtn = document.getElementById('open-app-btn');

  // Display logo image if available, fallback stays if not
  const logoContainer = document.getElementById('brand-logo-container');
  const testImg = new Image();
  testImg.src = '/images/logo.png';
  testImg.onload = () => {
    logoContainer.innerHTML = `<img src="/images/logo.png" alt="CineFlix" class="brand-logo-img" />`;
  };

  // If Supabase returned an error in the redirect URL
  if (tokens.errorDescription) {
    formContainer.style.display = 'none';
    errorScreen.style.display = 'block';
    errorDesc.innerText = decodeURIComponent(tokens.errorDescription.replace(/\+/g, ' '));
    return;
  }

  // Verify access token presence
  if (!tokens.accessToken && !tokens.code && !tokens.tokenHash) {
    formContainer.style.display = 'none';
    errorScreen.style.display = 'block';
    errorDesc.innerText = 'No authorization token found in URL. Please open the reset link sent to your email from CineFlix.';
    return;
  }

  // Toggle Password Visibility
  document.querySelectorAll('.toggle-password-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
      } else {
        input.type = 'password';
        btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
      }
    });
  });

  // Password Strength Meter
  newPassInput.addEventListener('input', () => {
    const val = newPassInput.value;
    let score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    if (val.length === 0) {
      strengthBar.style.width = '0%';
      strengthBar.style.backgroundColor = 'transparent';
      strengthLabel.innerText = 'Password strength';
    } else if (score <= 2) {
      strengthBar.style.width = '33%';
      strengthBar.style.backgroundColor = '#FF334B';
      strengthLabel.innerText = 'Weak password';
      strengthLabel.style.color = '#FF334B';
    } else if (score <= 3) {
      strengthBar.style.width = '66%';
      strengthBar.style.backgroundColor = '#FFB800';
      strengthLabel.innerText = 'Medium strength';
      strengthLabel.style.color = '#FFB800';
    } else {
      strengthBar.style.width = '100%';
      strengthBar.style.backgroundColor = '#00E676';
      strengthLabel.innerText = 'Strong password';
      strengthLabel.style.color = '#00E676';
    }
  });

  function showAlert(message, type = 'error') {
    alertBox.className = `alert-box ${type}`;
    alertBox.innerText = message;
    alertBox.style.display = 'flex';
  }

  // Handle Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBox.style.display = 'none';

    const newPassword = newPassInput.value.trim();
    const confirmPassword = confirmPassInput.value.trim();

    if (newPassword.length < 6) {
      showAlert('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('Passwords do not match. Please re-enter.');
      return;
    }

    // Show loading state
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnSpinner.style.display = 'block';

    try {
      let accessToken = tokens.accessToken;

      // If PKCE code exchange or token hash is required
      if (!accessToken && tokens.tokenHash) {
        const verifyRes = await fetch(`${config.supabaseUrl}/auth/v1/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': config.supabaseAnonKey
          },
          body: JSON.stringify({
            type: 'recovery',
            token_hash: tokens.tokenHash
          })
        });
        const verifyData = await verifyRes.json();
        if (verifyData.access_token) {
          accessToken = verifyData.access_token;
        } else {
          throw new Error(verifyData.msg || verifyData.error_description || 'Token verification failed.');
        }
      }

      if (!accessToken) {
        throw new Error('No valid access token available for updating password.');
      }

      // Update user password via Supabase Auth API
      const updateRes = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.supabaseAnonKey,
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          password: newPassword
        })
      });

      const updateData = await updateRes.json();

      if (!updateRes.ok) {
        throw new Error(updateData.msg || updateData.message || updateData.error_description || 'Failed to update password.');
      }

      // Success state
      formContainer.style.display = 'none';
      successScreen.style.display = 'block';

      // Deep link to app
      const deepLink = `${config.appScheme}://auth/callback#access_token=${accessToken}&refresh_token=${tokens.refreshToken || ''}&password_updated=true`;
      openAppBtn.href = deepLink;

      // Auto countdown to open app
      let count = 3;
      const countEl = document.getElementById('countdown-sec');
      const timer = setInterval(() => {
        count--;
        if (countEl) countEl.innerText = count;
        if (count <= 0) {
          clearInterval(timer);
          window.location.href = deepLink;
        }
      }, 1000);

    } catch (err) {
      submitBtn.disabled = false;
      btnText.style.display = 'inline';
      btnSpinner.style.display = 'none';
      showAlert(err.message || 'An unexpected error occurred. Please try again.');
    }
  });

})();
