// api/create-payment.js
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId, userId, amount, userEmail, userName, courseNames } = req.body;

    console.log('📡 Creating Paymee payment for:', { orderId, userId, amount });

    // Your Paymee credentials from .env
    const PAYMEE_VENDOR_ID = process.env.REACT_APP_PAYMEE_VENDOR_ID;
    const PAYMEE_API_KEY = process.env.REACT_APP_PAYMEE_API_KEY;

    if (!PAYMEE_VENDOR_ID || !PAYMEE_API_KEY) {
      return res.status(500).json({ 
        error: 'Paymee configuration missing in environment variables' 
      });
    }

    // Call Paymee API
    const paymeeResponse = await fetch('https://paymee.tn/api/v1/createPayment', {
      method: 'POST',
      headers: {
        'Authorization': PAYMEE_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
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
      })
    });

    const data = await paymeeResponse.json();

    if (!data.payment_url) {
      console.error('❌ Paymee error:', data);
      return res.status(400).json({ 
        error: 'Payment creation failed',
        details: data 
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
      message: error.message
    });
  }
}