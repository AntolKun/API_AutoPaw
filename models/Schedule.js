const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
  deviceName: String,
  startDate: String, // Format: DDMMYY
  endDate: String, // Format: DDMMYY
  schedules: [
    {
      time: String, // Format: HHmm (cont., 0300 for 03:00)
      amount: Number,
    },
  ],
});

module.exports = mongoose.model("Schedule", scheduleSchema);
