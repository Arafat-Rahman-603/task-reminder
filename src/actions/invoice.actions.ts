"use server";

import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import Transaction from "@/models/Transaction";
import Counter from "@/models/Counter";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

export async function createInvoice(data: {
  transactionId?: string;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  items: { description: string; quantity: number; unitPrice: number }[];
  taxRate?: number;
  discountAmount?: number;
  currency?: string;
  notes?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");
  // @ts-ignore
  const userId = session.user.id;
  await dbConnect();

  // Validate Transaction if provided
  if (data.transactionId) {
    const tx = await Transaction.findOne({ _id: data.transactionId, userId });
    if (!tx) throw new Error("Transaction not found or unauthorized");
  }

  // Generate unique sequential invoice number
  const counter = await Counter.findByIdAndUpdate(
    { _id: "invoiceNumber" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const invoiceNumber = `INV-${String(counter.seq).padStart(5, '0')}`;

  // Server-side financial calculations
  let subtotal = 0;
  const items = data.items.map(item => {
    const amount = item.quantity * item.unitPrice;
    subtotal += amount;
    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount
    };
  });

  const taxRate = data.taxRate || 0;
  const taxAmount = (subtotal * taxRate) / 100;
  const discountAmount = data.discountAmount || 0;
  const totalAmount = subtotal + taxAmount - discountAmount;

  if (totalAmount < 0) throw new Error("Total amount cannot be negative");

  // Opaque QR token
  const qrVerificationToken = crypto.randomBytes(32).toString('hex');

  const invoice = await Invoice.create({
    userId,
    transactionId: data.transactionId,
    invoiceNumber,
    issueDate: new Date(),
    clientName: data.clientName,
    clientEmail: data.clientEmail,
    clientAddress: data.clientAddress,
    items,
    subtotal,
    taxRate,
    taxAmount,
    discountAmount,
    totalAmount,
    currency: data.currency || 'BDT',
    notes: data.notes,
    qrVerificationToken,
  });

  return { success: true, invoice: JSON.parse(JSON.stringify(invoice)) };
}

export async function getInvoices() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");
  // @ts-ignore
  const userId = session.user.id;
  await dbConnect();

  const invoices = await Invoice.find({ userId }).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(invoices));
}

export async function getInvoiceByNumber(invoiceNumber: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");
  // @ts-ignore
  const userId = session.user.id;
  await dbConnect();

  const invoice = await Invoice.findOne({ invoiceNumber, userId }).lean();
  if (!invoice) throw new Error("Invoice not found");
  return JSON.parse(JSON.stringify(invoice));
}

export async function issueInvoice(id: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");
  // @ts-ignore
  const userId = session.user.id;
  await dbConnect();

  const invoice = await Invoice.findOneAndUpdate(
    { _id: id, userId, status: 'draft' },
    { status: 'issued' },
    { new: true }
  );
  if (!invoice) throw new Error("Invoice not found or cannot be issued");
  return { success: true };
}

export async function voidInvoice(id: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");
  // @ts-ignore
  const userId = session.user.id;
  await dbConnect();

  const invoice = await Invoice.findOneAndUpdate(
    { _id: id, userId, status: { $in: ['draft', 'issued'] } },
    { status: 'voided' },
    { new: true }
  );
  if (!invoice) throw new Error("Invoice not found or cannot be voided");
  return { success: true };
}
