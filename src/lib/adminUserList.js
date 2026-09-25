export function composeAdminUserList(realUsers, presentationPeople, { role = 'all', search = '', page = 1, pageSize = 12 } = {}) {
  const term = search.trim().toLocaleLowerCase('vi-VN');
  const all = [
    ...realUsers,
    ...presentationPeople.map(person => ({ ...person, is_presentation_data: true }))
  ];
  const filtered = all.filter(person =>
    (role === 'all' || person.role === role)
    && (!term || [person.display_name, person.username, person.email]
      .some(value => String(value || '').toLocaleLowerCase('vi-VN').includes(term)))
  ).sort((a, b) => {
    const dateDelta = new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    return dateDelta || String(a.id).localeCompare(String(b.id));
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  return {
    rows: filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    total: filtered.length,
    totalPages,
    page: safePage,
    sampleCount: filtered.filter(person => person.is_presentation_data).length
  };
}
