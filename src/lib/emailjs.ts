// lib/email.ts
import emailjs from '@emailjs/browser';

// Initialize EmailJS with your service ID, template ID, and user ID

// Send OTP email
export const sendOTPEmail = async (email: string, otp: string, name: string): Promise<boolean> => {
  try {
    const templateParams = {
      to_email: email,
      to_name: name,
      otp: otp,
      from_name: 'Judicial Management System',
      message: 'Your OTP for account verification is:'
    };

    console.log('Sending email with params:', templateParams);

    const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, USER_ID);
    console.log('Email sent successfully:', response);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
};

// Send welcome email
export const sendWelcomeEmail = async (email: string, name: string): Promise<boolean> => {
  try {
    const templateParams = {
      to_email: email,
      to_name: name,
      from_name: 'Judicial Management System',
      message: 'Welcome to the Judicial Management System!'
    };

    console.log('Sending welcome email with params:', templateParams);

    const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, USER_ID);
    console.log('Welcome email sent successfully:', response);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};
