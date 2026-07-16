const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const dotenv = require("dotenv");
dotenv.config();


// ===============================
// ENV VARIABLES
// ===============================
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = "https://developers.google.com/oauthplayground";
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const EMAIL_USER = process.env.EMAIL_USER;

// ===============================
// OAUTH2 CLIENT
// ===============================
const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

oauth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN,
});

// ===============================
// CREATE TRANSPORTER
// ===============================
async function createTransporter() {
    try {
        const accessTokenResponse = await oauth2Client.getAccessToken();
                
          
        return nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: EMAIL_USER,
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessTokenResponse.token,
            },
            
        });
   
    } catch (error) {
        console.error("OAuth Error:", error);
        throw error;
    }
}

// =========================================================================
// 2. HTML EMAIL TEMPLATE BUILDER
// =========================================================================
const getBaseHtmlTemplate = (title, content) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #0b0f19; padding: 40px 0; }
        .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #111827 0%, #0f172a 100%); border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.3); }
        .header { background: linear-gradient(90deg, #7c3aed 0%, #db2777 100%); padding: 30px; text-align: center; }
        .logo-text { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 1px; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .content { padding: 40px 30px; color: #cbd5e1; line-height: 1.6; font-size: 16px; }
        .footer { padding: 20px 30px; text-align: center; border-top: 1px solid #1e293b; color: #64748b; font-size: 12px; }
        .button { display: inline-block; padding: 12px 30px; margin: 25px 0; background: linear-gradient(90deg, #7c3aed 0%, #c084fc 100%); color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 600; text-align: center; transition: all 0.3s ease; box-shadow: 0 10px 15px -3px rgba(124, 58, 237, 0.3); }
        h1 { color: #ffffff; font-size: 22px; font-weight: 700; margin-top: 0; margin-bottom: 20px; }
        p { margin-top: 0; margin-bottom: 15px; }
        strong { color: #f8fafc; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1 class="logo-text">AuraDev</h1>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} AuraDev. All rights reserved.</p>
            <p>If you have any questions, contact us at support@auradev.com</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// =========================================================================
// 3. THE FOUR CORE EMAIL SENDING FUNCTIONS
// =========================================================================

/**
 * 1. Send OTP Verification Email
 */
const sendVerificationOtp = async (toEmail, fullName, otp) => {
  const content = `
    <h1>Verify Your Email</h1>
    <p>Hello <strong>${fullName}</strong>,</p>
    <p>Thank you for signing up with AuraDev. To complete your registration, please verify your email address using the one-time password (OTP) below:</p>
    <div style="background-color: #020617; border: 1px dashed #7c3aed; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0;">
      <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #a78bfa; font-family: monospace;">${otp}</span>
    </div>
    <p style="font-size: 13px; color: #64748b;">This code is valid for the next 10 minutes. If you did not request this code, you can safely ignore this email.</p>
  `;

  const html = getBaseHtmlTemplate('Email Verification OTP', content);

  const mailOptions = {
    from: `"AuraDev Security" <${EMAIL_USER}>`,
    to: toEmail,
    subject: `[AuraDev] Email Verification OTP - ${otp}`,
    html: html,
  };

  const transporter = await createTransporter();
return await transporter.sendMail(mailOptions);
};

/**
 * 2. Send OTP Verification Success / Welcome Email
 */
const sendVerificationSuccess = async (toEmail, fullName) => {
  const content = `
    <h1>Verification Successful!</h1>
    <p>Hello <strong>${fullName}</strong>,</p>
    <p>Your email address has been successfully verified. Welcome to AuraDev! We're excited to have you on board.</p>
    <p>You now have full access to our developer dashboard, unified insights engine, and blazing-fast deployment features.</p>
    <div style="text-align: center;">
      <a href="https://auradev.com/dashboard" class="button">Go to Dashboard</a>
    </div>
  `;

  const html = getBaseHtmlTemplate('Email Verification Success', content);

  const mailOptions = {
    from: `"AuraDev Welcome" <${EMAIL_USER}>`,
    to: toEmail,
    subject: 'Welcome to AuraDev - Verification Successful!',
    html: html,
  };

  const transporter = await createTransporter();
return await transporter.sendMail(mailOptions);
};

/**
 * 3. Send Transaction Debit Alert Email
 */
const sendTransactionDebit = async (toEmail, fullName, txDetails) => {
  const content = `
    <h1>Transaction Notification</h1>
    <p>Hello <strong>${fullName}</strong>,</p>
    <p>This is a notification that your account has been <strong>debited from</strong>.</p>
    
    <div style="background-color: #020617; border: 1px solid #1e293b; border-radius: 12px; padding: 25px; margin: 25px 0;">
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Transaction Type</td>
          <td style="padding: 6px 0; font-weight: 700; color: #ffffff; text-transform: uppercase;">DEBIT</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Amount</td>
          <td style="padding: 6px 0; font-weight: 800; font-size: 18px; color: #ef4444;">
            -${txDetails.currency || 'USD'} ${Number(txDetails.amount).toFixed(2)}
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Reference ID</td>
          <td style="padding: 6px 0; font-family: monospace; color: #cbd5e1;">${txDetails.reference}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Date & Time</td>
          <td style="padding: 6px 0; color: #cbd5e1;">${new Date().toLocaleString()}</td>
        </tr>
        <tr style="border-top: 1px solid #1e293b;">
          <td style="padding: 12px 0 0 0; color: #64748b; font-size: 14px;">Available Balance</td>
          <td style="padding: 12px 0 0 0; font-weight: 700; color: #38bdf8; font-size: 16px;">
            ${txDetails.currency || 'USD'} ${Number(txDetails.balance).toFixed(2)}
          </td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #64748b;">If this transaction was not authorized by you, please contact our fraud response unit immediately.</p>
  `;

  const html = getBaseHtmlTemplate('Account Debited Alert', content);

  const mailOptions = {
    from: `"AuraDev Banking Alert" <${EMAIL_USER}>`,
    to: toEmail,
    subject: `[Transaction Alert] Account Debited - ${txDetails.currency} ${txDetails.amount}`,
    html: html,
  };

 const transporter = await createTransporter();
return await transporter.sendMail(mailOptions);
};

/**
 * 4. Send Transaction Credit Alert Email
 */
const sendTransactionCredit = async (toEmail, fullName, txDetails) => {
  const content = `
    <h1>Transaction Notification</h1>
    <p>Hello <strong>${fullName}</strong>,</p>
    <p>This is a notification that your account has been <strong>credited to</strong>.</p>
    
    <div style="background-color: #020617; border: 1px solid #1e293b; border-radius: 12px; padding: 25px; margin: 25px 0;">
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Transaction Type</td>
          <td style="padding: 6px 0; font-weight: 700; color: #ffffff; text-transform: uppercase;">CREDIT</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Amount</td>
          <td style="padding: 6px 0; font-weight: 800; font-size: 18px; color: #10b981;">
            +${txDetails.currency || 'USD'} ${Number(txDetails.amount).toFixed(2)}
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Reference ID</td>
          <td style="padding: 6px 0; font-family: monospace; color: #cbd5e1;">${txDetails.reference}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Date & Time</td>
          <td style="padding: 6px 0; color: #cbd5e1;">${new Date().toLocaleString()}</td>
        </tr>
        <tr style="border-top: 1px solid #1e293b;">
          <td style="padding: 12px 0 0 0; color: #64748b; font-size: 14px;">Available Balance</td>
          <td style="padding: 12px 0 0 0; font-weight: 700; color: #38bdf8; font-size: 16px;">
            ${txDetails.currency || 'USD'} ${Number(txDetails.balance).toFixed(2)}
          </td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #64748b;">If this transaction was not authorized by you, please contact our fraud response unit immediately.</p>
  `;

  const html = getBaseHtmlTemplate('Account Credited Alert', content);

  const mailOptions = {
    from: `"AuraDev Banking Alert" <${EMAIL_USER}>`,
    to: toEmail,
    subject: `[Transaction Alert] Account Credited - ${txDetails.currency} ${txDetails.amount}`,
    html: html,
  };

  const transporter = await createTransporter();
return await transporter.sendMail(mailOptions);
};

// =========================================================================
// 4. MODULE EXPORTS
// =========================================================================
module.exports = {
  sendVerificationOtp,
  sendVerificationSuccess,
  sendTransactionDebit,
  sendTransactionCredit,
 
};

// =========================================================================
// 5. TEST RUNNER (Execute directly using `node sendemail.js`)
// =========================================================================



