import { useState, useEffect } from 'react';

const BIOLEARN_TIME_ZONE = 'Asia/Ho_Chi_Minh';

const getVietnamDateParts = (date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BIOLEARN_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);

  return Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)]));
};

const formatDateKey = (date) => [
  date.getUTCFullYear(),
  String(date.getUTCMonth() + 1).padStart(2, '0'),
  String(date.getUTCDate()).padStart(2, '0')
].join('-');

const calculateWeeklyTimeLeft = () => {
  const now = new Date();
  const vietnam = getVietnamDateParts(now);
  const vietnamDay = new Date(Date.UTC(vietnam.year, vietnam.month - 1, vietnam.day));
  const dayOfWeek = vietnamDay.getUTCDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const currentMonday = new Date(vietnamDay);
  currentMonday.setUTCDate(currentMonday.getUTCDate() - daysSinceMonday);

  const nextMonday = new Date(currentMonday);
  nextMonday.setUTCDate(nextMonday.getUTCDate() + 7);

  // Việt Nam luôn UTC+7 và không dùng daylight saving time.
  const nextMondayInstant = Date.UTC(
    nextMonday.getUTCFullYear(),
    nextMonday.getUTCMonth(),
    nextMonday.getUTCDate(),
    -7, 0, 0
  );
  const totalSeconds = Math.max(0, Math.floor((nextMondayInstant - now.getTime()) / 1000));

  return {
    days: Math.floor(totalSeconds / (3600 * 24)),
    hours: Math.floor((totalSeconds % (3600 * 24)) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalSeconds,
    weekStart: formatDateKey(currentMonday)
  };
};

/**
 * Đếm tới thứ Hai 00:00 theo múi giờ cố định của BioLearn.
 * weekStart thay đổi đúng lúc sang tuần để màn hình có thể tải kỳ mới.
 */
export const useWeeklyCountdown = () => {
  const [timeLeft, setTimeLeft] = useState(calculateWeeklyTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateWeeklyTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return timeLeft;
};

/**
 * Hook to calculate time until the next midnight (00:00 AM of the next day)
 */
export const useDailyCountdown = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const diff = tomorrow.getTime() - now.getTime();
      const totalSeconds = Math.floor(diff / 1000);

      if (totalSeconds <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
      }

      return {
        hours: Math.floor(totalSeconds / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
        totalSeconds
      };
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, []);

  return timeLeft;
};

