import { supabase } from "../services/supabase";

export async function autoMarkAbsent() {
  try {
    const now = new Date();

    // WIB
    const wibString = now.toLocaleString("en-US", {
      timeZone: "Asia/Jakarta",
    });

    const wib = new Date(wibString);

    // Kemarin
    const yesterday = new Date(wib);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayDate = yesterday.toISOString().split("T")[0];

    const hour = wib.getHours();
    const minute = wib.getMinutes();

    console.log(
      `[autoMarkAbsent] Checking auto absent at ${hour}:${minute} WIB`
    );

    console.log(
      `[autoMarkAbsent] Running for date ${yesterdayDate}`
    );

    // Ambil semua course
    const { data: courses, error: courseError } = await supabase
      .from("course")
      .select("id_courses, id_workspace, day");

    if (courseError) {
      console.error("[autoMarkAbsent] Course error:", courseError);
      throw courseError;
    }

    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    const yesterdayName = dayNames[yesterday.getDay()];

    console.log(
      `[autoMarkAbsent] Looking for courses on ${yesterdayName}`
    );

    let totalAbsentAdded = 0;

    for (const course of courses || []) {
      if (course.day !== yesterdayName) continue;

      const startUTC = new Date(
        `${yesterdayDate}T00:00:00+07:00`
      ).toISOString();

      const endUTC = new Date(
        `${yesterdayDate}T23:59:59.999+07:00`
      ).toISOString();

      const { data: existing, error: presenceError } = await supabase
        .from("presence")
        .select("id_presence")
        .eq("id_course", course.id_courses)
        .gte("presences_at", startUTC)
        .lt("presences_at", endUTC);

      if (presenceError) {
        console.error(
          "[autoMarkAbsent] Presence check error:",
          presenceError
        );
        throw presenceError;
      }

      if (!existing || existing.length === 0) {
        const absentTime = new Date(
          `${yesterdayDate}T23:59:00+07:00`
        ).toISOString();

        const nowUTC = now.toISOString();

        const { error: insertError } = await supabase
          .from("presence")
          .insert([
            {
              id_course: course.id_courses,
              id_workspace: course.id_workspace,
              status: "absent",
              note: "Auto marked absent by system",
              presences_at: absentTime,
              created_at: nowUTC,
            },
          ]);

        if (insertError) {
          console.error(
            "[autoMarkAbsent] Insert error:",
            insertError
          );
          throw insertError;
        }

        totalAbsentAdded++;

        console.log(
          `[autoMarkAbsent] Added absent for course ${course.id_courses}`
        );
      }
    }

    console.log(
      `[autoMarkAbsent] Complete. Total added: ${totalAbsentAdded}`
    );

    return {
      success: true,
      totalAbsentAdded,
      checkedDate: yesterdayDate,
      checkedDay: yesterdayName,
    };
  } catch (error: any) {
    console.error(
      "[autoMarkAbsent] Unexpected error:",
      error?.message || error
    );

    throw error;
  }
}