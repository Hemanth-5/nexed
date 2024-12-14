import { getClassroomApi } from "../utils/google-auth.js";

// Synchronize Google Classroom data for the given user
export const syncGoogleClassroomData = async (googleId, accessToken) => {
  try {
    console.log(`Fetching Google Classroom data for user ${googleId}...`);

    // Get the Google Classroom API instance using the access token
    const classroomApi = getClassroomApi(accessToken);

    // Fetch the list of courses the user is enrolled in from Google Classroom API
    const userCoursesResponse = await classroomApi.courses.list({
      studentId: "me",
    });

    const googleCourses = userCoursesResponse?.data?.courses || [];
    console.log(
      `Found ${googleCourses.length} courses for user ${googleId} in Google Classroom.`
    );

    // Process and return the courses directly without database storage
    const coursesWithMaterials = await Promise.all(
      googleCourses.map(async (googleCourse) => {
        const materialsResponse =
          await classroomApi.courses.courseWorkMaterials.list({
            courseId: googleCourse.id,
          });

        const materials = materialsResponse?.data?.courseWorkMaterial || [];
        const filteredMaterials = materials.filter(
          (material) => material.id !== null && material.id !== undefined
        );

        return {
          ...googleCourse,
          courseMaterialSets: filteredMaterials,
        };
      })
    );

    console.log(
      `Processed ${coursesWithMaterials.length} courses with materials for user ${googleId}.`
    );

    return coursesWithMaterials; // Return the data directly to the frontend or caller
  } catch (error) {
    console.error(
      `Error during Google Classroom sync for user ${googleId}:`,
      error
    );
    throw error;
  }
};
