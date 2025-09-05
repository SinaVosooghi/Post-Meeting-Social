/**
 * Manual Authentication Test Script
 * Post-Meeting Social Media Content Generator
 *
 * Simple script to test authentication endpoints
 */

const BASE_URL = 'http://localhost:3002';

async function testAuthEndpoints() {
  console.log('🧪 Testing Authentication System...\n');

  try {
    // Test 1: Check if the main page loads
    console.log('1. Testing main page...');
    const mainResponse = await fetch(`${BASE_URL}/`);
    console.log(`   Status: ${mainResponse.status}`);
    console.log(`   Content-Type: ${mainResponse.headers.get('content-type')}`);
    
    if (mainResponse.ok) {
      console.log('   ✅ Main page loads successfully');
    } else {
      console.log('   ❌ Main page failed to load');
    }

    // Test 2: Check sign-in page
    console.log('\n2. Testing sign-in page...');
    const signInResponse = await fetch(`${BASE_URL}/auth/signin`);
    console.log(`   Status: ${signInResponse.status}`);
    
    if (signInResponse.ok) {
      console.log('   ✅ Sign-in page loads successfully');
    } else {
      console.log('   ❌ Sign-in page failed to load');
    }

    // Test 3: Check NextAuth API endpoint
    console.log('\n3. Testing NextAuth API...');
    const authResponse = await fetch(`${BASE_URL}/api/auth/providers`);
    console.log(`   Status: ${authResponse.status}`);
    
    if (authResponse.ok) {
      const providers = await authResponse.json();
      console.log('   ✅ NextAuth API responds');
      console.log(`   Available providers: ${Object.keys(providers).join(', ')}`);
    } else {
      console.log('   ❌ NextAuth API failed');
    }

    // Test 4: Check error page
    console.log('\n4. Testing error page...');
    const errorResponse = await fetch(`${BASE_URL}/auth/error`);
    console.log(`   Status: ${errorResponse.status}`);
    
    if (errorResponse.ok) {
      console.log('   ✅ Error page loads successfully');
    } else {
      console.log('   ❌ Error page failed to load');
    }

    console.log('\n🎉 Authentication system test completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Open http://localhost:3002 in your browser');
    console.log('   2. Click "Sign In" to test Google OAuth');
    console.log('   3. Verify the authentication flow works');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the dev server is running:');
    console.log('   yarn dev --port 3002');
  }
}

// Run the test
testAuthEndpoints();
