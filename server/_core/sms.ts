import twilio from 'twilio';

/**
 * Send SMS notification using Twilio
 * 
 * Required environment variables:
 * - TWILIO_ACCOUNT_SID: Your Twilio Account SID
 * - TWILIO_AUTH_TOKEN: Your Twilio Auth Token
 * - TWILIO_PHONE_NUMBER: Your Twilio phone number (format: +1234567890)
 * - NOTIFICATION_PHONE_NUMBER: Recipient phone number (format: +1234567890)
 */

interface SendSMSParams {
  message: string;
}

export async function sendSMS({ message }: SendSMSParams): Promise<boolean> {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;
    const toPhone = process.env.NOTIFICATION_PHONE_NUMBER;

    // Check if all required credentials are present
    if (!accountSid || !authToken || !fromPhone || !toPhone) {
      console.warn('[SMS] Twilio credentials not configured. Skipping SMS notification.');
      console.warn('[SMS] Required env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, NOTIFICATION_PHONE_NUMBER');
      return false;
    }

    // Initialize Twilio client
    const client = twilio(accountSid, authToken);

    // Send SMS
    const result = await client.messages.create({
      body: message,
      from: fromPhone,
      to: toPhone,
    });

    console.log(`[SMS] Message sent successfully. SID: ${result.sid}`);
    return true;
  } catch (error) {
    console.error('[SMS] Failed to send SMS:', error);
    return false;
  }
}
