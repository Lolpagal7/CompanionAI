import emailjs from "@emailjs/browser";
import {
  EMAILJS_USER_ID,
  EMAILJS_SERVICE_ID,
  EMAILJS_TEMPLATE_ID,
  MENTAL_HEALTH_SERVICE_ID,
  MENTAL_HEALTH_TEMPLATE_ID,
} from "../emailjs.config";

export async function sendContactEmail({ user_name, user_email, message }: { user_name: string; user_email: string; message: string }) {
  return emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    {
      user_name,
      user_email,
      user_message: message, // Use user_message for EmailJS template
    },
    EMAILJS_USER_ID
  );
}

export async function sendMentalHealthAdvice({ 
  user_name, 
  user_email, 
  user_advice 
}: { 
  user_name: string; 
  user_email: string; 
  user_advice: string;
}) {
  return emailjs.send(
    MENTAL_HEALTH_SERVICE_ID,
    MENTAL_HEALTH_TEMPLATE_ID,
    {
      user_name,
      user_email,
      user_advice, // The mental health advice content
    },
    EMAILJS_USER_ID
  );
}
