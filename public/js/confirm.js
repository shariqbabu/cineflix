// Client-side script for Email Confirmation
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

  function parseUrlTokens() {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);

    return {
      accessToken: hashParams.get('access_token') || params.get('access_token'),
      refreshToken: hashParams.get('refresh_token') || params.get('refresh_token'),
      type: hashParams.get('type') || params.get('type') || 'email',
      tokenHash: params.get('token_hash') || hashParams.get('token_hash'),
      code: params.get('code') || hashParams.get('code'),
      errorDescription: hashParams.get('error_description') || params.get('error_description')
    };
  }

  const tokens = parseUrlTokens();
  const loadingState = document.getElementById('loading-state');
  const successState = document.getElementById('success-state');
  const errorState = document.getElementById('error-state');
  const errorMessage = document.getElementById('error-message');
  const openAppBtn = document.getElementById('open-app-btn');
  const countdownSec = document.getElementById('countdown-sec');

  // Display logo image if available
  const logoContainer = document.getElementById('brand-logo-container');
  const testImg = new Image();
  testImg.src = '/images/logo.png';
  testImg.onload = () => {
    logoContainer.innerHTML = `<img src="/images/logo.png" alt="CineFlix" class="brand-logo-img" />`;
  };

  if (tokens.errorDescription) {
    loadingState.style.display = 'none';
    errorState.style.display = 'block';
    errorMessage.innerText = decodeURIComponent(tokens.errorDescription.replace(/\+/g, ' '));
    return;
  }

  async function verifyEmail() {
    try {
      let accessToken = tokens.accessToken;
      let refreshToken = tokens.refreshToken;

      // If Supabase routed with token_hash (standard OTP email verification)
      if (tokens.tokenHash && config.supabaseUrl) {
        const verifyType = tokens.type === 'signup' ? 'signup' : 'email';
        const verifyRes = await fetch(`${config.supabaseUrl}/auth/v1/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': config.supabaseAnonKey
          },
          body: JSON.stringify({
            type: verifyType,
            token_hash: tokens.tokenHash
          })
        });

        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) {
          throw new Error(verifyData.msg || verifyData.message || verifyData.error_description || 'Verification token is invalid or expired.');
        }

        if (verifyData.access_token) {
          accessToken = verifyData.access_token;
          refreshToken = verifyData.refresh_token;
        }
      }

      // If neither accessToken nor tokenHash was found, check if it's already an active callback
      if (!accessToken && !tokens.tokenHash && !tokens.code) {
        throw new Error('No verification token found in URL. Please open the confirmation link received in your email.');
      }

      // Successful verification
      loadingState.style.display = 'none';
      successState.style.display = 'block';

      // Construct Deep Link URL to launch CineFlix app
      let deepLink = `${config.appScheme}://auth/callback`;
      if (accessToken) {
        deepLink += `#access_token=${accessToken}&refresh_token=${refreshToken || ''}`;
      }
      openAppBtn.href = deepLink;

      // Auto countdown and redirect to Android app
      let count = 3;
      const timer = setInterval(() => {
        count--;
        if (countdownSec) countdownSec.innerText = count;
        if (count <= 0) {
          clearInterval(timer);
          window.location.href = deepLink;
        }
      }, 1000);

    } catch (err) {
      loadingState.style.display = 'none';
      errorState.style.display = 'block';
      errorMessage.innerText = err.message || 'Verification failed. Please try again.';
    }
  }

  // Run verification
  verifyEmail();
})();
