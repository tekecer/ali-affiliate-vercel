const axios = require('axios');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const authCode = req.query.code;
    const state = req.query.state;
    
    console.log('📨 Received OAuth callback:', { 
      code: authCode ? '***' : 'none', 
      state: state || 'none' 
    });
    
    if (authCode) {
      try {
        // Exchange code for access token
        const tokenResponse = await axios.post('https://api.aliExpress.com/token', {
          grant_type: 'authorization_code',
          client_id: '521460',
          client_secret: process.env.ALI_APP_SECRET,
          code: authCode,
          redirect_uri: 'https://ali-affiliate-tekecer.vercel.app/api/callback'
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        const accessToken = tokenResponse.data.access_token;
        const refreshToken = tokenResponse.data.refresh_token;
        const expiresIn = tokenResponse.data.expires_in;
        
        console.log('✅ Token exchange successful');
        
        // Return success response dengan HTML yang user-friendly
        return res.status(200).send(`
<!DOCTYPE html>
<html>
<head>
    <title>✅ AliExpress OAuth Success</title>
    <meta charset="utf-8">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 600px; 
            margin: 50px auto; 
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
        }
        .container { 
            background: rgba(255,255,255,0.1); 
            padding: 30px; 
            border-radius: 10px;
            backdrop-filter: blur(10px);
        }
        .success { color: #4CAF50; font-size: 24px; }
        .token { 
            background: rgba(0,0,0,0.3); 
            padding: 15px; 
            border-radius: 5px; 
            word-break: break-all;
            font-family: monospace;
            margin: 10px 0;
        }
        .warning { color: #FF9800; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="success">✅ AliExpress OAuth Successful!</h1>
        <p><strong>Access Token:</strong></p>
        <div class="token">${accessToken}</div>
        
        <p><strong>Refresh Token:</strong></p>
        <div class="token">${refreshToken}</div>
        
        <p><strong>Expires In:</strong> ${expiresIn} seconds</p>
        
        <p class="warning">⚠️ <strong>Save these tokens securely!</strong></p>
        <p>Copy the tokens and add them to your bot configuration.</p>
        
        <hr>
        <p><small>Tekecer Auto Poster - AliExpress Affiliate System</small></p>
    </div>
</body>
</html>
        `);
        
      } catch (error) {
        console.error('❌ Token exchange error:', error.response?.data || error.message);
        
        let errorMessage = 'Failed to exchange authorization code';
        if (error.response?.data) {
          errorMessage = error.response.data.error_description || error.response.data.error;
        }
        
        return res.status(400).send(`
<!DOCTYPE html>
<html>
<head>
    <title>❌ OAuth Error</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 50px; background: #ffebee; color: #c62828; }
        .error { background: white; padding: 20px; border-radius: 5px; border-left: 5px solid #c62828; }
    </style>
</head>
<body>
    <div class="error">
        <h1>❌ OAuth Error</h1>
        <p><strong>Error:</strong> ${errorMessage}</p>
        <p><strong>Details:</strong> ${JSON.stringify(error.response?.data || error.message)}</p>
    </div>
</body>
</html>
        `);
      }
    } else {
      // No code provided - show instructions
      return res.status(400).send(`
<!DOCTYPE html>
<html>
<head>
    <title>AliExpress OAuth Callback</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 50px; }
        .info { background: #e3f2fd; padding: 20px; border-radius: 5px; }
        code { background: #f5f5f5; padding: 2px 5px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="info">
        <h1>🔗 AliExpress OAuth Callback Handler</h1>
        <p>This endpoint handles AliExpress OAuth callbacks for Tekecer Auto Poster.</p>
        
        <h2>Usage:</h2>
        <p>Add <code>?code=YOUR_AUTHORIZATION_CODE</code> to the URL</p>
        
        <h2>Expected Flow:</h2>
        <ol>
            <li>User authorizes app at AliExpress</li>
            <li>AliExpress redirects here with <code>?code=...</code></li>
            <li>This service exchanges code for access token</li>
            <li>Returns tokens for bot integration</li>
        </ol>
        
        <hr>
        <p><small>Tekecer Auto Poster - Affiliate System</small></p>
    </div>
</body>
</html>
      `);
    }
  }

  return res.status(405).send(`
<!DOCTYPE html>
<html>
<head>
    <title>Method Not Allowed</title>
</head>
<body>
    <h1>❌ Method Not Allowed</h1>
    <p>Use GET request with <code>?code</code> parameter.</p>
</body>
</html>
  `);
};
