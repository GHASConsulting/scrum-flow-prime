import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BacklogItem, Status } from '@/types/scrum';
import { statusLabels, prioridadeLabels } from '@/lib/formatters';
import { getSprintTarefas } from '@/lib/storage';
import { ChevronDown, ChevronUp, ArrowRight, ArrowLeft } from 'lucide-react';
import { SubtarefasPanel } from './SubtarefasPanel';

interface BacklogCardProps {
  item: BacklogItem;
  onStatusChange: (id: string, newStatus: Status) => void;
  onUpdate: () => void;
}

export const BacklogCard = ({ item, onStatusChange, onUpdate }: BacklogCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const sprintTarefas = getSprintTarefas();
  const sprintTarefa = sprintTarefas.find(st => st.backlog_id === item.id);
  const isInSprint = !!sprintTarefa;

  const getNextStatus = (current: Status): Status | null => {
    const order: Status[] = ['todo', 'doing', 'done', 'validated'];
    const currentIndex = order.indexOf(current);
    return currentIndex < order.length - 1 ? order[currentIndex + 1] : null;
  };

  const getPrevStatus = (current: Status): Status | null => {
    const order: Status[] = ['todo', 'doing', 'done', 'validated'];
    const currentIndex = order.indexOf(current);
    return currentIndex > 0 ? order[currentIndex - 1] : null;
  };

  const prioridadeColors = {
    baixa: 'bg-info/20 text-info border-info/30',
    media: 'bg-warning/20 text-warning border-warning/30',
    alta: 'bg-destructive/20 text-destructive border-destructive/30'
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-foreground">{item.titulo}</h4>
            {item.descricao && (
              <p className="text-sm text-muted-foreground mt-1">{item.descricao}</p>
            )}
          </div>
          {isInSprint && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="ml-2"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            SP: {item.story_points}
          </Badge>
          <Badge variant="outline" className={`text-xs border ${prioridadeColors[item.prioridade]}`}>
            {prioridadeLabels[item.prioridade]}
          </Badge>
        </div>

        <div className="text-sm">
          <span className="text-muted-foreground">Responsável:</span>{' '}
          <span className="font-medium text-foreground">{item.responsavel}</span>
        </div>

        <div className="flex gap-2">
          {getPrevStatus(item.status) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange(item.id, getPrevStatus(item.status)!)}
              className="flex-1"
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              {statusLabels[getPrevStatus(item.status)!]}
            </Button>
          )}
          {getNextStatus(item.status) && (
            <Button
              size="sm"
              onClick={() => onStatusChange(item.id, getNextStatus(item.status)!)}
              className="flex-1"
            >
              {statusLabels[getNextStatus(item.status)!]}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>

        {isExpanded && isInSprint && sprintTarefa && (
          <div className="pt-3 border-t">
            <SubtarefasPanel sprintTarefaId={sprintTarefa.id} defaultResponsavel={item.responsavel} onUpdate={onUpdate} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
