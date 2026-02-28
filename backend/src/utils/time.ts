export const getRemainingMs = (endTime: Date) => {
  const remaining = endTime.getTime() - Date.now();
  return remaining > 0 ? remaining : 0;
};
