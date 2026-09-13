const https = require('https');

function renderHtml({ success, title, message, details }) {
  const accentColor = success ? '#00e676' : '#ff1e39';
  const badgeText = success ? 'SUCCESSFULLY APPROVED' : 'ACTION FAILED';
  const icon = success ? '&#10004;' : '&#10008;';

  let detailsHtml = '';
  if (details) {
    detailsHtml = `
      <div style="background:#131622;border-radius:12px;padding:16px 20px;margin:20px 0;text-align:left;border:1px solid #222638;">
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1a1d2b;font-size:13px;">
          <span style="color:#9da3b4;">Request ID:</span>
          <span style="color:#ffffff;font-family:monospace;">${details.requestId || 'N/A'}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1a1d2b;font-size:13px;">
          <span style="color:#9da3b4;">Customer / User ID:</span>
          <span style="color:#ffffff;font-family:monospace;">${details.userId || 'N/A'}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1a1d2b;font-size:13px;">
          <span style="color:#9da3b4;">VIP Status:</span>
          <span style="color:${accentColor};font-weight:bold;">${details.status || 'APPROVED'}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1a1d2b;font-size:13px;">
          <span style="color:#9da3b4;">VIP Access Duration:</span>
          <span style="color:#ffd700;font-weight:bold;">${details.duration || '30 Days'}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;">
          <span style="color:#9da3b4;">Active Until:</span>
          <span style="color:#ffffff;">${details.expiresAt || 'Active'}</span>
        </div>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${title} - CineFlix VIP Admin</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 20px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #07080b;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #ffffff;
    }
    .card {
      max-width: 480px;
      width: 100%;
      background: #0e1017;
      border-radius: 20px;
      border: 1px solid #222638;
      padding: 36px 28px;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0,0,0,0.6);
    }
    .badge {
      display: inline-block;
      padding: 4px 14px;
      border-radius: 20px;
      background: ${accentColor}22;
      color: ${accentColor};
      border: 1px solid ${accentColor}55;
      font-size: 11px;
      font-weight: bold;
      letter-spacing: 1px;
      margin-bottom: 16px;
    }
    .icon-circle {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: ${accentColor}18;
      border: 2px solid ${accentColor};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      color: ${accentColor};
      margin: 0 auto 20px auto;
    }
    h1 {
      margin: 0 0 10px 0;
      font-size: 22px;
      color: #ffffff;
    }
    p {
      color: #9da3b4;
      font-size: 14px;
      line-height: 1.5;
      margin: 0 0 16px 0;
    }
    .btn {
      display: inline-block;
      width: 100%;
      padding: 14px 20px;
      border-radius: 12px;
      background: linear-gradient(135deg, #ff1e39, #c80610);
      color: #ffffff;
      font-weight: bold;
      text-decoration: none;
      font-size: 14px;
      letter-spacing: 0.5px;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">${badgeText}</span>
    <div class="icon-circle">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    ${detailsHtml}
    <p style="font-size:12px;color:#5e6578;margin-top:20px;">CineFlix OTT Administrative Control Gateway</p>
  </div>
</body>
</html>`;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id, user_id, plan_id, status = 'approved' } = req.query;

  if (!id && !user_id) {
    return res.status(400).send(renderHtml({
      success: false,
      title: 'Invalid Request',
      message: 'Missing request ID or user ID in the approval link. Please open the link from your payment alert email.'
    }));
  }

  const rawUrl = process.env.SUPABASE_URL || '';
  const supabaseUrl = rawUrl.replace(/\/$/, '');
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).send(renderHtml({
      success: false,
      title: 'Configuration Error',
      message: 'Supabase URL or Key is not configured in Vercel environment variables.'
    }));
  }

  // Calculate plan expiration
  let durationDays = 30;
  if (plan_id === 'plan_3m') durationDays = 90;
  if (plan_id === 'plan_12m') durationDays = 365;
  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  // Patch query to Supabase: /rest/v1/subscription_requests?id=eq.xxx
  const filter = id ? `id=eq.${encodeURIComponent(id)}` : `user_id=eq.${encodeURIComponent(user_id)}`;
  const endpoint = `${supabaseUrl}/rest/v1/subscription_requests?${filter}`;

  const payload = JSON.stringify({
    status: status.toLowerCase(),
    expires_at: expiresAt
  });

  try {
    const urlObj = new URL(endpoint);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const result = await new Promise((resolve, reject) => {
      const request = https.request(options, (response) => {
        let body = '';
        response.on('data', chunk => body += chunk);
        response.on('end', () => resolve({ statusCode: response.statusCode, body }));
      });
      request.on('error', reject);
      request.write(payload);
      request.end();
    });

    if (result.statusCode >= 200 && result.statusCode < 300) {
      return res.status(200).send(renderHtml({
        success: true,
        title: status === 'approved' ? 'VIP Access Approved! 🎉' : 'Status Updated',
        message: status === 'approved'
          ? `VIP membership is now ACTIVE. The customer can stream latest 4K blockbuster movies in the CineFlix App.`
          : `Customer subscription status changed to ${status}.`,
        details: {
          requestId: id || 'N/A',
          userId: user_id || 'N/A',
          status: status.toUpperCase(),
          duration: `${durationDays} Days`,
          expiresAt: new Date(expiresAt).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
          })
        }
      }));
    } else {
      return res.status(result.statusCode).send(renderHtml({
        success: false,
        title: 'Supabase Update Error',
        message: `Supabase returned status ${result.statusCode}: ${result.body}`
      }));
    }
  } catch (error) {
    return res.status(500).send(renderHtml({
      success: false,
      title: 'Server Exception',
      message: error.message || 'Unknown network error'
    }));
  }
};
