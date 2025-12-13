// test-paymee-simple.js
require('dotenv').config({ path: '.env.local' });

const axios = require('axios');

console.log('🔍 Simple Paymee Test\n');

const API_TOKEN = process.env.REACT_APP_PAYMEE_API_TOKEN;
const VENDOR_ID = process.env.REACT_APP_PAYMEE_VENDOR_ID;

console.log('1. Checking credentials...');
console.log('   API Token:', API_TOKEN ? '✅ Found' : '❌ Missing');
console.log('   Vendor ID:', VENDOR_ID ? '✅ Found' : '❌ Missing');

if (!API_TOKEN || !VENDOR_ID) {
  console.log('\n❌ Add these to .env.local and restart!');
  process.exit(1);
}

console.log('\n2. Testing API...');

(async () => {
  try {
    const testData = {
      vendor: VENDOR_ID,
      amount: "10.00",
      note: "Test",
      first_name: "Test",
      last_name: "User",
      email: "test@example.com",
      phone_number: "20000000",
      return_url: "http://localhost:3000/payment/success",
      cancel_url: "http://localhost:3000/payment/cancel",
      order_id: `TEST_${Date.now()}`
    };

    const response = await axios.post(
      'https://sandbox.paymee.tn/api/v1/payments/create',
      testData,
      {
        headers: {
          'Authorization': `Token ${API_TOKEN}`
        }
      }
    );

    console.log('   ✅ API Working!');
    
    // Get token
    let token = '';
    if (response.data.data?.token) token = response.data.data.token;
    else if (response.data.token) token = response.data.token;
    
    if (token) {
      const paymentUrl = `https://sandbox.paymee.tn/gateway/${token}`;
      console.log('\n3. Payment URL:');
      console.log('   ' + paymentUrl);
      console.log('\n4. Test with:');
      console.log('   Phone: 11111111');
      console.log('   Password: 11111111');
      console.log('\n🎉 READY! Your Paymee is working!');
    }
    
  } catch (error) {
    console.log('   ❌ API Error:', error.response?.data?.message || error.message);
  }
})();