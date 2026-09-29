import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Notification } from "@/models/Notification";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = new mongoose.Types.ObjectId((session.user as any).id);

    const dbNotifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const notifications = dbNotifications.map((n: any) => ({
      id: n._id.toString(),
      type: n.type.toLowerCase(),
      priority: 'medium', // Default priority, can be derived if needed
      title: n.title,
      message: n.body,
      link: n.url || null,
      date: n.createdAt,
      read: !!n.readAt
    }));

    return NextResponse.json({ notifications });

  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Mark as read or unread
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);
    const body = await req.json();

    if (body.action === 'markAllRead') {
      await Notification.updateMany(
        { userId, readAt: { $exists: false } },
        { $set: { readAt: new Date() } }
      );
      return NextResponse.json({ success: true });
    }

    const { id, read } = body;
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    await Notification.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), userId },
      { $set: { readAt: read ? new Date() : null } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update notification:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Delete notification
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const id = url.searchParams.get("id");

    if (action === 'deleteAll') {
      await Notification.deleteMany({ userId });
      return NextResponse.json({ success: true });
    }

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    await Notification.findOneAndDelete({ _id: new mongoose.Types.ObjectId(id), userId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete notification:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
