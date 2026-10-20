import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import VerificationToken from "@/models/VerificationToken";
import { sendEmail } from "@/lib/email/resend";

// POST /api/auth/forgot-password
export async function POST(req: NextRequest) {
  try {
    console.log("=== FORGOT PASSWORD REQUEST RECEIVED ===");
    const { email } = await req.json();
    console.log("Requested Email:", email);

    if (!email || typeof email !== "string") {
      console.log("Error: Invalid email format or missing email");
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await dbConnect();
    console.log("Connected to Database");

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    console.log("User lookup result:", user ? "User Found" : "User Not Found");

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email address. Please check your email or sign up." },
        { status: 404 }
      );
    }

    if (user.provider === "google" && !user.passwordHash) {
      return NextResponse.json(
        { error: "This account was created with Google Sign-In. Please use 'Continue with Google' to sign in." },
        { status: 400 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Remove any existing reset tokens for this email
    await VerificationToken.deleteMany({ email: user.email.toLowerCase().trim(), type: "reset" });

    // Store token with expiry
    await VerificationToken.create({
      email: user.email.toLowerCase().trim(),
      token: otp,
      type: "reset",
      expires,
    });

    // Send email
    const emailSent = await sendEmail({
      to: user.email,
      subject: "Manageo — Password Reset Code",
      htmlContent: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; background: #0f1524; color: #e0e8f0; padding: 32px; border-radius: 16px; border: 1px solid #2a3a48;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; color: #7dd3fc; font-size: 20px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">Manageo</div>
          </div>
          <h2 style="text-align: center; color: #7dd3fc; margin-bottom: 8px;">Password Reset Code</h2>
          <p style="text-align: center; color: #a0b4c4; margin-bottom: 32px; font-size: 14px;">Enter this 6-digit code to reset your account password.</p>
          <div style="background: #1a2438; border: 1px solid #2a3a48; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 0.5em; color: #7dd3fc; font-family: monospace;">${otp}</div>
            <p style="color: #a0b4c4; font-size: 12px; margin-top: 12px;">Expires in 15 minutes</p>
          </div>
          <div style="background-color: rgba(2, 132, 199, 0.08); border: 1px solid rgba(2, 132, 199, 0.25); border-radius: 10px; padding: 12px 16px; margin-bottom: 20px; text-align: left;">
            <p style="color: #38bdf8; font-size: 12px; font-weight: 700; margin: 0 0 4px 0;">📬 Missing from your inbox?</p>
            <p style="color: #94a3b8; font-size: 11px; line-height: 1.45; margin: 0;">
              Please check your <strong>Spam or Junk folder</strong> and mark this email as <em>&quot;Not Spam&quot;</em> to ensure uninterrupted access.
            </p>
          </div>
          <p style="color: #a0b4c4; font-size: 12px; text-align: center;">If you didn't request this code, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (!emailSent) {
      console.error("Failed to send password reset email via Resend to", user.email);
      return NextResponse.json(
        { error: "Could not deliver email. Please try again or contact support." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email address.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
