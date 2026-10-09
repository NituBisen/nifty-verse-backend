const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sendOtpEmail = async (email, otp) => {
    return await transporter.sendMail({
        from:
            process.env.MAIL_FROM ||
            process.env.SMTP_USER,

        to: email,

        subject: "Nifty Verse - Password Reset OTP",

        text: `Your Nifty Verse password reset OTP is ${otp}. It is valid for 10 minutes. Do not share this code with anyone.`,

        html: `
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
        `,
    });
};

module.exports = {
    transporter,
    sendOtpEmail,
};