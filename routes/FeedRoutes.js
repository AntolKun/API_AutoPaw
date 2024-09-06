const express = require("express");
const router = express.Router();
const axios = require("axios");

const BLYNK_TOKEN = "oLIG87p8FBDcZeJorMYEddV1bKjvw-qH";

// Functions send data ke blynk
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

// Route handle feed now
router.post("/feed-now", async (req, res) => {
  console.log("Received POST request to /feed-now");
  try {
    // Nyalakan pemberi makan
    await sendDataToBlynk("V0", 1);

    // menunggu 5 detik
    setTimeout(async () => {
      // Matikan button pemberi makan
      await sendDataToBlynk("V0", 0);
    }, 5000);

    res.status(200).json({ message: "Feed Now action successful" });
  } catch (error) {
    console.error("Error during Feed Now action:", error.message);
    res.status(500).json({ message: "Feed Now action failed" });
  }
});


module.exports = router;
