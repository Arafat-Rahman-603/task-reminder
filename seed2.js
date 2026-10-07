const mongoose = require("mongoose");
// We can just use raw mongoose to update it.
async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://admin:admin@cluster0.abcde.mongodb.net/task-reminder?retryWrites=true&w=majority");
  
  // Actually, I don't need models, I can just use raw collection
  const db = mongoose.connection.useDb('test'); // Wait, the URI has db name
  
  const routines = await mongoose.connection.collection('routines').find({}).toArray();
  for (const routine of routines) {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const allCompleted = routine.items && routine.items.length > 0 && routine.items.every(i => i.isCompleted);
    const status = allCompleted ? "Completed" : "Scheduled";
    
    await mongoose.connection.collection('routinehistories').updateOne(
      { routineId: routine._id, occurrenceDate: startOfDay },
      { $set: {
        userId: routine.userId,
        routineName: routine.name,
        scheduledTime: routine.startTime || null,
        status,
        completedAt: allCompleted ? new Date() : null,
        items: routine.items ? routine.items.map(i => ({ title: i.title, isCompleted: i.isCompleted })) : [],
        timestamp: new Date()
      }},
      { upsert: true }
    );
  }
  console.log("Seeded history for", routines.length, "routines");
  process.exit(0);
}

require('dotenv').config({ path: './.env' });
run();
