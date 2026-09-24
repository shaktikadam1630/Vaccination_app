import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/**
 * Send OTP email for password reset
 */
export async function sendPasswordResetOTP(toEmail, otp) {
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #2563eb;">Digital Vaccination Management System</h2>
            <h3>Password Reset Verification Code</h3>
            <p>You requested to reset your password. Use the verification code below to proceed:</p>
            <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 6px; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1e40af;">
                ${otp}
            </div>
            <p style="color: #6b7280; margin-top: 15px;">This code will expire in 15 minutes. If you did not request this, please ignore this email.</p>
        </div>
    `;

    try {
        if (!process.env.SMTP_USER || process.env.SMTP_USER.includes('example')) {
            console.log(`ℹ️ [SMTP MOCK] Password Reset OTP for ${toEmail}: ${otp}`);
            return true;
        }

        await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Digital Vaccination System" <noreply@vaccine.gov.in>',
            to: toEmail,
            subject: 'Password Reset Verification Code',
            html: htmlContent
        });
        console.log(`✅ Reset OTP email sent to ${toEmail}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send OTP email:', error.message);
        console.log(`ℹ️ [FALLBACK CONSOLE OTP] Code for ${toEmail}: ${otp}`);
        return false;
    }
}

/**
 * Send Vaccination Due Reminder Email
 */
export async function sendDoseReminderEmail(toEmail, parentName, childName, vaccineName, dueDate, centreName) {
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #059669;">Immunization Due Reminder</h2>
            <p>Dear <strong>${parentName}</strong>,</p>
            <p>This is an automated reminder that your child <strong>${childName}</strong> is due for the following vaccination:</p>
            
            <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0;">
                <p style="margin: 4px 0;"><strong>Vaccine:</strong> ${vaccineName}</p>
                <p style="margin: 4px 0;"><strong>Due Date:</strong> ${dueDate}</p>
                ${centreName ? `<p style="margin: 4px 0;"><strong>Preferred Centre:</strong> ${centreName}</p>` : ''}
            </div>

            <p>Please visit your designated healthcare centre promptly to maintain full immunization coverage.</p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">Digital Vaccination Management System — Official Health Reminder</p>
        </div>
    `;

    try {
        if (!process.env.SMTP_USER || process.env.SMTP_USER.includes('example')) {
            console.log(`ℹ️ [SMTP MOCK] Due reminder for ${childName} sent to ${toEmail}`);
            return true;
        }

        await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Digital Vaccination System" <noreply@vaccine.gov.in>',
            to: toEmail,
            subject: `Upcoming Vaccination Reminder for ${childName}`,
            html: htmlContent
        });
        console.log(`✅ Dose reminder email sent to ${toEmail}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send reminder email:', error.message);
        return false;
    }
}
