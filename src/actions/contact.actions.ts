"use server";

import { sendEmail } from "@/lib/email/brevo";

export async function submitContactForm(prevState: Record<string, unknown> | null | undefined, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const subject = formData.get("subject") as string;
    const message = formData.get("message") as string;

    if (!name || !email || !message) {
      return { success: false, error: "Please fill out all required fields." };
    }

    const receiverEmail = process.env.CONTACT_RECEIVER_EMAIL;
    if (!receiverEmail) {
      console.error("CONTACT_RECEIVER_EMAIL is not configured.");
      return { success: false, error: "System is not configured to receive messages at this time." };
    }

    const htmlContent = `
      <h2>New Contact Request</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || "N/A"}</p>
      <p><strong>Subject:</strong> ${subject || "N/A"}</p>
      <hr />
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, "<br>")}</p>
    `;

    const emailSent = await sendEmail({
      to: receiverEmail,
      subject: `Contact Form: ${subject || "New Message from " + name}`,
      htmlContent,
    });

    if (!emailSent) {
      return { success: false, error: "Failed to send message via the email provider." };
    }

    return { success: true, message: "Your message has been sent successfully!" };
  } catch (error) {
    console.error("Contact Form Error:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}
