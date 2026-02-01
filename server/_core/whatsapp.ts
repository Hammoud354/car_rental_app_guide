import twilio from 'twilio';

/**
 * Send WhatsApp notification using Twilio WhatsApp API
 * 
 * Required environment variables:
 * - TWILIO_ACCOUNT_SID: Your Twilio Account SID
 * - TWILIO_AUTH_TOKEN: Your Twilio Auth Token
 * - TWILIO_WHATSAPP_NUMBER: Twilio WhatsApp number (format: whatsapp:+14155238886 for sandbox)
 * - NOTIFICATION_PHONE_NUMBER: Recipient phone number (format: +96176354131)
 * 
 * Setup Instructions:
 * 1. Sign up for Twilio at https://www.twilio.com/try-twilio
 * 2. Go to Messaging > Try it out > Send a WhatsApp message
 * 3. Join the sandbox by sending the code from WhatsApp to +1 415 523 8886
 * 4. Use "whatsapp:+14155238886" as TWILIO_WHATSAPP_NUMBER
 * 5. Your recipient number will be in format "whatsapp:+96176354131"
 */

interface SendWhatsAppParams {
  message: string;
}

export async function sendWhatsApp({ message }: SendWhatsAppParams): Promise<boolean> {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Default to Twilio sandbox
    const toPhone = process.env.NOTIFICATION_PHONE_NUMBER;

    // Check if all required credentials are present
    if (!accountSid || !authToken || !toPhone) {
      console.warn('[WhatsApp] Twilio credentials not configured. Skipping WhatsApp notification.');
      console.warn('[WhatsApp] Required env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, NOTIFICATION_PHONE_NUMBER');
      console.warn('[WhatsApp] Optional: TWILIO_WHATSAPP_NUMBER (defaults to sandbox: whatsapp:+14155238886)');
      return false;
    }

    // Initialize Twilio client
    const client = twilio(accountSid, authToken);

    // Format recipient number for WhatsApp
    const toWhatsApp = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone}`;

    // Send WhatsApp message
    const result = await client.messages.create({
      body: message,
      from: fromWhatsApp,
      to: toWhatsApp,
    });

    console.log(`[WhatsApp] Message sent successfully. SID: ${result.sid}`);
    return true;
  } catch (error) {
    console.error('[WhatsApp] Failed to send WhatsApp message:', error);
    return false;
  }
}
