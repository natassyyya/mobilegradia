import { supabase } from "../services/supabase";

export async function autoMarkOverdue() {
  try {
    const nowUTC = new Date();

    const wibString = nowUTC.toLocaleString("en-US", {
      timeZone: "Asia/Jakarta",
    });

    const wib = new Date(wibString);

    const yesterday = new Date(wib);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    const endOfYesterdayUTC = new Date(
      yesterday.getTime() - 7 * 60 * 60 * 1000,
    ).toISOString();

    console.log(
      `[autoMarkOverdue] Checking tasks with deadline <= ${endOfYesterdayUTC}`,
    );

    const { data, error } = await supabase
      .from("task")
      .update({
        status: "Overdue",
      })
      .lte("deadline", endOfYesterdayUTC)
      .neq("status", "Completed")
      .neq("status", "Overdue")
      .select("id_task, deadline");

    if (error) {
      console.error("[autoMarkOverdue] Error:", error);
      throw error;
    }

    console.log(
      `[autoMarkOverdue] Success: ${data?.length ?? 0} tasks updated`,
    );

    return data;
  } catch (error) {
    console.error("[autoMarkOverdue] Unexpected error:", error);
    throw error;
  }
}
