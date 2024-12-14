import mongoose from "mongoose";
import { MaterialSchema } from "./material.schema.js";

// {
//   "courseId": string,
//   "id": string,
//   "title": string,
//   "description": string,
//   "materials": [
//     {
//       object (Material)
//     }
//   ],
//   "state": enum (CourseWorkMaterialState),
//   "alternateLink": string,
//   "creationTime": string,
//   "updateTime": string,
//   "scheduledTime": string,
//   "assigneeMode": enum (AssigneeMode),
//   "individualStudentsOptions": {
//     object (IndividualStudentsOptions)
//   },
//   "creatorUserId": string,
//   "topicId": string
// }

const CourseWorkMaterialSchema = new mongoose.Schema(
  {
    courseId: { type: String },
    id: { type: String },
    title: { type: String },
    description: { type: String },
    materials: [{ type: MaterialSchema }],
    state: { type: String },
    alternateLink: { type: String },
    creationTime: { type: String },
    updateTime: { type: String },
    scheduledTime: { type: String },
    creatorUserId: { type: String },
    topicId: { type: String },
  },
  { _id: false }
);

export { CourseWorkMaterialSchema };
