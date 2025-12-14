// api/create-payment.js - FIXED VERSION (matches your env var names)
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId, userId, amount, userEmail, userName, courseNames } = req.body;

    console.log('📡 Received payment request:', { orderId, userId, amount });

    // Get credentials - FIXED: matches your environment variable names
    const PAYMEE_VENDOR_ID = process.env.REACT_APP_PAYMEE_VENDOR_ID;
    const PAYMEE_API_TOKEN = process.env.REACT_APP_PAYMEE_API_TOKEN;

    // Validate credentials
    if (!PAYMEE_VENDOR_ID || !PAYMEE_API_TOKEN) {
      console.error('❌ Missing credentials:', {
        hasVendorId: !!PAYMEE_VENDOR_ID,
        hasApiToken: !!PAYMEE_API_TOKEN,
        envVars: Object.keys(process.env).filter(k => k.includes('PAYMEE'))
      });
      return res.status(500).json({ 
        error: 'Payment service configuration error',
        details: 'Missing Paymee credentials'
      });
    }

    console.log('✅ Credentials found, calling Paymee...');

    // Prepare Paymee payload
    const paymeePayload = {
      vendor: PAYMEE_VENDOR_ID,
      amount: parseFloat(amount).toFixed(2),
      note: `Learnio - ${courseNames?.substring(0, 100) || 'Course Purchase'}`,
      first_name: (userName?.split(' ')[0] || 'User').substring(0, 50),
      last_name: (userName?.split(' ')[1] || 'Learnio').substring(0, 50),
      email: userEmail || 'customer@learnio.com',
      phone: '+21620000000',
      order_id: orderId,
      return_url: `https://learnio-edu-platform.vercel.app/payment/success?order_id=${orderId}&user_id=${userId}`,
      cancel_url: `https://learnio-edu-platform.vercel.app/payment/cancel?order_id=${orderId}`,
      fail_url: `https://learnio-edu-platform.vercel.app/payment/failure?order_id=${orderId}`
    };

    console.log('📤 Sending to Paymee:', { ...paymeePayload, vendor: '***' });

    // Call Paymee API
    const paymeeResponse = await fetch('https://paymee.tn/api/v1/createPayment', {
      method: 'POST',
      headers: {
        'Authorization': PAYMEE_API_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymeePayload)
    });

    // Get response as text first (for debugging)
    const responseText = await paymeeResponse.text();
    console.log('📥 Paymee response status:', paymeeResponse.status);
    console.log('📥 Paymee raw response:', responseText.substring(0, 500));

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse Paymee response:', parseError);
      return res.status(500).json({
        error: 'Invalid response from payment provider',
        details: responseText.substring(0, 200)
      });
    }

    // Check if payment URL was returned
    if (!data.payment_url) {
      console.error('❌ No payment URL in response:', data);
      return res.status(400).json({ 
        error: 'Payment creation failed',
        details: data.message || data.error || 'No payment URL received',
        paymeeResponse: data
      });
    }

    console.log('✅ Payment URL created:', data.payment_url);

    return res.status(200).json({
      success: true,
      paymentUrl: data.payment_url,
      token: data.token || null
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      type: error.name
    });
  }
}