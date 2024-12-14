import mongoose from "mongoose";

const LinkSchema = new mongoose.Schema(
  {
    id: { type: String },
    title: { type: String },
    thumbnailUrl: { type: String },
  },
  { _id: false }
);

export { LinkSchema };
