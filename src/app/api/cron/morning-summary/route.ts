export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Task from "@/models/Task";
import Routine from "@/models/Routine";
import { Notification } from "@/models/Notification";
import { sendPushNotification } from "@/lib/notifications/firebase-server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const authHeader = req.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
      url.searchParams.get("key") !== process.env.CRON_SECRET
    ) {
      return NextResponse.json({ error: "Unauthorized cron" }, { status: 401 });
    }

    await dbConnect();
    
    // Find users who have notifications enabled
    const users = await User.find({ "preferences.notificationSettings.taskReminders": { $ne: false } }).lean();
    
    let sentCount = 0;
    
    for (const user of users) {
      // Check timezone
      const tz = user.preferences?.timezone || "UTC";
      
      const userTimeOptions = { timeZone: tz, hour: 'numeric' as const, hour12: false };
      const formatter = new Intl.DateTimeFormat('en-US', userTimeOptions);
      const parts = formatter.formatToParts(new Date());
      const hourPart = parts.find(p => p.type === 'hour');
      const currentHour = hourPart ? parseInt(hourPart.value, 10) : new Date().getUTCHours();
      
      // Send at 8 AM local time
      if (currentHour === 8) {
        // Check if we already sent one today in their timezone
        const todayStr = new Date().toLocaleDateString("en-US", { timeZone: tz });
        const summaryId = `morning_summary_${user._id}_${todayStr}`;
        
        // We can use Notification model to check if we sent it
        const existingNotif = await Notification.findOne({
          userId: user._id,
          type: "MORNING_SUMMARY",
          title: { $regex: todayStr } // Use metadata or title to deduplicate
        });
        
        if (!existingNotif) {
          // Gather data for summary
          const now = new Date();
          // Find due tasks for today
          const startOfDay = new Date(now);
          startOfDay.setUTCHours(0,0,0,0);
          const endOfDay = new Date(now);
          endOfDay.setUTCHours(23,59,59,999);
          
          const tasksToday = await Task.find({
            userId: user._id,
            status: { $ne: "Completed" },
            dueDate: { $gte: startOfDay, $lte: endOfDay }
          }).countDocuments();
          
          const routinesToday = await Routine.find({
            userId: user._id,
            isActive: true
          }).countDocuments();
          
          if (tasksToday > 0 || routinesToday > 0) {
            const title = `Good Morning! ☀️`;
            const body = `You have ${tasksToday} tasks and ${routinesToday} routines scheduled for today. Have a great day! [${todayStr}]`;
            
            // Create in-app notification
            await Notification.create({
              userId: user._id,
              type: "MORNING_SUMMARY",
              title,
              message: body,
              priority: "normal",
              link: "/dashboard",
              read: false,
            });
            
            // Send push
            await sendPushNotification({ userId: user._id.toString(), title, body, url: "/dashboard" });
            sentCount++;
          }
        }
      }
    }

    return NextResponse.json({ success: true, sentCount });
  } catch (error: any) {
    console.error("Morning summary cron error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


