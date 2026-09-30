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

    // Don't reveal whether account exists — always return success
    if (!user) {
      return NextResponse.json({ success: true, message: "If an account exists, you will receive a code." });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Remove any existing reset tokens for this email
    await VerificationToken.deleteMany({ email: user.email, type: "reset" });

    // Store hashed token (simple approach — store plain OTP with expiry)
    await VerificationToken.create({
      email: user.email,
      token: otp,
      type: "reset",
      expires,
    });

    // Send email
    const emailSent = await sendEmail({
      to: user.email,
      subject: "Manageo — Password Reset Code",
      htmlContent: `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; background: #0f1524; color: #e0e8f0; padding: 32px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; color: #7dd3fc; font-size: 20px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">Manageo</div>
          </div>
          <h2 style="text-align: center; color: #7dd3fc; margin-bottom: 8px;">Password Reset</h2>
          <p style="text-align: center; color: #a0b4c4; margin-bottom: 32px;">Enter this code to reset your password</p>
          <div style="background: #1a2438; border: 1px solid #2a3a48; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 0.5em; color: #7dd3fc;">${otp}</div>
            <p style="color: #a0b4c4; font-size: 12px; margin-top: 12px;">Expires in 15 minutes</p>
          </div>
          <p style="color: #a0b4c4; font-size: 12px; text-align: center;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "If an account exists, you will receive a code.",
      // Only in dev — remove in production
      _devOtp: process.env.NODE_ENV === "development" ? otp : undefined,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
