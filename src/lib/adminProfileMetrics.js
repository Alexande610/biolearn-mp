const PAGE_SIZE = 500;

export async function loadAllAdminProfiles(supabase, selectFields = 'id,role,total_score,created_at,last_active_at,class_progress') {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase.from('profiles')
      .select(selectFields)
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

export function completedLessonCount(person) {
  if (person.is_presentation_data) return Number(person.completed_lessons || 0);
  return Object.values(person.class_progress || {}).reduce((count, classProgress) =>
    count + (Array.isArray(classProgress?.completedLevels) ? classProgress.completedLevels.length : 0), 0);
}

export function summarizeAdminProfiles(profiles, now = new Date()) {
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  let students = 0;
  let teachers = 0;
  let admins = 0;
  let studentScore = 0;
  let completedLessons = 0;
  let activeToday = 0;
  let activeWeek = 0;
  let newUsersThisWeek = 0;
  for (const person of profiles) {
    if (person.role === 'teacher') teachers++;
    else if (person.role === 'admin') admins++;
    else {
      students++;
      studentScore += Number(person.total_score || 0);
      completedLessons += completedLessonCount(person);
    }
    const active = person.last_active_at && new Date(person.last_active_at);
    if (active && active >= todayStart) activeToday++;
    if (active && active >= weekStart) activeWeek++;
    const created = person.created_at && new Date(person.created_at);
    if (created && created >= weekStart) newUsersThisWeek++;
  }
  return {
    totalUsers: profiles.length,
    students,
    teachers,
    admins,
    averageScore: students ? Math.round(studentScore / students) : 0,
    totalLessonsCompleted: completedLessons,
    activeToday,
    activeWeek,
    newUsersThisWeek
  };
}
