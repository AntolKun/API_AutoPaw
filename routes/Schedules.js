const express = require("express");
const router = express.Router();
const Schedule = require("../models/Schedule");
const moment = require("moment");
const axios = require("axios");

const BLYNK_TOKEN = "oLIG87p8FBDcZeJorMYEddV1bKjvw-qH";

async function sendDataToBlynk(pin, value) {
  const url = `https://blynk.cloud/external/api/update?token=${BLYNK_TOKEN}&${pin}=${value}`;
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(
      "Error sending data to Blynk:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

router.use(async (req, res, next) => {
  try {
    const schedules = await Schedule.find();
    const currentDateTime = moment();

    for (const schedule of schedules) {
      const scheduleStartDate = moment(schedule.startDate, "YYYY-MM-DD");

      if (currentDateTime.isBefore(scheduleStartDate)) {
        continue;
      }

      const scheduleDateTime = moment(
        `${schedule.startDate} ${schedule.time}`,
        "YYYY-MM-DD HH:mm:ss"
      );

      if (currentDateTime.isAfter(scheduleDateTime)) {
        await Schedule.findOneAndDelete({ deviceName: schedule.deviceName });
      } else {
        await schedule.save();
      }
    }

    next();
  } catch (err) {
    console.error("Middleware error:", err.message);
    next(err);
  }
});

router.get("/", async (req, res) => {
  try {
    const schedules = await Schedule.find();
    res.json(schedules);
  } catch (err) {
    console.error("GET / error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

router.get("/:deviceName", async (req, res) => {
  try {
    const schedule = await Schedule.findOne({
      deviceName: req.params.deviceName,
    });
    if (!schedule) return res.status(404).json({ message: "Device not found" });
    res.json(schedule);
  } catch (err) {
    console.error(`GET /${req.params.deviceName} error:`, err.message);
    res.status(500).json({ message: err.message });
  }
});

router.post("/", async (req, res) => {
  const { deviceName, startDate, time } = req.body;

  if (!deviceName || !startDate || !time) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const schedule = new Schedule({
    deviceName,
    startDate,
    time,
  });

  try {
    const newSchedule = await schedule.save();

    // Mengirim data ke Blynk
    const formattedData = `${startDate} ${time}`;
    await sendDataToBlynk("V1", formattedData);

    res.status(201).json(newSchedule);
  } catch (err) {
    console.error("POST / error:", err.message);
    res.status(400).json({ message: err.message });
  }
});

router.put("/:deviceName", async (req, res) => {
  const { startDate, time } = req.body;

  if (!startDate || !time) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    let schedule = await Schedule.findOne({
      deviceName: req.params.deviceName,
    });

    if (!schedule) {
      schedule = new Schedule({
        deviceName: req.params.deviceName,
        startDate,
        time,
      });
      const newSchedule = await schedule.save();

      // Mengirim data ke Blynk
      const formattedData = `${startDate} ${time}`;
      await sendDataToBlynk("V1", formattedData);

      return res.status(201).json(newSchedule);
    }

    schedule.startDate = startDate;
    schedule.time = time;
    const updatedSchedule = await schedule.save();

    // Mengirim data ke Blynk
    const formattedData = `${startDate} ${time}`;
    await sendDataToBlynk("V1", formattedData);

    res.json(updatedSchedule);
  } catch (err) {
    console.error(`PUT /${req.params.deviceName} error:`, err.message);
    res.status(400).json({ message: err.message });
  }
});

router.delete("/:deviceName", async (req, res) => {
  try {
    const schedule = await Schedule.findOneAndDelete({
      deviceName: req.params.deviceName,
    });
    if (!schedule) return res.status(404).json({ message: "Device not found" });

    // Mengirim data ke Blynk untuk menghapus jadwal
    await sendDataToBlynk("V1", "null");

    res.json({ message: "Schedule deleted" });
  } catch (err) {
    console.error(`DELETE /${req.params.deviceName} error:`, err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
