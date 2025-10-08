import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getBacklog, addBacklogItem, updateBacklogItem, getSprintTarefas, initializeData } from '@/lib/storage';
import { BacklogItem, Status } from '@/types/scrum';
import { statusLabels, prioridadeLabels } from '@/lib/formatters';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { BacklogCard } from '@/components/BacklogCard';
import { toast } from 'sonner';

const Backlog = () => {
  const [backlog, setBacklog] = useState<BacklogItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    story_points: 1,
    prioridade: 'media' as 'baixa' | 'media' | 'alta',
    status: 'todo' as Status,
    responsavel: ''
  });

  useEffect(() => {
    initializeData();
    loadBacklog();
  }, []);

  const loadBacklog = () => {
    setBacklog(getBacklog());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo.trim() || !formData.responsavel.trim()) {
      toast.error('Título e Responsável são obrigatórios');
      return;
    }

    const newItem: BacklogItem = {
      id: Date.now().toString(),
      ...formData
    };

    addBacklogItem(newItem);
    setFormData({
      titulo: '',
      descricao: '',
      story_points: 1,
      prioridade: 'media',
      status: 'todo',
      responsavel: ''
    });
    setIsFormOpen(false);
    loadBacklog();
    toast.success('Tarefa adicionada ao backlog');
  };

  const handleStatusChange = (id: string, newStatus: Status) => {
    updateBacklogItem(id, { status: newStatus });
    loadBacklog();
    toast.success(`Status atualizado para ${statusLabels[newStatus]}`);
  };

  const statusColumns: Status[] = ['todo', 'doing', 'done', 'validated'];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Backlog</h2>
            <p className="text-muted-foreground mt-1">Gerencie as tarefas do projeto</p>
          </div>
        </div>

        <Collapsible open={isFormOpen} onOpenChange={setIsFormOpen}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Nova Tarefa</CardTitle>
                  {isFormOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Título *</label>
                    <Input
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      placeholder="Digite o título da tarefa"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Descrição</label>
                    <Textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Descreva a tarefa"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Story Points</label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.story_points}
                        onChange={(e) => setFormData({ ...formData, story_points: parseInt(e.target.value) || 1 })}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Prioridade</label>
                      <Select value={formData.prioridade} onValueChange={(value: any) => setFormData({ ...formData, prioridade: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baixa">Baixa</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusColumns.map(status => (
                            <SelectItem key={status} value={status}>
                              {statusLabels[status]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Responsável *</label>
                      <Input
                        value={formData.responsavel}
                        onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                        placeholder="Nome do responsável"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </form>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {statusColumns.map((status) => {
            const items = backlog.filter(item => item.status === status);
            return (
              <div key={status} className="space-y-3">
                <div className="bg-secondary rounded-lg p-3">
                  <h3 className="font-semibold text-foreground">{statusLabels[status]}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{items.length} tarefa(s)</p>
                </div>
                <div className="space-y-3">
                  {items.map((item) => (
                    <BacklogCard
                      key={item.id}
                      item={item}
                      onStatusChange={handleStatusChange}
                      onUpdate={loadBacklog}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default Backlog;
