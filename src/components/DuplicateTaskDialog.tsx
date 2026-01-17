import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useBacklog } from '@/hooks/useBacklog';
import { useSubtarefas } from '@/hooks/useSubtarefas';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

interface DuplicateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Tables<'backlog'>;
  onSuccess?: () => void;
}

export const DuplicateTaskDialog = ({
  open,
  onOpenChange,
  task,
  onSuccess
}: DuplicateTaskDialogProps) => {
  const { addBacklogItem } = useBacklog();
  const { subtarefas, addSubtarefa, getSubtarefasByBacklogId } = useSubtarefas();
  
  const [newTitle, setNewTitle] = useState(`${task.titulo} (Cópia)`);
  const [duplicateSubtarefas, setDuplicateSubtarefas] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtarefasDaTarefa = getSubtarefasByBacklogId(task.id);

  const handleDuplicate = async () => {
    if (!newTitle.trim()) {
      toast.error('O título é obrigatório');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the new backlog item
      const newTask = await addBacklogItem({
        titulo: newTitle.trim(),
        descricao: task.descricao,
        story_points: task.story_points,
        prioridade: task.prioridade,
        responsavel: task.responsavel,
        status: 'todo',
        tipo_produto: (task as any).tipo_produto
      } as any);

      // Duplicate subtarefas if enabled
      if (duplicateSubtarefas && subtarefasDaTarefa.length > 0) {
        for (const subtarefa of subtarefasDaTarefa) {
          await addSubtarefa({
            backlog_id: newTask.id,
            titulo: subtarefa.titulo,
            responsavel: subtarefa.responsavel,
            inicio: subtarefa.inicio,
            fim: subtarefa.fim,
            status: 'todo',
            sprint_tarefa_id: null
          });
        }
        toast.success(`Tarefa duplicada com ${subtarefasDaTarefa.length} subtarefa(s)`);
      } else {
        toast.success('Tarefa duplicada com sucesso');
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao duplicar tarefa:', error);
      toast.error('Erro ao duplicar tarefa');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Duplicar Tarefa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Novo Título *</label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Digite o título da nova tarefa"
            />
          </div>

          <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-2">
            <p className="font-medium">Campos que serão copiados:</p>
            <ul className="text-muted-foreground space-y-1">
              <li>• Descrição: {task.descricao || '(vazio)'}</li>
              <li>• Story Points: {task.story_points}</li>
              <li>• Prioridade: {task.prioridade}</li>
              <li>• Responsável: {task.responsavel || '(não definido)'}</li>
              <li>• Tipo de Produto: {(task as any).tipo_produto || '(não definido)'}</li>
            </ul>
          </div>

          {subtarefasDaTarefa.length > 0 && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="duplicate-subtarefas"
                checked={duplicateSubtarefas}
                onCheckedChange={(checked) => setDuplicateSubtarefas(checked === true)}
              />
              <label
                htmlFor="duplicate-subtarefas"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Duplicar {subtarefasDaTarefa.length} subtarefa(s)
              </label>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleDuplicate} 
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Duplicando...' : 'Duplicar'}
            </Button>
            <Button 
              onClick={() => onOpenChange(false)} 
              variant="outline" 
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
