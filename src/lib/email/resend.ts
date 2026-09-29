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
  
  const fromEmail = RESEND_SENDER_EMAIL.endsWith("@gmail.com") ? "onboarding@resend.dev" : RESEND_SENDER_EMAIL;

  try {
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

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Resend Email Error:", errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}
