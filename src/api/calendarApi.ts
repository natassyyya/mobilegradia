import { getTasks } from './tasksApi';

export const BADGE_COLORS: Record<string, string> = {
  Blue:   '#60a5fa',
  Green:  '#4ade80',
  Purple: '#c084fc',
  Orange: '#fb923c',
  Yellow: '#fde047',
  Red:    '#f87171',
  Cyan:   '#22d3ee',
  Pink:   '#f472b6',
  Gray:   '#d4d4d8',
};

/**
 * Menentukan warna badge/pin tugas berdasarkan status, prioritas, dan tenggat waktu (deadline).
 */
export const getBadgeColor = (task: any): string => {
  const st = task.status?.toLowerCase() ?? '';
  const pr = task.priority?.toLowerCase() ?? '';
  const isOverdue = task.deadline ? new Date(task.deadline) < new Date() : false;

  if (['completed', 'done', 'selesai'].includes(st)) return BADGE_COLORS.Green;

  if (pr === 'high') {
    if (['in progress', 'ongoing', 'progress'].includes(st)) return BADGE_COLORS.Purple;
    if (['not started', 'todo', 'backlog'].includes(st))     return BADGE_COLORS.Pink;
    if (isOverdue) return BADGE_COLORS.Red;
  }
  if (pr === 'medium') {
    if (['in progress', 'ongoing', 'progress'].includes(st)) return BADGE_COLORS.Blue;
    if (['not started', 'todo', 'backlog'].includes(st))     return BADGE_COLORS.Yellow;
    if (isOverdue) return BADGE_COLORS.Orange;
  }
  if (pr === 'low') {
    if (['in progress', 'ongoing', 'progress'].includes(st)) return BADGE_COLORS.Cyan;
    if (['not started', 'todo', 'backlog'].includes(st))     return BADGE_COLORS.Gray;
  }
  return BADGE_COLORS.Gray;
};

/**
 * Mengambil semua tugas untuk kalender dan menyematkan warna lencana secara dinamis.
 * @param idWorkspace ID Workspace aktif
 */
export async function getCalendarTasks(idWorkspace: number): Promise<any[]> {
  try {
    console.log(`[calendarApi] Loading calendar tasks for workspace: ${idWorkspace}`);
    const tasks = await getTasks(idWorkspace);
    
    const coloredTasks = (tasks ?? []).map((t: any) => ({
      ...t,
      color: getBadgeColor(t),
    }));

    console.log(`[calendarApi] Loaded and colored ${coloredTasks.length} tasks for calendar`);
    return coloredTasks;
  } catch (error) {
    console.error('[calendarApi] getCalendarTasks failed:', error);
    throw error;
  }
}
