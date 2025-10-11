import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const TIMEZONE = 'America/Sao_Paulo';

export const formatDateTime = (dateString: string): string => {
  const date = parseISO(dateString);
  const zonedDate = toZonedTime(date, TIMEZONE);
  return format(zonedDate, 'dd/MM/yyyy HH:mm');
};

export const formatDate = (dateString: string): string => {
  const date = parseISO(dateString);
  const zonedDate = toZonedTime(date, TIMEZONE);
  return format(zonedDate, 'dd/MM/yyyy');
};

export const statusLabels: Record<string, string> = {
  todo: 'A Fazer',
  doing: 'Fazendo',
  done: 'Feito',
  validated: 'Validado'
};

export const prioridadeLabels: Record<string, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta'
};
