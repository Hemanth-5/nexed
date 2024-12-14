import express from "express";
import session from "express-session";
import mongoose from "mongoose";
import bodyParser from "body-parser";

import googleRoutes from "./routes/google.routes.js";
import aiRoutes from "./routes/ai.routes.js";

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Replace with a secure secret in production
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Use secure: true when using HTTPS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  })
);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/google", googleRoutes);
app.use("/ai", aiRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Google Classroom Sync API is running!");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
