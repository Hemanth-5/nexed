import User from "../models/user.model.js";
import AIChats from "../models/aiChats.model.js"; // Import the new model
import { getAIResponse } from "../utils/ai-helper.js";

export const aiChat = async (req, res) => {
  try {
    const { message, googleId, accessToken, driveFileId, title } = req.body; // Add 'title'

    if (!message || !googleId || !accessToken || !title) {
      return res.status(400).json({
        error: "Message, googleId, accessToken, and title are required",
      });
    }

    const user = await User.findOne({ googleId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find or create an AIChats document for the given title
    let aiChat = await AIChats.findOne({ userId: user._id, title });
    if (!aiChat) {
      aiChat = new AIChats({ userId: user._id, title });
    }

    // Generate an AI response with the context
    const aiResponse = await getAIResponse(
      message,
      aiChat.chatHistory, // Use chatHistory from AIChats
      driveFileId,
      accessToken
    );

    // Save the new message and response to the AIChats chatHistory
    aiChat.chatHistory.push({
      userMessage: message,
      aiResponse: aiResponse.response,
    });
    await aiChat.save();

    res.status(200).json({ response: aiResponse });
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};

export const getChatHistory = async (req, res) => {
  const { googleId, title } = req.query; // Get title from query parameters

  try {
    const user = await User.findOne({ googleId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const aiChat = await AIChats.findOne({ userId: user._id, title });
    if (!aiChat)
      return res.status(404).json({ error: "Conversation not found" });

    res.status(200).json({ chatHistory: aiChat.chatHistory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const clearChatHistory = async (req, res) => {
  const { googleId, title } = req.query; // Get title from query parameters

  try {
    const user = await User.findOne({ googleId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const aiChat = await AIChats.findOneAndDelete({ userId: user._id, title });
    if (!aiChat)
      return res.status(404).json({ error: "Conversation not found" });
    res.status(200).json({ message: `Chat history for ${title} cleared` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
