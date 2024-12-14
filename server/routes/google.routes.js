import express from "express";
import {
  redirectToGoogleAuth,
  handleGoogleCallback,
  fetchCourses,
  fetchUserData,
  manualSync,
} from "../controllers/google.controller.js";

const router = express.Router();

// Redirect to Google for authentication
router.get("/auth", redirectToGoogleAuth);

// Handle Google OAuth2 callback
router.get("/oauth2callback", handleGoogleCallback);

// Fetch and display courses
router.get("/courses", fetchCourses);

// Fetch and display user profile
router.get("/profile", fetchUserData);

// Manually trigger synchronization
router.get("/sync", manualSync);

export default router;
