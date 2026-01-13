import nodemailer from 'nodemailer';
import twilio from 'twilio';

// --- EMAIL SETUP ---
// Create a "transporter" object using your Gmail App Password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends an email using Nodemailer.
 * @param {string} to - The recipient's email address.
 * @param {string} subject - The subject of the email.
 * @param {string} text - The plain text body of the email.
 */
export const sendEmail = async (to, subject, text) => {
  try {
    const mailOptions = {
      from: `"Booxclash Learn" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      text: text, // You can also use `html` for a formatted email
    };
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    // In a real app, you might add more robust error logging here
  }
};


// --- SMS SETUP ---
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * Sends an SMS using Twilio.
 * @param {string} to - The recipient's phone number (e.g., '+260971234567').
 * @param {string} body - The body of the text message.
 */
export const sendSms = async (to, body) => {
  try {
    await twilioClient.messages.create({
      body: body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });
    console.log(`SMS sent successfully to ${to}`);
  } catch (error) {
    console.error(`Error sending SMS to ${to}:`, error);
  }
};
