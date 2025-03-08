import { VERIFICATION_EMAIL_TEMPLATE } from "../constants/emailTemplates";
import createTransporter from "./nodemailer.config";


export const sendVerificationEmail = async (email: string, otpCode: string, name: string) => {
    const recipient = [{ email }];

    try {
        const transporter = await createTransporter();
        const mailOptions = {
            from: `Khaled <${process.env.USER_EMAIL}>`,
            to: recipient[0].email,
            subject: "Verify your email",
            html: VERIFICATION_EMAIL_TEMPLATE
                .replace("{verificationCode}", otpCode)
                .replace("{name}", name),
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        throw new Error(`Error sending verification email: ${error}`);
    }
};