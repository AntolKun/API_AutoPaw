const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const authRoutes = require("./routes/Auth");
const schedulesRouter = require("./routes/Schedules");
const feedRoutes = require("./routes/FeedRoutes");

dotenv.config();

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(express.json());

// Routes Middleware
app.use("/api/auth", authRoutes);
app.use("/schedules", schedulesRouter);
app.use("/api", feedRoutes);

// Connect to DB
mongoose
  .connect(process.env.DB_CONNECT, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to DB!"))
  .catch((err) => console.error(err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
