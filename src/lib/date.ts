export function formatLocalTime(date: Date | string | number): string {
  return new Date(date).toLocaleTimeString('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export function formatLocalDateTime(date: Date | string | number): string {
  return new Date(date).toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
  });
}
