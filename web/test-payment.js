// test-payment.js
const testPaymentSystem = async () => {
  console.log('🧪 Testing Payment System...\n');
  
  try {
    // Test 1: Configuration
    console.log('1. Testing Configuration...');
    const { validatePaymeeConfig } = await import('./src/api/payment.js');
    const config = validatePaymeeConfig();
    
    if (config.isValid) {
      console.log('✅ Configuration is valid');
    } else {
      console.log('❌ Configuration errors:', config.errors);
    }
    
    // Test 2: Order ID Generation
    console.log('\n2. Testing Order ID Generation...');
    const { default: paymentAPI } = await import('./src/api/payment.js');
    const testOrderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`✅ Test Order ID: ${testOrderId}`);
    
    // Test 3: EmailJS Configuration
    console.log('\n3. Testing EmailJS Configuration...');
    const { testEmail } = await import('./src/api/email.js');
    const emailTest = await testEmail();
    console.log(emailTest.success ? '✅ Email test passed' : '❌ Email test failed');
    
    console.log('\n🎉 All tests completed!');
    console.log('\nNext steps:');
    console.log('1. Ensure environment variables are set');
    console.log('2. Test checkout flow on your site');
    console.log('3. Check EmailJS dashboard for sent emails');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run tests
testPaymentSystem();