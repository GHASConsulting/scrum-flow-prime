import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getStatusColor, getStatusLabel } from '@/lib/roadmapStatus';
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

  const getDataInicio = (item: RoadmapTarefa) => {
    return formatDate(item.sprint_data_inicio);
  };

  const getDataFim = (item: RoadmapTarefa) => {
    return formatDate(item.sprint_data_fim);
  };

  const getSubtarefasStatus = (item: RoadmapTarefa) => {
    const total = item.subtarefas.length;
    if (total === 0) return { concluidas: 0, total: 0, status: 'NAO_INICIADO' };
    
    const concluidas = item.subtarefas.filter(s => s.status === 'done' || s.status === 'validated').length;
    
    let status = 'NAO_INICIADO';
    if (concluidas === total) status = 'DESENVOLVIDO';
    else if (concluidas > 0) status = 'EM_DESENVOLVIMENTO';
    
    return { concluidas, total, status };
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-bold">Tarefa</TableHead>
            <TableHead className="font-bold">Responsável</TableHead>
            <TableHead className="font-bold">Story Points</TableHead>
            <TableHead className="font-bold">Subtarefas</TableHead>
            <TableHead className="font-bold">Data Início</TableHead>
            <TableHead className="font-bold">Data Fim</TableHead>
            <TableHead className="font-bold">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const subtarefasInfo = getSubtarefasStatus(item);
            return (
              <TableRow
                key={item.id}
                className={`${getStatusColor(subtarefasInfo.status as any)} cursor-pointer hover:opacity-80`}
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
                  <Badge variant="outline">{item.story_points}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{subtarefasInfo.concluidas}/{subtarefasInfo.total}</span>
                    {subtarefasInfo.total > 0 && (
                      <div className="text-xs text-muted-foreground">
                        ({Math.round((subtarefasInfo.concluidas / subtarefasInfo.total) * 100)}%)
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getDataInicio(item)}</TableCell>
                <TableCell>{getDataFim(item)}</TableCell>
                <TableCell className="font-semibold">
                  {getStatusLabel(subtarefasInfo.status as any)}
                </TableCell>
              </TableRow>
            );
          })}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Nenhuma tarefa encontrada
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
