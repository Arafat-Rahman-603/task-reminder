import 'dotenv/config';
import mongoose from 'mongoose';
import Reminder from '../src/models/Reminder';
import Task from '../src/models/Task';
import Routine from '../src/models/Routine';
import { Notification } from '../src/models/Notification';
import { NotificationPreference } from '../src/models/NotificationPreference';
import { PushRegistration } from '../src/models/PushRegistration';
import { processDueReminders, processDailySummaries, formatListGrammar, formatDateInTz } from '../src/lib/notifications/reminder-processor';
import { registerSSEClient, notifyUserViaSSE } from '../src/lib/notifications/sse-service';
import dbConnect from '../src/lib/db';

async function runVerification() {
  console.log('================================================================');
  console.log('🚀 MANAGEO COMPLETE NOTIFICATION PRODUCTION-SAFETY VERIFICATION');
  console.log('================================================================\n');

  await dbConnect();
  console.log('✅ 1. MongoDB Connected successfully');

  const testUserId = new mongoose.Types.ObjectId();
  const testUserIdStr = testUserId.toString();

  const results: Record<string, boolean> = {};

  try {
    // ------------------------------------------------------------------------
    // Test 1: Task Reminder Detection & Persistence
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 1: Task Reminder Detection, Persistence & Idempotency ---');
    await NotificationPreference.create({
      userId: testUserId,
      pushEnabled: false, // in-app verification first
      taskReminders: true,
      routineReminders: true,
      timezone: 'Asia/Dhaka',
    });

    const task1 = await Task.create({
      userId: testUserId,
      title: 'Production Safety Audit Task',
      slug: `audit-task-${Date.now()}`,
      status: 'In Progress',
      priority: 'High',
      dueTime: '14:30',
    });

    const reminder1 = await Reminder.create({
      userId: testUserId,
      entityType: 'Task',
      entityId: task1._id,
      remindAt: new Date(Date.now() - 30000), // Due 30s ago
      status: 'pending',
      notificationType: 'in-app',
    });

    const run1 = await processDueReminders({ userId: testUserIdStr });
    console.log('Run 1 result:', run1);

    const notifs1 = await Notification.find({ userId: testUserId, entityId: task1._id.toString() });
    const passed1 =
      run1.success &&
      run1.processedCount === 1 &&
      notifs1.length === 1 &&
      notifs1[0].type === 'TASK_REMINDER' &&
      notifs1[0].title.includes('Task Reminder') &&
      notifs1[0].body.includes('Production Safety Audit Task') &&
      notifs1[0].url === `/dashboard/tasks/${task1.slug}` &&
      notifs1[0].status === 'SENT';

    console.log('Test 1 Assertions:');
    console.log(' - Exactly 1 Notification record:', notifs1.length === 1);
    console.log(' - Title/Body valid:', notifs1[0]?.title, '|', notifs1[0]?.body);
    console.log(' - Deep link:', notifs1[0]?.url);
    console.log(' - Reminder marked sent:', (await Reminder.findById(reminder1._id))?.status === 'sent');

    // Idempotency check: run again immediately
    const run1Retry = await processDueReminders({ userId: testUserIdStr });
    const notifs1After = await Notification.find({ userId: testUserId, entityId: task1._id.toString() });
    const idempotent1 = run1Retry.processedCount === 0 && notifs1After.length === 1;
    console.log(' - Repeated run creates 0 duplicate notifications:', idempotent1);

    results['Task Reminder & Idempotency'] = passed1 && idempotent1;

    // ------------------------------------------------------------------------
    // Test 2: Task Completed Notification
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 2: Task Completed Notification ---');
    const reminderCompleted = await Reminder.create({
      userId: testUserId,
      entityType: 'Task',
      entityId: task1._id,
      remindAt: new Date(Date.now() - 10000),
      status: 'pending',
      notificationType: 'in-app',
      metadata: { isCompletionCongrats: true },
    });

    await processDueReminders({ userId: testUserIdStr });
    const notifCompleted = await Notification.findOne({
      userId: testUserId,
      'metadata.reminderId': reminderCompleted._id.toString(),
    });

    const passedCompleted =
      !!notifCompleted &&
      notifCompleted.title === 'Task Completed ✅' &&
      notifCompleted.body.includes('Production Safety Audit Task');

    console.log(' - Task Completed title:', notifCompleted?.title);
    console.log(' - Task Completed body:', notifCompleted?.body);
    results['Task Completed Notification'] = passedCompleted;

    // ------------------------------------------------------------------------
    // Test 3: Task Overdue / Missed Notification
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 3: Task Overdue / Missed Notification ---');
    const reminderMissed = await Reminder.create({
      userId: testUserId,
      entityType: 'Task',
      entityId: task1._id,
      remindAt: new Date(Date.now() - 10000),
      status: 'pending',
      notificationType: 'in-app',
      metadata: { isTaskMissed: true },
    });

    await processDueReminders({ userId: testUserIdStr });
    const notifMissed = await Notification.findOne({
      userId: testUserId,
      'metadata.reminderId': reminderMissed._id.toString(),
    });

    const passedMissed =
      !!notifMissed &&
      notifMissed.title === 'Task Overdue ⚠️' &&
      notifMissed.body.includes('Production Safety Audit Task');

    console.log(' - Task Overdue title:', notifMissed?.title);
    console.log(' - Task Overdue body:', notifMissed?.body);
    results['Task Overdue Notification'] = passedMissed;

    // ------------------------------------------------------------------------
    // Test 4: Routine Reminder & Recurring Occurrence Scheduling
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 4: Routine Reminder & Recurring Scheduling ---');
    const routine1 = await Routine.create({
      userId: testUserId,
      name: 'Evening Reflection Routine',
      schedule: ['Daily'],
      isActive: true,
      startTime: '21:00',
    });

    const routineReminder = await Reminder.create({
      userId: testUserId,
      entityType: 'Routine',
      entityId: routine1._id,
      remindAt: new Date(Date.now() - 20000),
      status: 'pending',
      notificationType: 'in-app',
      metadata: { isMainReminder: true },
    });

    const routineRun = await processDueReminders({ userId: testUserIdStr });
    const routineNotif = await Notification.findOne({
      userId: testUserId,
      entityType: 'ROUTINE',
      entityId: routine1._id.toString(),
    });

    const nextPending = await Reminder.findOne({
      userId: testUserId,
      entityType: 'Routine',
      entityId: routine1._id,
      status: 'pending',
      'metadata.isMainReminder': true,
    });

    const passedRoutine =
      routineRun.success &&
      !!routineNotif &&
      routineNotif.title === 'Routine Time 🔁' &&
      routineNotif.body.includes('Evening Reflection Routine') &&
      !!nextPending &&
      nextPending.remindAt.getTime() > routineReminder.remindAt.getTime();

    console.log(' - Routine Notification title:', routineNotif?.title);
    console.log(' - Routine Notification body:', routineNotif?.body);
    console.log(' - Next recurring occurrence scheduled:', !!nextPending);
    results['Routine Reminder & Recurrence'] = passedRoutine;

    // ------------------------------------------------------------------------
    // Test 5: Routine Completed & Missed Notifications
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 5: Routine Completed & Missed Notifications ---');
    const rCompletedRem = await Reminder.create({
      userId: testUserId,
      entityType: 'Routine',
      entityId: routine1._id,
      remindAt: new Date(Date.now() - 5000),
      status: 'pending',
      notificationType: 'in-app',
      metadata: { isRoutineCompleted: true },
    });

    const rMissedRem = await Reminder.create({
      userId: testUserId,
      entityType: 'Routine',
      entityId: routine1._id,
      remindAt: new Date(Date.now() - 5000),
      status: 'pending',
      notificationType: 'in-app',
      metadata: { isMissedRoutine: true, scheduledTime: '21:00' },
    });

    await processDueReminders({ userId: testUserIdStr });

    const rCompNotif = await Notification.findOne({
      userId: testUserId,
      'metadata.reminderId': rCompletedRem._id.toString(),
    });
    const rMissNotif = await Notification.findOne({
      userId: testUserId,
      'metadata.reminderId': rMissedRem._id.toString(),
    });

    console.log(' - Routine Completed title:', rCompNotif?.title);
    console.log(' - Routine Completed body:', rCompNotif?.body);
    console.log(' - Routine Missed title:', rMissNotif?.title);
    console.log(' - Routine Missed body:', rMissNotif?.body);

    const passedRStates =
      rCompNotif?.title === 'Routine Completed 🎉' &&
      rCompNotif?.body.includes('Evening Reflection Routine') &&
      rMissNotif?.title === 'Routine Missed' &&
      rMissNotif?.body.includes('Evening Reflection Routine');

    results['Routine Completed & Missed'] = passedRStates;

    // ------------------------------------------------------------------------
    // Test 6: Midnight Daily Overview (Timezone Asia/Dhaka)
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 6: Midnight Daily Overview Generation ---');
    const midResult = await processDailySummaries({
      userId: testUserIdStr,
      forceType: 'MIDNIGHT_OVERVIEW',
    });

    const midnightNotif = await Notification.findOne({
      userId: testUserId,
      type: 'DAILY_SUMMARY',
      'metadata.summaryType': 'MIDNIGHT_OVERVIEW',
    });

    console.log(' - Midnight Sent count:', midResult.midnightSent);
    console.log(' - Midnight Title:', midnightNotif?.title);
    console.log(' - Midnight Body:', midnightNotif?.body);
    console.log(' - Deep link:', midnightNotif?.url);

    // Verify idempotency on second run
    const midResult2 = await processDailySummaries({
      userId: testUserIdStr,
    });
    console.log(' - Normal subsequent run sent:', midResult2.midnightSent);

    const passedMidnight =
      !!midnightNotif &&
      midnightNotif.title === 'Your Day Overview is Ready 🌙' &&
      midnightNotif.url === '/dashboard' &&
      midnightNotif.metadata?.timezone === 'Asia/Dhaka' &&
      midResult2.midnightSent === 0;

    results['Midnight Daily Overview'] = passedMidnight;

    // ------------------------------------------------------------------------
    // Test 7: Morning Summary (Custom configured time & saved timezone)
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 7: Morning Summary Generation ---');
    await NotificationPreference.updateOne(
      { userId: testUserId },
      { $set: { 'morningSummary.time': '08:30', timezone: 'America/New_York' } }
    );

    const morningResult = await processDailySummaries({
      userId: testUserIdStr,
      forceType: 'MORNING_SUMMARY',
    });

    const morningNotif = await Notification.findOne({
      userId: testUserId,
      type: 'MORNING_SUMMARY',
    });

    console.log(' - Morning Sent count:', morningResult.morningSent);
    console.log(' - Morning Title:', morningNotif?.title);
    console.log(' - Morning Body:', morningNotif?.body);
    console.log(' - Timezone recorded:', morningNotif?.metadata?.timezone);

    const morningResult2 = await processDailySummaries({
      userId: testUserIdStr,
    });

    const passedMorning =
      !!morningNotif &&
      morningNotif.title.includes('Good morning') &&
      morningNotif.url === '/dashboard' &&
      morningNotif.metadata?.timezone === 'America/New_York' &&
      morningResult2.morningSent === 0;

    results['Morning Summary'] = passedMorning;

    // ------------------------------------------------------------------------
    // Test 8: Real-Time SSE Stream Verification
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 8: Real-Time SSE Service ---');
    let sseReceivedData: any = null;
    const testController = {
      enqueue: (bytes: Uint8Array) => {
        const text = new TextDecoder().decode(bytes);
        if (text.includes('event: notification')) {
          const match = text.match(/data: ({.*})/);
          if (match) {
            sseReceivedData = JSON.parse(match[1]);
          }
        }
      },
    } as unknown as ReadableStreamDefaultController;

    const unregisterSSE = registerSSEClient(testUserIdStr, testController);

    // Dispatch an event via SSE
    notifyUserViaSSE(testUserIdStr, {
      type: 'NOTIFICATION_CREATED',
      notificationId: 'test_notif_12345',
      data: { title: 'Test SSE' },
    });

    unregisterSSE();

    const passedSSE = sseReceivedData && sseReceivedData.notificationId === 'test_notif_12345';
    console.log(' - SSE Event received by client controller:', passedSSE, sseReceivedData);
    results['SSE Real-Time Service'] = passedSSE;

    // ------------------------------------------------------------------------
    // Test 9: Concurrency Race-Condition Safety
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 9: Concurrency Race Condition Safety ---');
    const taskConcurrent = await Task.create({
      userId: testUserId,
      title: 'Race Condition Test Task',
      slug: `race-${Date.now()}`,
      status: 'In Progress',
    });

    await Reminder.create({
      userId: testUserId,
      entityType: 'Task',
      entityId: taskConcurrent._id,
      remindAt: new Date(Date.now() - 5000),
      status: 'pending',
    });

    // Run 5 simultaneous workers
    await Promise.all([
      processDueReminders({ userId: testUserIdStr }),
      processDueReminders({ userId: testUserIdStr }),
      processDueReminders({ userId: testUserIdStr }),
      processDueReminders({ userId: testUserIdStr }),
      processDueReminders({ userId: testUserIdStr }),
    ]);

    const raceNotifs = await Notification.find({
      userId: testUserId,
      entityId: taskConcurrent._id.toString(),
    });
    console.log(' - Exactly 1 notification created across 5 concurrent workers:', raceNotifs.length === 1);
    results['Concurrency Safety'] = raceNotifs.length === 1;

    // ------------------------------------------------------------------------
    // Test 10: User Preference Disabling
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 10: User Preference Filtering ---');
    await NotificationPreference.updateOne(
      { userId: testUserId },
      { $set: { taskReminders: false, routineReminders: false } }
    );

    const taskDisabled = await Task.create({
      userId: testUserId,
      title: 'Disabled Task Notification',
      slug: `disabled-${Date.now()}`,
      status: 'In Progress',
    });

    await Reminder.create({
      userId: testUserId,
      entityType: 'Task',
      entityId: taskDisabled._id,
      remindAt: new Date(Date.now() - 5000),
      status: 'pending',
    });

    await processDueReminders({ userId: testUserIdStr });

    const disabledNotifs = await Notification.find({
      userId: testUserId,
      entityId: taskDisabled._id.toString(),
    });
    console.log(' - 0 notifications created when user disabled taskReminders:', disabledNotifs.length === 0);
    results['User Preference Filtering'] = disabledNotifs.length === 0;

  } finally {
    // Cleanup test data
    await Task.deleteMany({ userId: testUserId });
    await Routine.deleteMany({ userId: testUserId });
    await Reminder.deleteMany({ userId: testUserId });
    await Notification.deleteMany({ userId: testUserId });
    await NotificationPreference.deleteMany({ userId: testUserId });
    await mongoose.disconnect();
  }

  console.log('\n================================================================');
  console.log('📊 VERIFICATION SUMMARY');
  console.log('================================================================');
  let allPass = true;
  for (const [testName, passed] of Object.entries(results)) {
    console.log(`${passed ? '✅ PASS' : '❌ FAIL'} : ${testName}`);
    if (!passed) allPass = false;
  }
  console.log('================================================================');
  if (allPass) {
    console.log('🎉 ALL NOTIFICATION SYSTEM VERIFICATIONS PASSED SUCCESSFULLY!');
  } else {
    console.error('❌ SOME NOTIFICATION VERIFICATIONS FAILED.');
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
