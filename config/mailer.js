// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: Number(process.env.SMTP_PORT || 465),
//     secure: process.env.SMTP_SECURE === "true",
//     auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASS,
//     },
// });

// const sendOtpEmail = async (email, otp) => {
//     return await transporter.sendMail({
//         from:
//             process.env.MAIL_FROM ||
//             process.env.SMTP_USER,

//         to: email,

//         subject: "Nifty Verse - Password Reset OTP",

//         text: `Your Nifty Verse password reset OTP is ${otp}. It is valid for 10 minutes. Do not share this code with anyone.`,

//         html: `
//             <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; background: #0D0D10; color: #ffffff; border-radius: 12px;">
//                 <h2 style="color: #A259FF;">Nifty Verse</h2>

//                 <h3>Password Reset Request</h3>

//                 <p>Use the OTP below to reset your password:</p>

//                 <div style="font-size: 30px; font-weight: bold; letter-spacing: 8px; padding: 20px; background: #1B1725; text-align: center; border-radius: 8px; color: #A259FF;">
//                     ${otp}
//                 </div>

//                 <p>This OTP is valid for 10 minutes.</p>

//                 <p style="color: #aaaaaa; font-size: 12px;">
//                     If you did not request a password reset, please ignore this email.
//                 </p>
//             </div>
//         `,
//     });
// };

// module.exports = {
//     transporter,
//     sendOtpEmail,
// };





const { google } = require("googleapis");

// Create Gmail API client
const createGmailClient = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (
        !clientId ||
        !clientSecret ||
        !refreshToken
    ) {
        throw new Error(
            "Gmail API credentials are missing from environment variables."
        );
    }

    const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret
    );

    oauth2Client.setCredentials({
        refresh_token: refreshToken,
    });

    return google.gmail({
        version: "v1",
        auth: oauth2Client,
    });
};

// Send password reset OTP email
const sendOtpEmail = async (email, otp) => {
    const senderEmail = process.env.GMAIL_USER;

    if (!senderEmail) {
        throw new Error(
            "GMAIL_USER is missing from environment variables."
        );
    }

    const gmail = createGmailClient();

    const subject = "Nifty Verse - Password Reset OTP";

    const textBody = [
        "Nifty Verse Password Reset",
        "",
        `Your password reset OTP is: ${otp}`,
        "",
        "This OTP is valid for 10 minutes.",
        "Do not share this code with anyone.",
        "",
        "If you did not request a password reset, ignore this email.",
    ].join("\n");

    const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; background: #0D0D10; color: #ffffff; border-radius: 12px;">
            <h2 style="color: #A259FF;">Nifty Verse</h2>

            <h3>Password Reset Request</h3>

            <p>Use the OTP below to reset your password:</p>

            <div style="font-size: 30px; font-weight: bold; letter-spacing: 8px; padding: 20px; background: #1B1725; text-align: center; border-radius: 8px; color: #A259FF;">
                ${otp}
            </div>

            <p>This OTP is valid for 10 minutes.</p>

            <p style="color: #aaaaaa; font-size: 12px;">
                If you did not request a password reset, please ignore this email.
            </p>
        </div>
    `;

    const boundary = `NiftyVerse_${Date.now()}`;

    const rawMessage = [
        `From: Nifty Verse <${senderEmail}>`,
        `To: ${email}`,
        `Subject: ${subject}`,
        "MIME-Version: 1.0",
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        "",
        `--${boundary}`,
        'Content-Type: text/plain; charset="UTF-8"',
        "Content-Transfer-Encoding: 7bit",
        "",
        textBody,
        "",
        `--${boundary}`,
        'Content-Type: text/html; charset="UTF-8"',
        "Content-Transfer-Encoding: 7bit",
        "",
        htmlBody,
        "",
        `--${boundary}--`,
        "",
    ].join("\r\n");

    const encodedMessage = Buffer
        .from(rawMessage)
        .toString("base64url");

    const response = await gmail.users.messages.send({
        userId: "me",
        requestBody: {
            raw: encodedMessage,
        },
    });

    console.log("Gmail API email submitted:", {
        messageId: response.data.id,
        recipient: email,
    });

    return {
        messageId: response.data.id,
        accepted: [email],
        rejected: [],
    };
};

module.exports = {
    sendOtpEmail,
};