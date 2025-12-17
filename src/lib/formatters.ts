import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const TIMEZONE = 'America/Sao_Paulo';

export const formatDateTime = (dateString: string): string => {
  const date = parseISO(dateString);
  const zonedDate = toZonedTime(date, TIMEZONE);
  return format(zonedDate, 'dd/MM/yyyy HH:mm');
};

export const formatDate = (dateString: string): string => {
  // Extrai apenas a parte da data (yyyy-MM-dd) para evitar problemas de timezone
  // O banco pode retornar formatos como: "2025-12-01", "2025-12-01T00:00:00", "2025-12-01 00:00:00+00"
  const match = dateString.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    const [year, month, day] = match[1].split('-');
    return `${day}/${month}/${year}`;
  }
  // Fallback para o método anterior caso o formato seja diferente
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
