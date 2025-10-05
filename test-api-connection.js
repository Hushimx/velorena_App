// Test script to check API connection in preview builds
// Run this in your app's console to debug API issues

console.log('🔍 TESTING API CONNECTION');
console.log('========================');

// Check API configuration
console.log('API URL:', process.env.EXPO_PUBLIC_API_URL || 'Not set');
console.log('Platform:', Platform.OS);
console.log('Is Device:', Device.isDevice);

// Test API connection
const testApiConnection = async () => {
  try {
    console.log('Testing API connection...');
    
    const response = await fetch('http://192.168.1.108:8000/api/test', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API connection successful!');
      console.log('Response:', data);
    } else {
      console.log('❌ API connection failed');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);
    }
  } catch (error) {
    console.error('❌ API connection error:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
  }
};

// Run the test
testApiConnection();

console.log('========================');
console.log('If you see connection errors, the preview build cannot reach your local server.');
console.log('This is common with preview builds and local development servers.');


