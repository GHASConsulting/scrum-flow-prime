import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getStatusColor, getStatusLabel } from '@/lib/roadmapStatus';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Tables } from '@/integrations/supabase/types';

type Roadmap = Tables<'roadmap'>;

interface RoadmapTableProps {
  items: Roadmap[];
  onRowClick?: (item: Roadmap) => void;
}

export const RoadmapTable = ({ items, onRowClick }: RoadmapTableProps) => {
  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-bold">KR</TableHead>
            <TableHead className="font-bold">Atores</TableHead>
            <TableHead className="font-bold">Data Início Prevista</TableHead>
            <TableHead className="font-bold">Data Fim Prevista</TableHead>
            <TableHead className="font-bold">Data Início Real</TableHead>
            <TableHead className="font-bold">Data Fim Real</TableHead>
            <TableHead className="font-bold">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              className={`${getStatusColor(item.status as any)} cursor-pointer hover:opacity-80`}
              onClick={() => onRowClick?.(item)}
            >
              <TableCell className="font-medium">{item.kr}</TableCell>
              <TableCell>{item.atores || '-'}</TableCell>
              <TableCell>{formatDate(item.data_inicio_prevista)}</TableCell>
              <TableCell>{formatDate(item.data_fim_prevista)}</TableCell>
              <TableCell>{formatDate(item.data_inicio_real)}</TableCell>
              <TableCell>{formatDate(item.data_fim_real)}</TableCell>
              <TableCell className="font-semibold">
                {getStatusLabel(item.status as any)}
              </TableCell>
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Nenhum item encontrado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
