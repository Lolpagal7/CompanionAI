// This is a simple serverless function for Netlify (or Vercel, etc.)
// that will send an email using nodemailer. You must set up SMTP credentials in your environment variables.

const nodemailer = require("nodemailer");

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  const { message } = JSON.parse(event.body || "{}");
  if (!message) {
    return {
      statusCode: 400,
      body: "Missing message",
    };
  }

  // Configure your SMTP credentials in environment variables
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: "hello.companionai@gmail.com",
      subject: "Companion AI Enquiry",
      text: message,
    });
    return {
      statusCode: 200,
      body: JSON.stringify({ sent: true }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
