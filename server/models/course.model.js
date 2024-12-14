import mongoose from "mongoose";
import { CourseWorkMaterialSchema } from "./courseWorkMaterial.schema.js";
// import { MaterialSchema } from "./material.schema.js";

// {
//   "id": string,
//   "name": string,
//   "section": string,
//   "descriptionHeading": string,
//   "description": string,
//   "room": string,
//   "ownerId": string,
//   "creationTime": string,
//   "updateTime": string,
//   "enrollmentCode": string,
//   "courseState": enum (CourseState),
//   "alternateLink": string,
//   "teacherGroupEmail": string,
//   "courseGroupEmail": string,
//   "teacherFolder": {
//     object (DriveFolder)
//   },
//   "courseMaterialSets": [
//     {
//       object (CourseMaterialSet)
//     }
//   ],
//   "guardiansEnabled": boolean,
//   "calendarId": string,
//   "gradebookSettings": {
//     object (GradebookSettings)
//   }
// }

const CourseSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: { type: String },
  section: { type: String },
  descriptionHeading: { type: String },
  description: { type: String },
  room: { type: String },
  ownerId: { type: String },
  creationTime: { type: String },
  updateTime: { type: String },
  enrollmentCode: { type: String },
  courseState: { type: String },
  alternateLink: { type: String },
  courseGroupEmail: { type: String },
  courseMaterialSets: [{ type: CourseWorkMaterialSchema, _id: false }],
  lastSyncTime: { type: Date, default: Date.now },

  users: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
});

export default mongoose.model("Course", CourseSchema);
