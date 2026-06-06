import { supabase } from '../services/supabase';

//ambil semua course dalam workspace tertentu, pastikan id_workspace sudah benar dan valid
export async function getCourses(idWorkspace: number) {
  try {
    console.log(
      '[courseApi] Getting courses for workspace:',
      idWorkspace
    );

    const { data, error } = await supabase
      .from('course')
      .select('*')
      .eq('id_workspace', idWorkspace);

    if (error) {
      throw error;
    }

    console.log(
      '[courseApi] Courses loaded successfully:',
      data
    );

    return data;
  } catch (error) {
    console.error(
      '[courseApi] getCourses failed:',
      error
    );
    throw error;
  }
}

//ammbil course berdasarkan hari tertentu, pastikan id_workspace sudah benar dan valid
export async function getCoursesToday(
  idWorkspace: number
) {
  try {
    const today = new Date().toLocaleString(
      'en-US',
      {
        weekday: 'long',
      }
    );

    console.log(
      '[courseApi] Getting today courses:',
      {
        workspace: idWorkspace,
        day: today,
      }
    );

    const { data, error } = await supabase
      .from('course')
      .select('*')
      .eq('id_workspace', idWorkspace)
      .eq('day', today);

    if (error) {
      throw error;
    }

    console.log(
      '[courseApi] Today courses loaded:',
      data
    );

    return data;
  } catch (error) {
    console.error(
      '[courseApi] getCoursesToday failed:',
      error
    );
    throw error;
  }
}

// buat course baru, pastikan id_workspace sudah benar dan valid
export async function createCourse(
  course: any
) {
  try {
    console.log(
      '[courseApi] Creating course:',
      course
    );

    const { data, error } = await supabase
      .from('course')
      .insert([course])
      .select();

    if (error) {
      throw error;
    }

    console.log(
      '[courseApi] Course created successfully:',
      data
    );

    return data;
  } catch (error) {
    console.error(
      '[courseApi] createCourse failed:',
      error
    );
    throw error;
  }
}

// update course, pastikan id_courses sudah benar dan valid
export async function updateCourse(
  id_courses: number,
  updateFields: any
) {
  try {
    console.log(
      '[courseApi] Updating course:',
      {
        id_courses,
        updateFields,
      }
    );

    const { data, error } = await supabase
      .from('course')
      .update(updateFields)
      .eq('id_courses', id_courses)
      .select();

    if (error) {
      throw error;
    }

    console.log(
      '[courseApi] Course updated successfully:',
      data
    );

    return data;
  } catch (error) {
    console.error(
      '[courseApi] updateCourse failed:',
      error
    );
    throw error;
  }
}

// hapus course, pastikan id_courses sudah benar dan valid
export async function deleteCourse(
  id_courses: number
) {
  try {
    console.log(
      '[courseApi] Deleting course:',
      id_courses
    );

    const { error } = await supabase
      .from('course')
      .delete()
      .eq('id_courses', id_courses);

    if (error) {
      throw error;
    }

    console.log(
      '[courseApi] Course deleted successfully:',
      id_courses
    );

    return true;
  } catch (error) {
    console.error(
      '[courseApi] deleteCourse failed:',
      error
    );
    throw error;
  }
}