export interface User {
  id_user: number;
  username: string;
  email: string;
}

export interface Workspace {
  id_workspace: number;
  name: string;
  id_user: number;
}

export interface Course {
  id_courses: number;
  name: string;
  alias: string;
  lecturer: string;
  phone?: string;
  day: string;
  start: string;
  end: string;
  room: string;
  sks: number;
  link?: string;
  id_workspace: number;
}

export interface Task {
  id_task: number;
  title: string;
  description?: string;
  status: 'notStarted' | 'inProgress' | 'completed' | 'overdue';
  deadline: string;
  id_course: number;
  id_workspace: number;
}

export interface Presence {
  id_presence: number;
  id_course: number;
  course_name: string;
  course_room: string;
  presences_at: string;
  status: 'present' | 'absent' | 'sick' | 'permission';
  note?: string;
  id_workspace: number;
}
