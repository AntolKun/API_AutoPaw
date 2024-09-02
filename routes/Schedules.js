// const express = require("express");
// const router = express.Router();
// const Schedule = require("../models/Schedule");
// const moment = require("moment"); 

// router.use(async (req, res, next) => {
//   try {
//     const schedules = await Schedule.find();
//     const currentDateTime = moment();

//     for (const schedule of schedules) {
//       const scheduleEndDate = moment(schedule.endDate, "DDMMYY");
//       const scheduleStartDate = moment(schedule.startDate, "DDMMYY");

//       if (currentDateTime.isBefore(scheduleStartDate)) {
//         continue;
//       }

//       if (currentDateTime.isAfter(scheduleEndDate)) {
//         await Schedule.findOneAndDelete({ deviceName: schedule.deviceName });
//         continue;
//       }

//       schedule.schedules = schedule.schedules.filter((s) => {
//         const scheduleDateTime = moment(
//           schedule.endDate + s.time,
//           "DDMMYYHHmm"
//         );

//         return currentDateTime.isBefore(scheduleDateTime);
//       });

//       if (schedule.schedules.length === 0) {
//         await Schedule.findOneAndDelete({ deviceName: schedule.deviceName });
//       } else {
//         await schedule.save();
//       }
//     }

//     next();
//   } catch (err) {
//     next(err);
//   }
// });

// router.get("/", async (req, res) => {
//   try {
//     const schedules = await Schedule.find();
//     res.json(schedules);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// router.get("/:deviceName", async (req, res) => {
//   try {
//     const schedule = await Schedule.findOne({
//       deviceName: req.params.deviceName,
//     });
//     if (!schedule) return res.status(404).json({ message: "Device not found" });
//     res.json(schedule);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// router.post("/", async (req, res) => {
//   const schedule = new Schedule({
//     deviceName: req.body.deviceName,
//     startDate: req.body.startDate,
//     endDate: req.body.endDate,
//     schedules: req.body.schedules,
//   });

//   try {
//     const newSchedule = await schedule.save();
//     res.status(201).json(newSchedule);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// });

// router.put("/:deviceName", async (req, res) => {
//   try {
//     let schedule = await Schedule.findOne({
//       deviceName: req.params.deviceName,
//     });

//     if (!schedule) {
//       schedule = new Schedule({
//         deviceName: req.params.deviceName,
//         startDate: req.body.startDate,
//         endDate: req.body.endDate,
//         schedules: req.body.schedules,
//       });
//       const newSchedule = await schedule.save();
//       return res.status(201).json(newSchedule);
//     }

//     schedule.startDate = req.body.startDate;
//     schedule.endDate = req.body.endDate;
//     schedule.schedules = req.body.schedules;
//     const updatedSchedule = await schedule.save();
//     res.json(updatedSchedule);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// });

// router.delete("/:deviceName", async (req, res) => {
//   try {
//     const schedule = await Schedule.findOneAndDelete({
//       deviceName: req.params.deviceName,
//     });
//     if (!schedule) return res.status(404).json({ message: "Device not found" });
//     res.json({ message: "Schedule deleted" });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// module.exports = router;


const express = require("express");
const router = express.Router();
const Schedule = require("../models/Schedule");
const moment = require("moment");
const axios = require("axios");

const BLYNK_TOKEN = "oLIG87p8FBDcZeJorMYEddV1bKjvw-qH";
const BLYNK_URL = `https://blynk.cloud/external/api/update?token=${BLYNK_TOKEN}`;

router.use(async (req, res, next) => {
  try {
    const schedules = await Schedule.find();
    const currentDateTime = moment();

    for (const schedule of schedules) {
      const scheduleEndDate = moment(schedule.endDate, "DDMMYY");
      const scheduleStartDate = moment(schedule.startDate, "DDMMYY");

      if (currentDateTime.isBefore(scheduleStartDate)) {
        continue;
      }

      if (currentDateTime.isAfter(scheduleEndDate)) {
        await Schedule.findOneAndDelete({ deviceName: schedule.deviceName });
        continue;
      }

      schedule.schedules = schedule.schedules.filter((s) => {
        const scheduleDateTime = moment(
          schedule.endDate + s.time,
          "DDMMYYHHmm"
        );

        return currentDateTime.isBefore(scheduleDateTime);
      });

      if (schedule.schedules.length === 0) {
        await Schedule.findOneAndDelete({ deviceName: schedule.deviceName });
      } else {
        await schedule.save();
      }
    }

    next();
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res) => {
  try {
    const schedules = await Schedule.find();
    res.json(schedules);
  } catch (err) {
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
    res.status(500).json({ message: err.message });
  }
});

router.post("/", async (req, res) => {
  const schedule = new Schedule({
    deviceName: req.body.deviceName,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    schedules: req.body.schedules,
  });

  try {
    const newSchedule = await schedule.save();

    // Send data to Blynk
    const blynkResponse = await axios.get(BLYNK_URL, {
      params: {
        vpin: "V1", // Virtual pin to be updated
        value: JSON.stringify(newSchedule.schedules), // Or any other relevant data
      },
    });

    res.status(201).json({
      newSchedule,
      blynkResponse: blynkResponse.data,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/:deviceName", async (req, res) => {
  try {
    let schedule = await Schedule.findOne({
      deviceName: req.params.deviceName,
    });

    if (!schedule) {
      schedule = new Schedule({
        deviceName: req.params.deviceName,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        schedules: req.body.schedules,
      });
      const newSchedule = await schedule.save();

      // Send data to Blynk
      const blynkResponse = await axios.get(BLYNK_URL, {
        params: {
          vpin: "V1",
          value: JSON.stringify(newSchedule.schedules),
        },
      });

      return res.status(201).json({
        newSchedule,
        blynkResponse: blynkResponse.data,
      });
    }

    schedule.startDate = req.body.startDate;
    schedule.endDate = req.body.endDate;
    schedule.schedules = req.body.schedules;
    const updatedSchedule = await schedule.save();

    // Send data to Blynk
    const blynkResponse = await axios.get(BLYNK_URL, {
      params: {
        vpin: "V1",
        value: JSON.stringify(updatedSchedule.schedules),
      },
    });

    res.json({
      updatedSchedule,
      blynkResponse: blynkResponse.data,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/:deviceName", async (req, res) => {
  try {
    const schedule = await Schedule.findOneAndDelete({
      deviceName: req.params.deviceName,
    });
    if (!schedule) return res.status(404).json({ message: "Device not found" });

    // Notify Blynk about the deletion
    const blynkResponse = await axios.get(BLYNK_URL, {
      params: {
        vpin: "V1",
        value: `Device ${req.params.deviceName} deleted`,
      },
    });

    res.json({
      message: "Schedule deleted",
      blynkResponse: blynkResponse.data,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

//waduh apalah