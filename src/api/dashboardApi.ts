import { getTasks } from './tasksApi';
import { getCoursesToday } from './coursesApi';

const toLocalYmd = (value: any) => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-CA'); // Format: YYYY-MM-DD
};

export interface DashboardStats {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  addedToday: number;
  dueToday: any[];
  completedPct: number;
  inProgPct: number;
  notStPct: number;
}

export interface DashboardData {
  tasks: any[];
  courses: any[];
  stats: DashboardStats;
}

/**
 * Mengambil semua data yang diperlukan untuk Dashboard (Tasks, Courses Today, & Stats)
 * @param idWorkspace ID Workspace aktif
 */
export async function getDashboardData(idWorkspace: number): Promise<DashboardData> {
  try {
    console.log(`[dashboardApi] Loading dashboard data for workspace: ${idWorkspace}`);

    const [tasks, courses] = await Promise.all([
      getTasks(idWorkspace),
      getCoursesToday(idWorkspace),
    ]);

    const todayYmd = toLocalYmd(new Date());
    const total = tasks.length;
    const completed = tasks.filter((t: any) => t.status === 'Completed').length;
    const inProgress = tasks.filter((t: any) => t.status === 'In progress').length;
    const notStarted = tasks.filter((t: any) =>
      t.status === 'Not started' || t.status === 'Pending' || t.status === 'Overdue'
    ).length;
    
    const addedToday = tasks.filter((t: any) => toLocalYmd(t.created_at) === todayYmd).length;
    const dueToday = tasks.filter((t: any) => toLocalYmd(t.deadline) === todayYmd);
    
    const completedPct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const inProgPct = total > 0 ? Math.round((inProgress / total) * 100) : 0;
    const notStPct = total > 0 ? Math.round((notStarted / total) * 100) : 0;

    console.log(`[dashboardApi] Dashboard data loaded successfully. Total Tasks: ${total}, Today Courses: ${courses.length}`);

    return {
      tasks,
      courses: courses ?? [],
      stats: {
        total,
        completed,
        inProgress,
        notStarted,
        addedToday,
        dueToday,
        completedPct,
        inProgPct,
        notStPct,
      }
    };
  } catch (error) {
    console.error('[dashboardApi] getDashboardData failed:', error);
    throw error;
  }
}
