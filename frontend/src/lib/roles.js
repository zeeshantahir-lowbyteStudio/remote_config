const ROLE_RANK = { viewer: 1, editor: 2, publisher: 3, admin: 4 };

export function hasRole(user, minRole) {
  if (!user) return false;
  return (ROLE_RANK[user.role] || 0) >= (ROLE_RANK[minRole] || 0);
}