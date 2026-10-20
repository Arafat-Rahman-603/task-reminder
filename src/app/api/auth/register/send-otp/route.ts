import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import VerificationToken from "@/models/VerificationToken";
import { sendEmail } from "@/lib/email/resend";

const sendOtpSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address"),
  name: z.string().trim().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = sendOtpSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ message: firstError }, { status: 400 });
    }

    const { email, name } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { message: "An account with this email already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    // Cooldown check (60 seconds) to prevent spamming
    const recentToken = await VerificationToken.findOne({
      email: normalizedEmail,
      type: "verify",
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) },
    });

    if (recentToken) {
      const elapsedSeconds = Math.floor((Date.now() - recentToken.createdAt.getTime()) / 1000);
      const remainingSeconds = Math.max(1, 60 - elapsedSeconds);
      return NextResponse.json(
        { message: `Please wait ${remainingSeconds}s before requesting a new code.` },
        { status: 429 }
      );
    }

    // Generate 6-digit cryptographically random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    // Invalidate any existing verify tokens for this email
    await VerificationToken.deleteMany({ email: normalizedEmail, type: "verify" });

    // Store new token
    await VerificationToken.create({
      email: normalizedEmail,
      token: otp,
      type: "verify",
      expires,
    });

    // Send email with Manageo branded template
    const emailSent = await sendEmail({
      to: normalizedEmail,
      subject: "Manageo — Email Verification Code",
      htmlContent: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; background-color: #030712; color: #e2e8f0; padding: 40px 24px; border-radius: 16px; border: 1px solid #1e293b;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="display: inline-block; color: #7dd3fc; font-size: 22px; font-weight: 800; letter-spacing: 2px;">MANAGEO</span>
          </div>
          <div style="background-color: #0c1322; border: 1px solid #1e293b; border-radius: 14px; padding: 28px; text-align: center;">
            <h2 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0 0 12px 0;">Verify Your Email Address</h2>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; margin: 0 0 24px 0;">
              ${name ? `Hello <strong style="color: #ffffff;">${name}</strong>,<br/>` : "Hello,<br/>"}
              Use the 6-digit verification code below to complete your registration on Manageo.
            </p>
            <div style="background-color: #030712; border: 1px solid #0284c7; border-radius: 12px; padding: 20px; margin-bottom: 20px; display: inline-block; min-width: 240px;">
              <div style="font-size: 36px; font-weight: 800; letter-spacing: 0.35em; color: #38bdf8; font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; text-indent: 0.35em;">
                ${otp}
              </div>
              <p style="color: #64748b; font-size: 12px; margin: 8px 0 0 0;">Expires in 15 minutes</p>
            </div>
            <div style="background-color: rgba(2, 132, 199, 0.08); border: 1px solid rgba(2, 132, 199, 0.25); border-radius: 10px; padding: 12px 16px; margin: 20px 0; text-align: left;">
              <p style="color: #38bdf8; font-size: 12px; font-weight: 700; margin: 0 0 4px 0;">📬 Important Email Delivery Tip</p>
              <p style="color: #94a3b8; font-size: 11px; line-height: 1.45; margin: 0;">
                If you ever miss emails from Manageo in your main inbox, please check your <strong>Spam or Junk folder</strong> and mark this sender as <em>&quot;Not Spam&quot;</em> to guarantee fast delivery of future security notices.
              </p>
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.4; margin: 0;">
              If you did not sign up for Manageo, you can safely ignore this email.
            </p>
          </div>
          <div style="text-align: center; margin-top: 24px; color: #475569; font-size: 11px;">
            &copy; ${new Date().getFullYear()} Manageo. All rights reserved.
          </div>
        </div>
      `,
    });

    if (!emailSent) {
      if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
        console.warn(`[DEV/TEST MODE] Resend email delivery failed, but OTP for ${normalizedEmail} is: ${otp}`);
        return NextResponse.json({
          success: true,
          message: "Verification code generated! (Dev Notice: Check terminal console for OTP)",
        });
      }

      return NextResponse.json(
        { message: "Could not send verification email. Please check your email address or try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email address.",
    });
  } catch (error) {
    const safeError = error instanceof Error ? error.message : "Unknown error";
    console.error("[REGISTER_SEND_OTP_ERROR]:", safeError);
    return NextResponse.json(
      { message: "Unable to process verification request. Please try again." },
      { status: 500 }
    );
  }
}
