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
  const BREVO_API_KEY = process.env.BREVO_API_KEY as string;
  const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "noreply@personalos.com";
  const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || "Manageo";

  if (!BREVO_API_KEY) {
    console.warn("BREVO_API_KEY is not defined. Email will not be sent.");
    return false;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
        to: [{ email: to }],
        subject,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Brevo Email Error:", errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}
