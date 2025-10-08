import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  getSprints, 
  getSprintTarefas, 
  getBacklog, 
  updateSprintTarefa, 
  getReviewBySprint,
  addReview,
  initializeData 
} from '@/lib/storage';
import { Sprint, Review, BacklogItem, SprintTarefa } from '@/types/scrum';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { statusLabels } from '@/lib/formatters';

const ReviewPage = () => {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<string>('');
  const [review, setReview] = useState<Review | null>(null);
  const [tarefas, setTarefas] = useState<(BacklogItem & { sprintTarefaId: string })[]>([]);
  const [formData, setFormData] = useState({
    entregas: '',
    observacoes: ''
  });

  useEffect(() => {
    initializeData();
    const loadedSprints = getSprints();
    setSprints(loadedSprints);
    
    const activeSprint = loadedSprints.find(s => s.status === 'ativo');
    if (activeSprint) {
      setSelectedSprint(activeSprint.id);
      loadReview(activeSprint.id);
      loadTarefas(activeSprint.id);
    }
  }, []);

  useEffect(() => {
    if (selectedSprint) {
      loadReview(selectedSprint);
      loadTarefas(selectedSprint);
    }
  }, [selectedSprint]);

  const loadReview = (sprintId: string) => {
    const existingReview = getReviewBySprint(sprintId);
    if (existingReview) {
      setReview(existingReview);
      setFormData({
        entregas: existingReview.entregas,
        observacoes: existingReview.observacoes
      });
    } else {
      setReview(null);
      setFormData({ entregas: '', observacoes: '' });
    }
  };

  const loadTarefas = (sprintId: string) => {
    const sprintTarefas = getSprintTarefas().filter(st => st.sprint_id === sprintId);
    const backlog = getBacklog();
    
    const tarefasComBacklog = sprintTarefas.map(st => {
      const backlogItem = backlog.find(b => b.id === st.backlog_id);
      return backlogItem ? { ...backlogItem, sprintTarefaId: st.id } : null;
    }).filter(Boolean) as (BacklogItem & { sprintTarefaId: string })[];

    setTarefas(tarefasComBacklog);
  };

  const handleMarcarTodasFeitas = () => {
    if (!selectedSprint) {
      toast.error('Selecione uma sprint');
      return;
    }

    const sprintTarefas = getSprintTarefas().filter(st => st.sprint_id === selectedSprint);
    sprintTarefas.forEach(st => {
      updateSprintTarefa(st.id, { status: 'done' });
    });

    loadTarefas(selectedSprint);
    toast.success('Todas as tarefas marcadas como Feito');
  };

  const handleSaveReview = () => {
    if (!selectedSprint) {
      toast.error('Selecione uma sprint');
      return;
    }

    if (!formData.entregas.trim()) {
      toast.error('Descreva as entregas da sprint');
      return;
    }

    const newReview: Review = {
      id: `review-${Date.now()}`,
      sprint_id: selectedSprint,
      entregas: formData.entregas,
      observacoes: formData.observacoes,
      data: new Date().toISOString()
    };

    addReview(newReview);
    setReview(newReview);
    toast.success('Review salva com sucesso');
  };

  const tarefasPorStatus = {
    todo: tarefas.filter(t => t.status === 'todo').length,
    doing: tarefas.filter(t => t.status === 'doing').length,
    done: tarefas.filter(t => t.status === 'done').length,
    validated: tarefas.filter(t => t.status === 'validated').length
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Sprint Review</h2>
          <p className="text-muted-foreground mt-1">Revise as entregas e conquistas da sprint</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Tarefas da Sprint</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Sprint</label>
                <Select value={selectedSprint} onValueChange={setSelectedSprint}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a sprint" />
                  </SelectTrigger>
                  <SelectContent>
                    {sprints.map(sprint => (
                      <SelectItem key={sprint.id} value={sprint.id}>
                        {sprint.nome} ({sprint.status === 'ativo' ? 'Ativa' : sprint.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">{tarefasPorStatus.todo}</p>
                  <p className="text-xs text-muted-foreground">A Fazer</p>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">{tarefasPorStatus.doing}</p>
                  <p className="text-xs text-muted-foreground">Fazendo</p>
                </div>
                <div className="p-3 bg-success/10 rounded-lg text-center">
                  <p className="text-2xl font-bold text-success">{tarefasPorStatus.done}</p>
                  <p className="text-xs text-muted-foreground">Feito</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg text-center">
                  <p className="text-2xl font-bold text-primary">{tarefasPorStatus.validated}</p>
                  <p className="text-xs text-muted-foreground">Validado</p>
                </div>
              </div>

              <Button onClick={handleMarcarTodasFeitas} className="w-full">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Marcar Todas como Feito
              </Button>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {tarefas.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma tarefa nesta sprint
                  </p>
                ) : (
                  tarefas.map((tarefa) => (
                    <div key={tarefa.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{tarefa.titulo}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            SP: {tarefa.story_points} | {tarefa.responsavel}
                          </p>
                        </div>
                        <Badge variant={tarefa.status === 'done' || tarefa.status === 'validated' ? 'default' : 'secondary'}>
                          {statusLabels[tarefa.status]}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registro da Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {review && (
                <div className="p-3 bg-info/10 border border-info/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    Salva em {format(parseISO(review.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Entregas *</label>
                <Textarea
                  placeholder="Descreva o que foi entregue nesta sprint"
                  value={formData.entregas}
                  onChange={(e) => setFormData({ ...formData, entregas: e.target.value })}
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Observações (PO/Cliente)</label>
                <Textarea
                  placeholder="Feedback do Product Owner ou Cliente"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={4}
                />
              </div>

              <Button onClick={handleSaveReview} className="w-full">
                Salvar Review
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ReviewPage;
