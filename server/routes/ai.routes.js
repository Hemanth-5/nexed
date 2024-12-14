import express from "express";
import {
  aiChat,
  getChatHistory,
  clearChatHistory,
} from "../controllers/ai.controller.js";

// Handle the AI chat request
const router = express.Router();

// AI response
router.post("/chat", aiChat);

router.get("/chat/history", getChatHistory);

//Clear chat history by title
router.delete("/chat/clear", clearChatHistory);

export default router;
