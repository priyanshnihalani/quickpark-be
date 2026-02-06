import nodemailer from "nodemailer";

export const sendTicketEmail = async ({ to, ticket }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", 
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });

  const html = `
    <h2>Parking Ticket Confirmed</h2>
    <p><b>Ticket ID:</b> ${ticket.ticketId}</p>
    <p><b>Parking ID:</b> ${ticket.parkingId}</p>
    <p><b>Amount:</b> $${ticket.amount}</p>
    <p><b>Date:</b> ${new Date(ticket.time).toLocaleString()}</p>
    <p>Please keep this email for exit verification.</p>
  `;

  await transporter.sendMail({
    from: "Parking System <no-reply@parking.com>",
    to,
    subject: "Your Parking Ticket",
    html
  });
};
