import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSubtarefasBySprintTarefa, addSubtarefa, updateSubtarefa, deleteSubtarefa } from '@/lib/storage';
import { Subtarefa, Status } from '@/types/scrum';
import { formatDateTime, statusLabels } from '@/lib/formatters';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

interface SubtarefasPanelProps {
  sprintTarefaId: string;
  defaultResponsavel: string;
  onUpdate: () => void;
}

export const SubtarefasPanel = ({ sprintTarefaId, defaultResponsavel, onUpdate }: SubtarefasPanelProps) => {
  const [subtarefas, setSubtarefas] = useState<Subtarefa[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    responsavel: defaultResponsavel,
    inicio: '',
    fim: '',
    status: 'todo' as Status
  });

  useEffect(() => {
    loadSubtarefas();
  }, [sprintTarefaId]);

  const loadSubtarefas = () => {
    const subs = getSubtarefasBySprintTarefa(sprintTarefaId);
    setSubtarefas(subs);
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo.trim() || !formData.responsavel.trim()) {
      toast.error('Título e Responsável são obrigatórios');
      return;
    }

    if (!validateDates()) {
      return;
    }

    if (editingId) {
      updateSubtarefa(editingId, {
        titulo: formData.titulo,
        responsavel: formData.responsavel,
        inicio: formData.inicio,
        fim: formData.fim,
        status: formData.status
      });
      toast.success('Subtarefa atualizada');
    } else {
      const newSubtarefa: Subtarefa = {
        id: Date.now().toString(),
        sprint_tarefa_id: sprintTarefaId,
        ...formData
      };
      addSubtarefa(newSubtarefa);
      toast.success('Subtarefa adicionada');
    }

    resetForm();
    loadSubtarefas();
    onUpdate();
  };

  const handleEdit = (subtarefa: Subtarefa) => {
    setFormData({
      titulo: subtarefa.titulo,
      responsavel: subtarefa.responsavel,
      inicio: subtarefa.inicio,
      fim: subtarefa.fim,
      status: subtarefa.status || 'todo'
    });
    setEditingId(subtarefa.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente excluir esta subtarefa?')) {
      deleteSubtarefa(id);
      loadSubtarefas();
      onUpdate();
      toast.success('Subtarefa excluída');
    }
  };

  const formatDateTimeForInput = (isoString: string) => {
    try {
      const date = parseISO(isoString);
      return format(date, "yyyy-MM-dd'T'HH:mm");
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm text-foreground">Subtarefas</h4>
        {!isAdding && (
          <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
            <Plus className="h-3 w-3 mr-1" />
            Nova Subtarefa
          </Button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="space-y-3 p-3 bg-muted/50 rounded-lg">
          <Input
            placeholder="Título da subtarefa *"
            value={formData.titulo}
            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            required
          />
          
          <Input
            placeholder="Responsável *"
            value={formData.responsavel}
            onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
            required
          />

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

      {subtarefas.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhuma subtarefa cadastrada
        </p>
      )}

      <div className="space-y-2">
        {subtarefas.map((sub) => (
          <div key={sub.id} className="p-3 bg-card border rounded-lg text-sm space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-foreground">{sub.titulo}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Responsável: {sub.responsavel}
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
              <div className="text-xs">
                <span className="text-muted-foreground">Status:</span>{' '}
                <span className="font-medium">{statusLabels[sub.status]}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
