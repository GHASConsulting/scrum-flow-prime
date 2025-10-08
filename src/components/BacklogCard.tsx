import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { BacklogItem, Status } from '@/types/scrum';
import { statusLabels, prioridadeLabels } from '@/lib/formatters';
import { useSprintTarefas } from '@/hooks/useSprintTarefas';
import { useSubtarefas } from '@/hooks/useSubtarefas';
import { ChevronDown, ChevronUp, ArrowRight, ArrowLeft, Plus, Trash2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BacklogCardProps {
  item: BacklogItem;
  onStatusChange: (id: string, newStatus: Status) => void;
  onUpdate: () => void;
}

export const BacklogCard = ({ item, onStatusChange, onUpdate }: BacklogCardProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSubtarefa, setNewSubtarefa] = useState({
    titulo: '',
    responsavel: item.responsavel,
    fim: undefined as Date | undefined,
    status: 'todo' as Status
  });
  
  const { sprintTarefas } = useSprintTarefas();
  const { subtarefas, addSubtarefa, updateSubtarefa, deleteSubtarefa } = useSubtarefas();
  
  const sprintTarefa = sprintTarefas.find(st => st.backlog_id === item.id);
  const isInSprint = !!sprintTarefa;
  
  // Filtrar subtarefas desta tarefa
  const subtarefasDaTarefa = sprintTarefa 
    ? subtarefas.filter(sub => sub.sprint_tarefa_id === sprintTarefa.id)
    : [];

  const canAddSubtarefas = item.status === 'todo' || item.status === 'doing';

  const handleAddSubtarefa = async () => {
    if (!sprintTarefa) {
      toast.error('Tarefa não está associada a uma sprint');
      return;
    }

    if (!newSubtarefa.titulo.trim()) {
      toast.error('O título da subtarefa é obrigatório');
      return;
    }

    if (!newSubtarefa.fim) {
      toast.error('A data fim é obrigatória');
      return;
    }

    try {
      const hoje = new Date();
      const dataFim = new Date(newSubtarefa.fim);
      
      // Garantir que a data fim seja >= hoje
      if (dataFim < hoje) {
        dataFim.setHours(23, 59, 59, 999);
      }
      
      await addSubtarefa({
        sprint_tarefa_id: sprintTarefa.id,
        titulo: newSubtarefa.titulo.trim(),
        responsavel: newSubtarefa.responsavel?.trim() || null,
        inicio: hoje.toISOString(),
        fim: dataFim.toISOString(),
        status: 'todo'
      });

      setNewSubtarefa({
        titulo: '',
        responsavel: item.responsavel,
        fim: undefined,
        status: 'todo'
      });
      
      toast.success('Subtarefa adicionada com sucesso');
    } catch (error) {
      // Error já tratado no hook
    }
  };

  const handleToggleSubtarefaStatus = async (subtarefaId: string, currentStatus: string | null) => {
    const newStatus: Status = currentStatus === 'done' ? 'todo' : 'done';
    try {
      await updateSubtarefa(subtarefaId, { status: newStatus });
    } catch (error) {
      // Error já tratado no hook
    }
  };

  const handleDeleteSubtarefa = async (subtarefaId: string) => {
    try {
      await deleteSubtarefa(subtarefaId);
    } catch (error) {
      // Error já tratado no hook
    }
  };

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
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 space-y-3">
          <DialogTrigger asChild>
            <div className="cursor-pointer" onClick={() => canAddSubtarefas && setIsDialogOpen(true)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{item.titulo}</h4>
                  {item.descricao && (
                    <p className="text-sm text-muted-foreground mt-1">{item.descricao}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline" className="text-xs">
                  SP: {item.story_points}
                </Badge>
                <Badge variant="outline" className={`text-xs border ${prioridadeColors[item.prioridade]}`}>
                  {prioridadeLabels[item.prioridade]}
                </Badge>
                {canAddSubtarefas && subtarefasDaTarefa.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {subtarefasDaTarefa.filter(s => s.status === 'done').length}/{subtarefasDaTarefa.length} subtarefas
                  </Badge>
                )}
              </div>

              <div className="text-sm mt-2">
                <span className="text-muted-foreground">Responsável:</span>{' '}
                <span className="font-medium text-foreground">{item.responsavel}</span>
              </div>
            </div>
          </DialogTrigger>

          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
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
        </CardContent>
      </Card>

      {canAddSubtarefas && (
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{item.titulo}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <h4 className="font-semibold mb-3">Subtarefas</h4>
              
              {subtarefasDaTarefa.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhuma subtarefa cadastrada
                </p>
              ) : (
                <div className="space-y-2">
                  {subtarefasDaTarefa.map((sub) => (
                    <div key={sub.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Checkbox
                        checked={sub.status === 'done'}
                        onCheckedChange={() => handleToggleSubtarefaStatus(sub.id, sub.status)}
                      />
                      <div className="flex-1">
                        <p className={cn(
                          "font-medium",
                          sub.status === 'done' && "line-through text-muted-foreground"
                        )}>
                          {sub.titulo}
                        </p>
                        <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                          <span>Responsável: {sub.responsavel || 'N/A'}</span>
                          <span>Fim: {format(new Date(sub.fim), 'dd/MM/yyyy', { locale: ptBR })}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSubtarefa(sub.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Nova Subtarefa</h4>
              
              <div className="space-y-3">
                <div>
                  <Label>Tarefa *</Label>
                  <Input
                    value={newSubtarefa.titulo}
                    onChange={(e) => setNewSubtarefa({ ...newSubtarefa, titulo: e.target.value })}
                    placeholder="Digite o título da subtarefa"
                  />
                </div>

                <div>
                  <Label>Responsável</Label>
                  <Input
                    value={newSubtarefa.responsavel}
                    onChange={(e) => setNewSubtarefa({ ...newSubtarefa, responsavel: e.target.value })}
                    placeholder="Nome do responsável"
                  />
                </div>

                <div>
                  <Label>Data Fim *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newSubtarefa.fim && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newSubtarefa.fim ? format(newSubtarefa.fim, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione a data'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newSubtarefa.fim}
                        onSelect={(date) => setNewSubtarefa({ ...newSubtarefa, fim: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <Button onClick={handleAddSubtarefa} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Subtarefa
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};
