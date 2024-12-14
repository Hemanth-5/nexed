import {
  getAuthUrl,
  getGoogleTokens,
  getClassroomApi,
  getPeopleApi,
} from "../utils/google-auth.js";
import { syncGoogleClassroomData } from "../services/googleSync.service.js";
import User from "../models/user.model.js";

/**
 * Redirect to Google for authentication
 */
export const redirectToGoogleAuth = (req, res) => {
  // Check if user is already authenticated
  if (req.session.user && req.session.tokens) {
    return res.status(200).send("User is already authenticated!");
  }

  const authUrl = getAuthUrl();
  res.redirect(authUrl);
};

/**
 * Handle the Google OAuth2 callback and store tokens in session
 */
export const handleGoogleCallback = async (req, res) => {
  // Check if user is already authenticated
  if (req.session.user && req.session.tokens) {
    return res.status(200).send("User is already authenticated!");
  }

  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Authorization code is missing");
  }

  try {
    const tokens = await getGoogleTokens(code);
    req.session.tokens = tokens; // Store tokens in session

    const peopleApi = getPeopleApi(tokens);
    const profileResponse = await peopleApi.people.get({
      resourceName: "people/me",
      personFields: "names,emailAddresses,photos",
    });

    const profileData = profileResponse.data;
    const googleId = profileData.resourceName.split("/")[1];

    // Save user info in session
    req.session.user = googleId;

    // Create or update user in the database
    const username =
      `${profileData.names[0].givenName}${profileData.names[0].familyName}${googleId}`
        .toLowerCase()
        .replace(/\s+/g, ""); // Remove whitespace
    const userData = {
      googleId,
      tokens,
      email: profileData.emailAddresses[0]?.value,
      name: profileData.names[0]?.displayName,
      profilePicture: profileData.photos[0]?.url,
      username,
    };

    const user = await User.findOneAndUpdate(
      { googleId },
      { $set: userData },
      { upsert: true, new: true }
    );

    res.status(200).send("Google authentication successful!");
  } catch (error) {
    console.error("Error during Google callback:", error.message);
    res
      .status(500)
      .send("Error during Google token exchange: " + error.message);
  }
};

/**
 * Fetch courses and their coursework materials from Google Classroom
 */
export const fetchCourses = async (req, res) => {
  if (!req.session.tokens) {
    return res.redirect("/google/auth");
  }

  try {
    const classroomApi = getClassroomApi(req.session.tokens);
    const coursesResponse = await classroomApi.courses.list();
    const coursesFromGoogle = coursesResponse.data.courses || [];

    const coursesMaterials = [];
    for (const course of coursesFromGoogle) {
      const courseMaterialsResponse =
        await classroomApi.courses.courseWorkMaterials.list({
          courseId: course.id,
        });

      coursesMaterials.push({
        id: course.id,
        materials: courseMaterialsResponse.data.courseWorkMaterial || [],
      });
    }

    res
      .status(200)
      .json({ courses: coursesFromGoogle, materials: coursesMaterials });
  } catch (error) {
    console.error("Error fetching courses:", error.message);
    res.status(500).send("Error fetching courses: " + error.message);
  }
};

/**
 * Fetch user data from Google People API
 */
export const fetchUserData = async (req, res) => {
  if (!req.session.tokens) {
    return res.redirect("/google/auth");
  }

  try {
    const peopleApi = getPeopleApi(req.session.tokens);
    const profileResponse = await peopleApi.people.get({
      resourceName: "people/me",
      personFields: "names,emailAddresses,photos",
    });

    res.status(200).json(profileResponse.data);
  } catch (error) {
    console.error("Error fetching user data:", error.message);
    res.status(500).send("Error fetching user data: " + error.message);
  }
};

/**
 * Trigger manual synchronization of Google Classroom data
 */
export const manualSync = async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/google/auth");
  }

  try {
    const googleCourses = await syncGoogleClassroomData(
      req.session.user,
      req.session.tokens.access_token
    ); // Pass user ID for personalized sync
    res.status(200).json(googleCourses);
  } catch (error) {
    console.error("Error during manual sync:", error.message);
    res.status(500).send("Error during manual sync: " + error.message);
  }
};

// export const manualSync = async (req, res) => {
//   if (!req.session.user) {
//     return res.redirect("/google/auth");
//   }

//   const lockKey = `sync-${req.session.user}`;
//   try {
//     console.log(`Acquiring lock for ${lockKey}...`);
//     await acquireLock(lockKey);
//     console.log(`Lock acquired for ${lockKey}.`);

//     await syncGoogleClassroomData(
//       req.session.user,
//       req.session.tokens.access_token
//     );
//     res.status(200).send("Manual synchronization completed successfully.");
//   } catch (error) {
//     console.error(`Error during sync for ${req.session.user}:`, error.message);
//   } finally {
//     console.log(`Releasing lock for ${lockKey}.`);
//     releaseLock(lockKey);
//   }
// };
