import mongoose from "mongoose";
import { DriveFileSchema } from "./driveFile.schema.js";
import { YoutubeVideoSchema } from "./youtubeVideo.schema.js";
import { LinkSchema } from "./link.schema.js";

// {

//   // Union field material can be only one of the following:
//   "driveFile": {
//     object (DriveFile)
//   },
//   "youTubeVideo": {
//     object (YouTubeVideo)
//   },
//   "link": {
//     object (Link)
//   },
//   "form": {
//     object (Form)
//   }
//   // End of list of possible types for union field material.
// }

const MaterialSchema = new mongoose.Schema(
  {
    driveFile: { type: DriveFileSchema },
    youtubeVideo: { type: YoutubeVideoSchema },
    link: { type: LinkSchema },
  },
  { _id: false }
);

export { MaterialSchema };
