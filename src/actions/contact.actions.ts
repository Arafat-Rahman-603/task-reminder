"use server";

import dbConnect from "@/lib/db";
import ContactMessage from "@/models/ContactMessage";
import { sendEmail } from "@/lib/email/resend";

export async function submitContactForm(
  prevState: Record<string, unknown> | null | undefined,
  formData: FormData
) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const subject = formData.get("subject") as string;
    const message = formData.get("message") as string;

    if (!name || !email || !message) {
      return { success: false, error: "Please fill out all required fields." };
    }

    await dbConnect();

    // Persist contact inquiry in Database for Admin Panel viewing
    await ContactMessage.create({
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || undefined,
      subject: subject?.trim() || "Inquiry from Manageo Contact Form",
      message: message.trim(),
      status: "unread",
    });

    const receiverEmail =
      process.env.CONTACT_RECEIVER_EMAIL ||
      process.env.RESEND_SENDER_EMAIL ||
      "axiomixs@gmail.com";

    const htmlContent = `
      <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
        <h2 style="color: #0284c7;">New Contact Message on Manageo</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "N/A"}</p>
        <p><strong>Subject:</strong> ${subject || "N/A"}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
        <p><strong>Message:</strong></p>
        <p style="background: #f8fafc; padding: 12px; border-radius: 8px;">${message.replace(
          /\n/g,
          "<br>"
        )}</p>
        <p style="font-size: 12px; color: #64748b; margin-top: 20px;">This message has also been saved to your Manageo Admin Panel.</p>
      </div>
    `;

    if (receiverEmail) {
      await sendEmail({
        to: receiverEmail,
        subject: `Contact Form: ${subject || "New Message from " + name}`,
        htmlContent,
      }).catch((err) => {
        console.error("Failed to forward contact email:", err);
      });
    }

    return {
      success: true,
      message: "Your message has been received! Our team will get back to you shortly.",
    };
  } catch (error) {
    console.error("Contact Form Error:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}
