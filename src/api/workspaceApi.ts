import { supabase } from "../services/supabase";

//ambil semua workspace, jika id_user diberikan maka hanya workspace milik user tersebut yang diambil
export async function getWorkspaces(id_user?: number) {
  try {
    console.log(
      "[workspaceApi] Getting workspaces",
      id_user ? `for user ${id_user}` : "(all)"
    );

    let query = supabase
      .from("workspace")
      .select("*")
      .order("created_at", { ascending: true });

    if (id_user) {
      query = query.eq("id_user", id_user);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    console.log(
      "[workspaceApi] Workspaces loaded successfully:",
      data
    );

    return data;
  } catch (error) {
    console.error(
      "[workspaceApi] getWorkspaces failed:",
      error
    );
    throw error;
  }
}

//buat workspace baru, pastikan id_user sudah benar dan valid
export async function createWorkspace(workspace: {
  name: string;
  id_user: number;
}) {
  try {
    console.log(
      "[workspaceApi] Creating workspace:",
      workspace
    );

    const { data, error } = await supabase
      .from("workspace")
      .insert([workspace])
      .select();

    if (error) {
      throw error;
    }

    console.log(
      "[workspaceApi] Workspace created successfully:",
      data
    );

    return data;
  } catch (error) {
    console.error(
      "[workspaceApi] createWorkspace failed:",
      error
    );
    throw error;
  }
}

//update workspace, pastikan id_workspace sudah benar dan valid
export async function updateWorkspace(
  id_workspace: number,
  updateFields: any
) {
  try {
    console.log(
      "[workspaceApi] Updating workspace:",
      {
        id_workspace,
        updateFields,
      }
    );

    const { data, error } = await supabase
      .from("workspace")
      .update(updateFields)
      .eq("id_workspace", id_workspace)
      .select();

    if (error) {
      throw error;
    }

    console.log(
      "[workspaceApi] Workspace updated successfully:",
      data
    );

    return data;
  } catch (error) {
    console.error(
      "[workspaceApi] updateWorkspace failed:",
      error
    );
    throw error;
  }
}

//hapus workspace, pastikan id_workspace sudah benar dan valid
export async function deleteWorkspace(
  id_workspace: number
) {
  try {
    console.log(
      "[workspaceApi] Deleting workspace:",
      id_workspace
    );

    // Hapus course terkait
    const { error: courseError } = await supabase
      .from("course")
      .delete()
      .eq("id_workspace", id_workspace);

    if (courseError) {
      throw courseError;
    }

    // Hapus workspace
    const { error: workspaceError } = await supabase
      .from("workspace")
      .delete()
      .eq("id_workspace", id_workspace);

    if (workspaceError) {
      throw workspaceError;
    }

    console.log(
      "[workspaceApi] Workspace deleted successfully:",
      id_workspace
    );

    return true;
  } catch (error) {
    console.error(
      "[workspaceApi] deleteWorkspace failed:",
      error
    );
    throw error;
  }
}