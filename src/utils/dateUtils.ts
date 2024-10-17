// 고정된 날짜 설정
const FIXED_DATE = new Date('2024-10-15T12:00:00');

export const dateUtils = {
  getCurrentDate: () => new Date(FIXED_DATE),
  formatDate: (date: Date = FIXED_DATE) => date.toLocaleDateString(),
  getDay: () => FIXED_DATE.getDay(),
};