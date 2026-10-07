import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { name, email, password, timezone } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    await dbConnect();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "Email already in use" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      passwordHash,
      preferences: {
        timezone: timezone || "UTC",
      },
    });

    return NextResponse.json({ message: "User registered" }, { status: 201 });
  } catch (error) {
    // Only log the error category/message if it's an Error instance, avoid leaking full object structure
    const safeError = error instanceof Error ? error.message : "Unknown error";
    console.error("[REGISTER_ERROR] Failed to register user:", safeError);
    return NextResponse.json({ message: "Unable to create your account right now. Please try again." }, { status: 500 });
  }
}
