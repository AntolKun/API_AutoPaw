const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register
router.post("/register", async (req, res) => {
  const { username, email, password, confirmPassword, namaLengkap } = req.body;

  // Input validation
  if (!username || !email || !password || !confirmPassword || !namaLengkap) {
    return res.status(400).send("All fields are required");
  }

  // Password confirmation validation
  if (password !== confirmPassword) {
    return res.status(400).send("Passwords do not match");
  }

  // Check if email already exists
  const emailExists = await User.findOne({ email: email });
  if (emailExists) return res.status(400).send("Email already exists");

  // Check if username already exists
  const usernameExist = await User.findOne({ username: username });
  if (usernameExist) return res.status(400).send("Username already exists");

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create new user
  const user = new User({
    username,
    email,
    password: hashedPassword,
    namaLengkap,  // Save full name
  });

  try {
    const savedUser = await user.save();
    res.send({ user });
  } catch (err) {
    res.status(400).send(err);
  }
});


// Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // Input validation
  if (!username || !password) {
    return res.status(400).send("All fields are required");
  }

  // Check if user exists
  const user = await User.findOne({ username: username });
  if (!user) return res.status(400).send("Username or password is wrong");

  // Check if password is correct
  const validPass = await bcrypt.compare(password, user.password);
  if (!validPass) return res.status(400).send("Invalid password");

  // Generate a token
  const token = jwt.sign(
    { _id: user._id, username: user.username, email: user.email, namaLengkap: user.namaLengkap },
    process.env.JWT_SECRET || 'your_jwt_secret_key',
    { expiresIn: "1h" }
  );

  // Send user data without password
  const { password: _, ...userWithoutPassword } = user.toObject(); // Destructure to exclude password

  // Send the token and user data as response
  res.header("auth-token", token).send({ token, user: userWithoutPassword, message: "Login successful" });
});


module.exports = router;
