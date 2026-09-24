export const PRESENTATION_MISSING_CODES = new Set(['42P01', 'PGRST205']);

export async function loadPresentationPeople(supabase) {
  const { data, error } = await supabase.from('presentation_people').select('*');
  if (error && PRESENTATION_MISSING_CODES.has(error.code)) return [];
  if (error) throw error;
  return data || [];
}

export async function loadPresentationActivity(supabase, startDate, endDate) {
  const { data, error } = await supabase.from('presentation_activity')
    .select('person_id,metric_date,feature')
    .gte('metric_date', startDate)
    .lte('metric_date', endDate);
  if (error && PRESENTATION_MISSING_CODES.has(error.code)) return [];
  if (error) throw error;
  return data || [];
}

export function presentationWeekScore(person, weekStart) {
  return person.role === 'student' && person.week_start === weekStart
    ? Number(person.weekly_map_score || 0) + Number(person.weekly_pvp_score || 0)
    : 0;
}

export function mergeRankings(realRows, presentationRows, scoreField, limit) {
  return [...realRows, ...presentationRows]
    .filter(row => Number(row[scoreField] || 0) > 0)
    .sort((a, b) => Number(b[scoreField] || 0) - Number(a[scoreField] || 0))
    .slice(0, limit);
}
