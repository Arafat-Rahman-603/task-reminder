import { env } from "@/lib/env";

export async function sendEmail({
  to,
  subject,
  htmlContent,
}: {
  to: string;
  subject: string;
  htmlContent: string;
}) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY as string;
  const RESEND_SENDER_EMAIL = process.env.RESEND_SENDER_EMAIL || "axiomixs@gmail.com";
  const RESEND_SENDER_NAME = process.env.RESEND_SENDER_NAME || "AXIOMIXS";

  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not defined. Email will not be sent.");
    return false;
  }
  
  // Resend strongly recommends using onboarding@resend.dev if domain isn't verified
  const fromEmail = RESEND_SENDER_EMAIL.endsWith("@gmail.com") ? "onboarding@resend.dev" : RESEND_SENDER_EMAIL;

  try {
    console.log("Attempting to send email via Resend API...");
    console.log("Sender:", fromEmail);
    console.log("Recipient:", to);
    
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${RESEND_SENDER_NAME} <${fromEmail}>`,
        to: [to],
        subject,
        html: htmlContent,
      }),
    });

    console.log("Resend API HTTP Status:", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Resend Email Error (Full Response):", JSON.stringify(errorData, null, 2));
      return false;
    }

    console.log("Resend Email Sent Successfully!");
    return true;
  } catch (error) {
    console.error("Failed to send email via Resend:", error);
    return false;
  }
}
