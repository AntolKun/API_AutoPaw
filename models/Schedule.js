const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
  deviceName: String,
  startDate: String, // Format: YYYY-MM-DD
  time: String, // Format: HH:mm:ss
  amount: Number,
});

module.exports = mongoose.model("Schedule", scheduleSchema);
