import { useState, useCallback } from 'react';

export function useDateUtils() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const getCurrentDate = useCallback(() => {
    return new Date(currentDate);
  }, [currentDate]);

  const updateCurrentDate = useCallback((newDate: Date) => {
    setCurrentDate(newDate);
  }, []);

  const addDays = useCallback((days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  }, [currentDate]);

  const formatDate = useCallback((date: Date = currentDate) => {
    return date.toLocaleDateString();
  }, [currentDate]);

  return {
    currentDate,
    getCurrentDate,
    updateCurrentDate,
    addDays,
    formatDate
  };
}