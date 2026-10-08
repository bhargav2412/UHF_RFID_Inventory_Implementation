import * as twilio from 'twilio';


export class SmsUtil {
    private client: twilio.Twilio;
    private readonly twilioNumber: string;
    constructor() {
        const accountSid = process.env.TWILLIO_SID;
        const authToken = process.env.TWILLIO_TOKEN;
        this.client = twilio(accountSid, authToken);
        this.twilioNumber = process.env.TWILLIO_PHONE;
    }

    async sendOTP(to: string, otp: number): Promise<void> {
        try {
            const message = await this.client.messages.create({
                body: `Your OTP code is ${otp}`,
                to: "+91" + to,
                from: this.twilioNumber
            });
            console.log(`Message sent: ${message.sid}`);
        } catch (error) {
            console.error('Error sending OTP:', error);
        }
    }
}