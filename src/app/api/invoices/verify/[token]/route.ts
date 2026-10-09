import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await dbConnect();
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const invoice = await Invoice.findOne({ qrVerificationToken: token }).lean();

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found or invalid token" }, { status: 404 });
    }

    // Minimal public verification payload
    const payload = {
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      issueDate: invoice.issueDate,
      clientName: invoice.clientName,
      totalAmount: invoice.totalAmount?.toString(),
      currency: invoice.currency,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
