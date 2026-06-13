import { supabase } from "../services/supabase";

// GET ALL PRESENCES
export async function getPresences(idWorkspace: number) {
  console.log(`[presencesApi] Getting presences for workspace ${idWorkspace}`);

  const { data, error } = await supabase
    .from("presence")
    .select(
      `
      id_presence,
      presences_at,
      status,
      note,
      id_course,
      created_at,
      course:id_course (
        name,
        room,
        sks,
        start,
        end,
        id_workspace
      )
    `,
    )
    .eq("id_workspace", idWorkspace)
    .order("presences_at", { ascending: false });

  if (error) {
    console.error("[presencesApi] getPresences error:", error);
    throw error;
  }

  const formatted = (data || []).map((item: any) => ({
    id_presence: item.id_presence,
    id_course: item.id_course,
    presences_at: item.presences_at,
    status: item.status,
    note: item.note,
    created_at: item.created_at,
    course_name: item.course?.name || "-",
    course_room: item.course?.room || "-",
    course_sks: item.course?.sks ?? "-",
    course_start: item.course?.start || "-",
    course_end: item.course?.end || "-",
  }));

  console.log(`[presencesApi] Loaded ${formatted.length} presences`);

  return formatted;
}

// CREATE PRESENCE
export async function createPresence(payload: {
  id_course: number;
  id_workspace: number;
  status: string;
  note?: string;
}) {
  console.log("[presencesApi] Creating presence");

  const { data, error } = await supabase
    .from("presence")
    .insert([payload])
    .select();

  if (error) {
    console.error("[presencesApi] createPresence error:", error);
    throw error;
  }

  return data;
}

// UPDATE PRESENCE
export async function updatePresence(
  id_presence: number,
  payload: {
    id_course?: number;
    status?: string;
    note?: string;
  },
) {
  console.log(`[presencesApi] Updating presence ${id_presence}`);

  const { data, error } = await supabase
    .from("presence")
    .update(payload)
    .eq("id_presence", id_presence)
    .select();

  if (error) {
    console.error("[presencesApi] updatePresence error:", error);
    throw error;
  }

  return data;
}

// DELETE PRESENCE
export async function deletePresence(id_presence: number) {
  console.log(`[presencesApi] Deleting presence ${id_presence}`);

  const { error } = await supabase
    .from("presence")
    .delete()
    .eq("id_presence", id_presence);

  if (error) {
    console.error("[presencesApi] deletePresence error:", error);
    throw error;
  }

  return true;
}
