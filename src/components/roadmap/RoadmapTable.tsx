import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getStatusColor, getStatusLabel, calculateTaskStatus, getDataInicio, getDataFim } from '@/lib/roadmapStatus';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { RoadmapTarefa } from '@/hooks/useRoadmapTarefas';
import { Badge } from '@/components/ui/badge';

interface RoadmapTableProps {
  items: RoadmapTarefa[];
  onRowClick?: (item: RoadmapTarefa) => void;
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
            <TableHead className="font-bold">Tarefa</TableHead>
            <TableHead className="font-bold">Responsável</TableHead>
            <TableHead className="font-bold">Story Points</TableHead>
            <TableHead className="font-bold">Data Início</TableHead>
            <TableHead className="font-bold">Data Fim</TableHead>
            <TableHead className="font-bold">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const status = calculateTaskStatus(item);
            const dataInicio = getDataInicio(item);
            const dataFim = getDataFim(item);
            // Story points = quantidade de subtarefas
            const storyPoints = item.subtarefas.length;
            
            return (
              <TableRow
                key={item.id}
                className={`${getStatusColor(status)} cursor-pointer hover:opacity-80`}
                onClick={() => onRowClick?.(item)}
              >
                <TableCell>
                  <div className="font-medium">{item.titulo}</div>
                  {item.descricao && (
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {item.descricao}
                    </div>
                  )}
                </TableCell>
                <TableCell>{item.responsavel || '-'}</TableCell>
                <TableCell>
                  <Badge variant="outline">{storyPoints}</Badge>
                </TableCell>
                <TableCell>{formatDate(dataInicio)}</TableCell>
                <TableCell>{formatDate(dataFim)}</TableCell>
                <TableCell className="font-semibold">
                  {getStatusLabel(status)}
                </TableCell>
              </TableRow>
            );
          })}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Nenhuma tarefa encontrada
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
