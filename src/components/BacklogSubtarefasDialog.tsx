import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useSubtarefas } from '@/hooks/useSubtarefas';
import { useProfiles } from '@/hooks/useProfiles';
import { formatDateTime, statusLabels } from '@/lib/formatters';
import { Plus, Pencil, Trash2, X, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import type { Status } from '@/types/scrum';

interface BacklogSubtarefasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  backlogId: string;
  backlogTitulo: string;
  defaultResponsavel: string;
  onDuplicate?: () => void;
}

export const BacklogSubtarefasDialog = ({
  open,
  onOpenChange,
  backlogId,
  backlogTitulo,
  defaultResponsavel,
  onDuplicate
}: BacklogSubtarefasDialogProps) => {
  const { subtarefas, addSubtarefa, updateSubtarefa, deleteSubtarefa, getSubtarefasByBacklogId } = useSubtarefas();
  const { profiles } = useProfiles();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    responsavel: defaultResponsavel,
    inicio: '',
    fim: '',
    status: 'todo' as Status
  });

  const subtarefasDaTarefa = getSubtarefasByBacklogId(backlogId);

  const resetForm = () => {
    setFormData({
      titulo: '',
      responsavel: defaultResponsavel,
      inicio: '',
      fim: '',
      status: 'todo'
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const formatDateTimeForInput = (isoString: string) => {
    try {
      const date = parseISO(isoString);
      return format(date, "yyyy-MM-dd'T'HH:mm");
    } catch {
      return '';
    }
  };

  const validateDates = () => {
    if (!formData.inicio || !formData.fim) {
      toast.error('Data/hora de início e fim são obrigatórias');
      return false;
    }

    const inicio = new Date(formData.inicio);
    const fim = new Date(formData.fim);

    if (fim < inicio) {
      toast.error('Data/hora de fim não pode ser anterior ao início');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo.trim() || !formData.responsavel.trim()) {
      toast.error('Título e Responsável são obrigatórios');
      return;
    }

    if (!validateDates()) {
      return;
    }

    try {
      if (editingId) {
        await updateSubtarefa(editingId, {
          titulo: formData.titulo,
          responsavel: formData.responsavel,
          inicio: new Date(formData.inicio).toISOString(),
          fim: new Date(formData.fim).toISOString(),
          status: formData.status
        });
      } else {
        await addSubtarefa({
          backlog_id: backlogId,
          titulo: formData.titulo,
          responsavel: formData.responsavel,
          inicio: new Date(formData.inicio).toISOString(),
          fim: new Date(formData.fim).toISOString(),
          status: formData.status,
          sprint_tarefa_id: null
        });
      }
      resetForm();
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleEdit = (subtarefa: any) => {
    setFormData({
      titulo: subtarefa.titulo,
      responsavel: subtarefa.responsavel || defaultResponsavel,
      inicio: subtarefa.inicio,
      fim: subtarefa.fim,
      status: subtarefa.status || 'todo'
    });
    setEditingId(subtarefa.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir esta subtarefa?')) {
      try {
        await deleteSubtarefa(id);
      } catch (error) {
        // Error handled in hook
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            <span>Subtarefas: {backlogTitulo}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline">{subtarefasDaTarefa.length} subtarefa(s)</Badge>
            <div className="flex gap-2">
              {onDuplicate && (
                <Button size="sm" variant="outline" onClick={onDuplicate}>
                  <Copy className="h-4 w-4 mr-1" />
                  Duplicar Tarefa
                </Button>
              )}
              {!isAdding && (
                <Button size="sm" onClick={() => setIsAdding(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nova Subtarefa
                </Button>
              )}
            </div>
          </div>

          {isAdding && (
            <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-muted/50 rounded-lg border">
              <Input
                placeholder="Título da subtarefa *"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                required
              />
              
              <Select 
                value={formData.responsavel || undefined} 
                onValueChange={(value) => setFormData({ ...formData, responsavel: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável *" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.nome}>
                      {profile.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Início *</label>
                  <Input
                    type="datetime-local"
                    value={formData.inicio ? formatDateTimeForInput(formData.inicio) : ''}
                    onChange={(e) => setFormData({ ...formData, inicio: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Fim *</label>
                  <Input
                    type="datetime-local"
                    value={formData.fim ? formatDateTimeForInput(formData.fim) : ''}
                    onChange={(e) => setFormData({ ...formData, fim: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                    required
                  />
                </div>
              </div>

              <Select value={formData.status} onValueChange={(value: Status) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">A Fazer</SelectItem>
                  <SelectItem value="doing">Fazendo</SelectItem>
                  <SelectItem value="done">Feito</SelectItem>
                  <SelectItem value="validated">Validado</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button type="submit" size="sm" className="flex-1">
                  <Check className="h-3 w-3 mr-1" />
                  {editingId ? 'Atualizar' : 'Adicionar'}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={resetForm}>
                  <X className="h-3 w-3 mr-1" />
                  Cancelar
                </Button>
              </div>
            </form>
          )}

          {subtarefasDaTarefa.length === 0 && !isAdding && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma subtarefa cadastrada. Clique em "Nova Subtarefa" para adicionar.
            </p>
          )}

          <div className="space-y-2">
            {subtarefasDaTarefa.map((sub) => (
              <div key={sub.id} className="p-3 bg-card border rounded-lg text-sm space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{sub.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Responsável: {sub.responsavel || 'Não definido'}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(sub)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(sub.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Início:</span>{' '}
                    <span className="font-medium">{formatDateTime(sub.inicio)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fim:</span>{' '}
                    <span className="font-medium">{formatDateTime(sub.fim)}</span>
                  </div>
                </div>

                {sub.status && (
                  <Badge variant="secondary" className="text-xs">
                    {statusLabels[sub.status as Status] || sub.status}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
