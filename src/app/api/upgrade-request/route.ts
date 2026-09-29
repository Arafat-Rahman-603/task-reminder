import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, email, company, plan } = await req.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const senderEmail = process.env.RESEND_SENDER_EMAIL || "axiomixs@gmail.com";
    const senderName = process.env.RESEND_SENDER_NAME || "AXIOMIXS";

    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not set in environment variables");
      return NextResponse.json(
        { error: "Email service is not configured" },
        { status: 500 }
      );
    }

    const targetEmail = "axiomixs@gmail.com";
    
    // Resend strongly recommends using onboarding@resend.dev if domain isn't verified
    // We'll use the one from env, but if it's a gmail, it might fail unless verified or we use the default
    const fromEmail = senderEmail.endsWith("@gmail.com") ? "onboarding@resend.dev" : senderEmail;

    const payload = {
      from: `${senderName} <${fromEmail}>`,
      to: [targetEmail],
      reply_to: email, // so they can reply to the user
      subject: `New Upgrade Request: ${plan} Plan`,
      html: `
        <h2>New Upgrade Request</h2>
        <p>A user has requested an upgrade to the <strong>${plan}</strong> plan.</p>
        <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 600px;">
          <tr>
            <td style="background-color: #f4f4f4; width: 30%;"><strong>Name</strong></td>
            <td>${name}</td>
          </tr>
          <tr>
            <td style="background-color: #f4f4f4;"><strong>Email</strong></td>
            <td>${email}</td>
          </tr>
          <tr>
            <td style="background-color: #f4f4f4;"><strong>Company</strong></td>
            <td>${company || "N/A"}</td>
          </tr>
          <tr>
            <td style="background-color: #f4f4f4;"><strong>Requested Plan</strong></td>
            <td>${plan}</td>
          </tr>
        </table>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">This is an automated message from the Manageo application.</p>
      `,
    };

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Resend API error:", errorData);
      throw new Error("Failed to send email via Resend");
    }

    return NextResponse.json(
      { message: "Upgrade request sent successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in upgrade-request API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
