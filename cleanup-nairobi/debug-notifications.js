/**
 * Debug script for notification system
 * Run this in the browser console to test the API calls
 */

// Test the notification API calls
async function debugNotifications() {
  console.log('🔍 Debugging Notification System...\n');

  try {
    // Check if notificationsAPI is available
    if (typeof notificationsAPI === 'undefined') {
      console.error('❌ notificationsAPI is not available');
      console.log('💡 Make sure you\'re on a page where the API is imported');
      return;
    }

    console.log('✅ notificationsAPI is available');
    console.log('📋 Available methods:', Object.keys(notificationsAPI));

    // Test getCounts
    console.log('\n🧪 Testing getCounts...');
    try {
      const countsResult = await notificationsAPI.getCounts();
      console.log('✅ getCounts SUCCESS:', countsResult);
    } catch (error) {
      console.error('❌ getCounts FAILED:', error);
    }

    // Test getNotifications
    console.log('\n🧪 Testing getNotifications...');
    try {
      const notifsResult = await notificationsAPI.getNotifications({ limit: 5 });
      console.log('✅ getNotifications SUCCESS:', notifsResult);
    } catch (error) {
      console.error('❌ getNotifications FAILED:', error);
    }

    // Test getAll (alternative)
    console.log('\n🧪 Testing getAll...');
    try {
      const allResult = await notificationsAPI.getAll({ limit: 5 });
      console.log('✅ getAll SUCCESS:', allResult);
    } catch (error) {
      console.error('❌ getAll FAILED:', error);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Instructions
console.log('🔧 Notification Debug Tool');
console.log('📋 Instructions:');
console.log('1. Open the admin dashboard in your browser');
console.log('2. Open browser console (F12)');
console.log('3. Copy and paste this entire script');
console.log('4. Run: debugNotifications()');
console.log('');

// Make function available globally
if (typeof window !== 'undefined') {
  window.debugNotifications = debugNotifications;
}

export { debugNotifications };