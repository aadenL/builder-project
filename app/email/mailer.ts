import "server-only";

// nodemailer sends the email through SMTP
// SMTP stands for Simple Mail Transfer Protocol, which is the standard protocol to send an email
import nodemailer from "nodemailer";

// read the SMTP credentials for the env file
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;

if (!smtpUser || !smtpPassword) {
  throw new Error("Missing GMAIL SMTP credentials");
}

// createTransport() creates a reusable Nodemailer transporter
export const mailer = nodemailer.createTransport({
  // select the SMTP server
  host: process.env.SMTP_HOST ?? "smtp.gmail.com",
  // environment variables are always strings so Number() converts the port into a number
  port: Number(process.env.SMTP_PORT || 465),
  // tells Nodemailer to use TLS when connecting
  secure: true,

  // credentials are sent to the SMTP server for authentication
  auth: {
    // usually the full Gmail address
    user: smtpUser,
    // the app password
    pass: smtpPassword,
  },

  // Nodemailer will wait up to 15,000 milliseconds to establish server connection
  connectionTimeout: 15_000,
  // after connecting, Nodemailer waits up to 15 seconds for the SMTP server's greeting
  greetingTimeout: 15_000,
  // socket may remain inactive for up to 30 sec before Nodemailer treats the connection as timed out
  socketTimeout: 30_000,
});
