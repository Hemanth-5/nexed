import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // User Identification
    googleId: {
      type: String,
      unique: true,
      default: null,
    },
    tokens: {
      // Stores access token for Google Classroom API
      type: Object,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      unique: true,
    },

    // Personal Information
    name: { type: String, required: true },
    department: {
      type: String,
      default: null,
    },
    bio: {
      gender: {
        type: String,
        enum: ["male", "female", "other"],
        default: "other",
      },
      dob: { type: String, default: null },
      degree: { type: String, default: null },
      batch: { type: String, default: null },
      class: { type: String, default: null },
    },
    profilePicture: {
      type: String,
      default: null,
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },

    // Classroom Integration
    // classroomCourses: [
    //   {
    //     courseId: { type: mongoose.Schema.ObjectId, ref: "Course" },
    //     materialsSynced: { type: Boolean, default: false }, // Tracks if course materials are synced
    //     _id: false,
    //   },
    // ],

    // AI and Web Scraping Data
    aiUsage: {
      enabled: { type: Boolean, default: true },
      featuresAccessed: [{ type: String }], // e.g., ["chatbot", "summary", "analysis"]
    },
    aiChats: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "AIChats",
      },
    ],
    webScrapingPreferences: {
      preferredSites: [{ type: String }], // List of sites a user scrapes often
      lastScrapedAt: { type: Date, default: null },
    },

    // Notifications
    // notifications: [
    //   {
    //     title: { type: String, required: true },
    //     body: { type: String, required: true },
    //     isRead: { type: Boolean, default: false },
    //     createdAt: { type: Date, default: Date.now },
    //   },
    // ],
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

// Middleware to handle updates
userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const User = mongoose.model("User", userSchema);

export default User;
