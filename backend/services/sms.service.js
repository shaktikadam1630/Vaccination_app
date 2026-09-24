/**
 * Send SMS notification to Parent mobile phone number
 * @param {string} phone Parent's mobile number
 * @param {string} message SMS message body
 */
export async function sendSMSNotification(phone, message) {
    try {
        // Log SMS dispatch to console (mock SMS Gateway / ready for Twilio/Msg91 integration)
        console.log(`📱 [SMS DISPATCH] To: ${phone} | Message: "${message}"`);
        return true;
    } catch (error) {
        console.error(`❌ SMS Dispatch Error for ${phone}:`, error.message);
        return false;
    }
}
