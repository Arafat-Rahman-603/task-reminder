import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import Transaction from "@/models/Transaction";
import { generateInvoicePdfBuffer } from "@/lib/pdfGenerator";
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "demo",
  api_key: process.env.CLOUDINARY_API_KEY || "1234567890",
  api_secret: process.env.CLOUDINARY_API_SECRET || "dummy_secret",
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;
    const { id } = await params;

    const invoice = await Invoice.findOne({ _id: id, userId });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found or unauthorized" }, { status: 404 });
    }

    if (invoice.transactionId) {
      const transaction = await Transaction.findOne({ _id: invoice.transactionId, userId });
      if (!transaction) {
        return NextResponse.json({ error: "Unauthorized access to underlying transaction" }, { status: 403 });
      }
    }

    // Reuse existing PDF if already generated
    if (invoice.pdfPublicId) {
      const signedUrl = cloudinary.url(invoice.pdfPublicId, {
        type: "authenticated",
        sign_url: true,
        resource_type: "image",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      });
      const response = NextResponse.redirect(signedUrl);
      response.headers.set('Cache-Control', 'no-store, max-age=0');
      return response;
    }

    // Generate new PDF
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/api/invoices/verify/${invoice.qrVerificationToken}`;
    
    const pdfBuffer = await generateInvoicePdfBuffer(invoice, verificationUrl);

    // Upload to Cloudinary
    const publicId = await new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'manageo/invoices',
          resource_type: 'image',
          format: 'pdf',
          type: 'authenticated',
          public_id: invoice._id.toString(),
        },
        (error, result) => {
          if (error || !result) reject(error || new Error("Upload failed"));
          else resolve(result.public_id);
        }
      );
      uploadStream.end(pdfBuffer);
    });

    // Save to Invoice
    invoice.pdfPublicId = publicId;
    await invoice.save();

    // Serve the newly generated PDF directly
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });

  } catch (error: any) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
