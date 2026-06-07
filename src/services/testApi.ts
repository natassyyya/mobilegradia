// src/services/testCoursesApi.ts

import {
  getCourses,
  getCoursesToday,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../api/coursesApi";

import { supabase } from "./supabase";

export async function testApi() {
  try {
    console.log(
      "========== TEST COURSES API =========="
    );

    // Ambil workspace yang pasti ada
    const { data: workspace, error } =
      await supabase
        .from("workspace")
        .select("id_workspace")
        .limit(1)
        .single();

    if (error || !workspace) {
      throw new Error(
        "Workspace tidak ditemukan"
      );
    }

    const workspaceId =
      workspace.id_workspace;

    console.log(
      "WORKSPACE FOUND:",
      workspaceId
    );

    // ==========================
    // GET COURSES
    // ==========================
    const courses =
      await getCourses(
        workspaceId
      );

    console.log(
      "GET COURSES SUCCESS:",
      courses.length
    );

    // ==========================
    // GET COURSES TODAY
    // ==========================
    const todayCourses =
      await getCoursesToday(
        workspaceId
      );

    console.log(
      "GET TODAY SUCCESS:",
      todayCourses.length
    );

    // ==========================
    // CREATE COURSE
    // ==========================
    const created =
      await createCourse({
        name: "TEST COURSE",
        lecturer: "TEST LECTURER",
        phone: "",
        day: "Monday",
        start: "08:00:00",
        end: "10:00:00",
        room: "TEST ROOM",
        sks: 3,
        link: "",
        alias: "TEST",
        id_workspace:
          workspaceId,
      });

    console.log(
      "CREATE SUCCESS:",
      created
    );

    const courseId =
      created[0].id_courses;

    // ==========================
    // UPDATE COURSE
    // ==========================
    const updated =
      await updateCourse(
        courseId,
        {
          name:
            "TEST COURSE UPDATED",
        }
      );

    console.log(
      "UPDATE SUCCESS:",
      updated
    );

    // ==========================
    // DELETE COURSE
    // ==========================
    const deleted =
      await deleteCourse(
        courseId
      );

    console.log(
      "DELETE SUCCESS:",
      deleted
    );

    console.log(
      "========== ALL COURSES TEST PASSED =========="
    );
  } catch (error) {
    console.error(
      "========== COURSES TEST FAILED =========="
    );

    console.error(error);
  }
}