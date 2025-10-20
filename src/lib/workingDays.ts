import { addDays, addHours, format, isWeekend, parseISO, setHours, setMinutes } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const TIMEZONE = 'America/Sao_Paulo';
const WORK_START_HOUR = 8;
const WORK_END_HOUR = 17;
const HOURS_PER_DAY = 9;

export const adjustToWorkingTime = (date: Date): Date => {
  const zonedDate = toZonedTime(date, TIMEZONE);
  let adjusted = new Date(zonedDate);

  // Se for fim de semana, avança para segunda-feira
  while (isWeekend(adjusted)) {
    adjusted = addDays(adjusted, 1);
  }

  const hours = adjusted.getHours();
  
  // Se antes do horário comercial, ajusta para 08:00
  if (hours < WORK_START_HOUR) {
    adjusted = setHours(setMinutes(adjusted, 0), WORK_START_HOUR);
  }
  // Se depois do horário comercial, ajusta para 08:00 do próximo dia útil
  else if (hours >= WORK_END_HOUR) {
    adjusted = addDays(adjusted, 1);
    adjusted = setHours(setMinutes(adjusted, 0), WORK_START_HOUR);
    while (isWeekend(adjusted)) {
      adjusted = addDays(adjusted, 1);
    }
  }

  return fromZonedTime(adjusted, TIMEZONE);
};

export const addWorkingDays = (startDate: Date, durationDays: number): Date => {
  let current = adjustToWorkingTime(startDate);
  let remainingHours = durationDays * HOURS_PER_DAY;

  while (remainingHours > 0) {
    const zonedCurrent = toZonedTime(current, TIMEZONE);
    const currentHour = zonedCurrent.getHours();
    
    // Horas disponíveis no dia atual
    const hoursLeftInDay = WORK_END_HOUR - currentHour;
    
    if (remainingHours <= hoursLeftInDay) {
      current = addHours(current, remainingHours);
      remainingHours = 0;
    } else {
      // Avança para o início do próximo dia útil
      remainingHours -= hoursLeftInDay;
      current = addDays(setHours(setMinutes(current, 0), WORK_START_HOUR), 1);
      current = adjustToWorkingTime(current);
    }
  }

  return current;
};

export const calculateWorkingDays = (startDate: Date, endDate: Date): number => {
  const start = adjustToWorkingTime(startDate);
  const end = adjustToWorkingTime(endDate);
  
  let current = new Date(start);
  let totalHours = 0;

  while (current < end) {
    const zonedCurrent = toZonedTime(current, TIMEZONE);
    const currentHour = zonedCurrent.getHours();
    
    if (!isWeekend(zonedCurrent) && currentHour >= WORK_START_HOUR && currentHour < WORK_END_HOUR) {
      const nextHour = addHours(current, 1);
      if (nextHour <= end) {
        totalHours++;
      } else {
        // Fração de hora
        const diffMs = end.getTime() - current.getTime();
        totalHours += diffMs / (1000 * 60 * 60);
      }
    }
    
    current = addHours(current, 1);
    current = adjustToWorkingTime(current);
  }

  return Math.round((totalHours / HOURS_PER_DAY) * 100) / 100;
};

export const formatDateTimeForInput = (date: Date): string => {
  const zonedDate = toZonedTime(date, TIMEZONE);
  return format(zonedDate, "yyyy-MM-dd'T'HH:mm");
};

export const parseDateTimeFromInput = (dateString: string): Date => {
  const date = parseISO(dateString);
  return fromZonedTime(date, TIMEZONE);
};
