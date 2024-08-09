// src/utils/getInitials.js
export const getInitials = (fullName) => {
  if (!fullName) return '';
  const names = fullName.split(' ');
  const initials = names.map(name => name[0].toUpperCase()).join('');
  return initials;
};
  