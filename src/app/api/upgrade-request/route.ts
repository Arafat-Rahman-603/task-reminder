import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Workspace from "@/models/Workspace";
import UpgradeRequest from "@/models/UpgradeRequest";
import { sendEmail } from "@/lib/email/resend";

export async function POST(req: Request) {
  try {
    const { name, email, company, plan, customDetails, price, priceNum, billingCycle } = await req.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    // Find workspace for user
    let workspaceId = null;
    if (user) {
      const workspace = await Workspace.findOne({ ownerId: user._id });
      if (workspace) {
        workspaceId = workspace._id;
      }
    }

    let finalPrice = price || "$0";
    let finalPriceNum = typeof priceNum === "number" ? priceNum : 0;

    if (!finalPriceNum && customDetails?.estimatedPrice) {
      finalPriceNum = parseFloat(customDetails.estimatedPrice);
      finalPrice = `$${finalPriceNum.toFixed(2)}`;
    } else if (!finalPriceNum && plan) {
      const pLower = plan.toLowerCase();
      if (pLower.includes("pro") || pLower.includes("professional")) {
        finalPrice = "$3.69";
        finalPriceNum = 3.69;
      } else if (pLower.includes("enterprise")) {
        finalPrice = "$49.00";
        finalPriceNum = 49.00;
      } else if (plan.includes("$")) {
        const match = plan.match(/\$([0-9.]+)/);
        if (match) {
          finalPriceNum = parseFloat(match[1]);
          finalPrice = `$${finalPriceNum.toFixed(2)}`;
        }
      }
    }

    // Persist Upgrade Request in MongoDB
    if (user && workspaceId) {
      await UpgradeRequest.create({
        workspaceId,
        requestedBy: user._id,
        requestedPlan: plan || "pro",
        price: finalPrice,
        priceNum: finalPriceNum,
        billingCycle: billingCycle || "monthly",
        status: "pending",
        adminNotes: customDetails
          ? `Company: ${company || "N/A"} | Custom Specs: ${JSON.stringify(customDetails)}`
          : `Company: ${company || "N/A"}`,
      });
    }

    // Forward notification to receiver
    const receiverEmail =
      process.env.CONTACT_RECEIVER_EMAIL ||
      process.env.RESEND_SENDER_EMAIL ||
      "axiomixs@gmail.com";

    const htmlContent = `
      <h2>New Subscription Upgrade Request</h2>
      <p>A user has requested an upgrade on Manageo:</p>
      <ul>
        <li><strong>Name:</strong> ${name}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Company:</strong> ${company || "N/A"}</li>
        <li><strong>Requested Plan:</strong> ${plan || "pro"}</li>
        ${customDetails ? `<li><strong>Custom Details:</strong> ${JSON.stringify(customDetails)}</li>` : ""}
      </ul>
      <p>You can review and approve this directly from the Manageo Admin Panel.</p>
    `;

    if (receiverEmail) {
      await sendEmail({
        to: receiverEmail,
        subject: `Upgrade Request: ${plan || "Pro"} from ${name}`,
        htmlContent,
      }).catch((err) => {
        console.error("Failed to forward upgrade email:", err);
      });
    }

    return NextResponse.json(
      { message: "Upgrade request submitted successfully! Admin will review." },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error in upgrade-request API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
