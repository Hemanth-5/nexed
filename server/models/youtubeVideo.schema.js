import mongoose from "mongoose";

const YoutubeVideoSchema = new mongoose.Schema(
  {
    id: { type: String },
    title: { type: String },
    alternateLink: { type: String },
    thumbnailUrl: { type: String },
  },
  { _id: false }
);

export { YoutubeVideoSchema };
