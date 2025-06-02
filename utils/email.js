import nodemailer from 'nodemailer'

// Create reusable transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

export const sendEmail = async (options) => {
    try {
        const mailOptions = {
            from: `Task Master <${process.env.EMAIL_USER}>`,
            to: options.email,
            subject: options.subject,
            html: options.html
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${options.email}`);
        return true;
    } catch (error) {
        console.error('Email send error:', error);
        return false;
    }
};