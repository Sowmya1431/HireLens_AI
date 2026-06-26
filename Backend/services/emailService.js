const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,     // your Gmail: mahanthisowmya35@gmail.com
    pass: process.env.EMAIL_PASS,     // Gmail App Password (NOT your normal password)
  },
});

/**
 * Sends the contact form message to your inbox.
 * @param {string} name    - Sender's name
 * @param {string} email   - Sender's email
 * @param {string} message - Their query / message
 */
const sendContactEmail = async (name, email, message) => {
  const mailOptions = {
    from: `"HireLensAI Contact" <${process.env.EMAIL_USER}>`,
    to: "mahanthisowmya35@gmail.com",
    subject: `New Contact Message from ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0084ff, #00d4ff); padding: 28px 32px;">
          <h1 style="margin: 0; color: #fff; font-size: 22px;">HireLens<span style="color: #001528;">AI</span></h1>
          <p style="margin: 6px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">New message from your contact form</p>
        </div>
        <div style="padding: 32px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #888; font-size: 13px; width: 100px; vertical-align: top;">Name</td>
              <td style="padding: 10px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">${name}</td>
            </tr>
            <tr style="border-top: 1px solid #f0f0f0;">
              <td style="padding: 10px 0; color: #888; font-size: 13px; vertical-align: top;">Email</td>
              <td style="padding: 10px 0;">
                <a href="mailto:${email}" style="color: #0084ff; font-size: 15px; text-decoration: none;">${email}</a>
              </td>
            </tr>
            <tr style="border-top: 1px solid #f0f0f0;">
              <td style="padding: 10px 0; color: #888; font-size: 13px; vertical-align: top;">Message</td>
              <td style="padding: 14px 0; color: #1a1a1a; font-size: 15px; line-height: 1.6; white-space: pre-line;">${message}</td>
            </tr>
          </table>
        </div>
        <div style="padding: 16px 32px; background: #f8f8f8; border-top: 1px solid #e0e0e0; text-align: center; color: #aaa; font-size: 12px;">
          Sent via HireLensAI Contact Form
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendContactEmail };