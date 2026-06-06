import { supabase } from "../services/supabase";

// GET TASKS
export async function getTasks(idWorkspace: number) {
  console.log(`[taskApi] Getting tasks for workspace ${idWorkspace}`);

  const { data, error } = await supabase
    .from("task")
    .select(`
      *,
      course:id_course (
        name,
        id_workspace
      )
    `)
    .eq("id_workspace", idWorkspace)
    .order("deadline", { ascending: true });

  if (error) {
    console.error("[taskApi] getTasks error:", error);
    throw error;
  }

  const formatted = data.map((task) => ({
    ...task,
    relatedCourse: task.course?.name || null,
  }));

  console.log(`[taskApi] Loaded ${formatted.length} tasks`);

  return formatted;
}

// CREATE TASK
export async function createTask(task: any) {
  console.log("[taskApi] Creating task:", task);

  const { data, error } = await supabase
    .from("task")
    .insert([task])
    .select();

  if (error) {
    console.error("[taskApi] createTask error:", error);
    throw error;
  }

  console.log("[taskApi] Task created");

  return data;
}

// UPDATE TASK
export async function updateTask(
  id_task: number,
  updateData: {
    id_course?: number;
    title?: string;
    description?: string;
    deadline?: string;
    status?: string;
    priority?: string;
  }
) {
  console.log(`[taskApi] Updating task ${id_task}`);

  const { data, error } = await supabase
    .from("task")
    .update(updateData)
    .eq("id_task", id_task)
    .select();

  if (error) {
    console.error("[taskApi] updateTask error:", error);
    throw error;
  }

  console.log("[taskApi] Task updated");

  return data;
}

// DELETE TASK
export async function deleteTask(id_task: number) {
  console.log(`[taskApi] Deleting task ${id_task}`);

  const { error } = await supabase
    .from("task")
    .delete()
    .eq("id_task", id_task);

  if (error) {
    console.error("[taskApi] deleteTask error:", error);
    throw error;
  }

  console.log(`[taskApi] Task ${id_task} deleted`);

  return true;
}