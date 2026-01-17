import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useBacklog } from '@/hooks/useBacklog';
import { useSprints } from '@/hooks/useSprints';
import { useSprintTarefas } from '@/hooks/useSprintTarefas';
import { useProfiles } from '@/hooks/useProfiles';
import { useSubtarefas } from '@/hooks/useSubtarefas';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';
import { CalendarIcon, Plus, Check, Trash2, X, Edit, Copy, ChevronDown, ChevronRight, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { statusLabels, formatDate } from '@/lib/formatters';
import type { BacklogItem, Status } from '@/types/scrum';
import type { Tables } from '@/integrations/supabase/types';
import { DuplicateTaskDialog } from '@/components/DuplicateTaskDialog';
import { BacklogSubtarefasDialog } from '@/components/BacklogSubtarefasDialog';

const SprintPlanning = () => {
  const { backlog, addBacklogItem, updateBacklogItem, deleteBacklogItem } = useBacklog();
  const { sprints, addSprint, updateSprint, deleteSprint } = useSprints();
  const { sprintTarefas, addSprintTarefa: addTarefaToSprint, deleteSprintTarefa } = useSprintTarefas();
  const { profiles } = useProfiles();
  const { subtarefas, getSubtarefasByBacklogId } = useSubtarefas();
  
  const [selectedSprint, setSelectedSprint] = useState<string>('');
  const [isCreatingSprint, setIsCreatingSprint] = useState(false);
  const [defaultResponsavel, setDefaultResponsavel] = useState('');
  const [isEditingSprint, setIsEditingSprint] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>('all');
  const [filtroTipoProduto, setFiltroTipoProduto] = useState<string>('all');
  const [mostrarApenasSemSprint, setMostrarApenasSemSprint] = useState(false);
  const [editingTask, setEditingTask] = useState<BacklogItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Estados para duplicar e subtarefas
  const [duplicateTask, setDuplicateTask] = useState<Tables<'backlog'> | null>(null);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [subtarefasTask, setSubtarefasTask] = useState<Tables<'backlog'> | null>(null);
  const [isSubtarefasDialogOpen, setIsSubtarefasDialogOpen] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  
  const [newTask, setNewTask] = useState<{
    titulo: string;
    descricao: string;
    story_points: number;
    prioridade: 'baixa' | 'media' | 'alta';
    responsavel: string;
    tipo_produto?: 'Produto' | 'Projeto GHAS' | 'Projeto Inovemed';
  }>({
    titulo: '',
    descricao: '',
    story_points: 1,
    prioridade: 'media',
    responsavel: '',
    tipo_produto: undefined
  });
  
  const [newSprint, setNewSprint] = useState({
    nome: '',
    data_inicio: undefined as Date | undefined,
    data_fim: undefined as Date | undefined
  });

  const [editSprint, setEditSprint] = useState({
    data_inicio: undefined as Date | undefined,
    data_fim: undefined as Date | undefined
  });

  const calculateSprintStatus = (dataInicio: string, dataFim: string): 'planejamento' | 'ativo' | 'concluido' => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const inicio = new Date(dataInicio);
    inicio.setHours(0, 0, 0, 0);
    
    const fim = new Date(dataFim);
    fim.setHours(0, 0, 0, 0);

    if (hoje < inicio) {
      return 'planejamento';
    } else if (hoje > fim) {
      return 'concluido';
    } else {
      return 'ativo';
    }
  };

  const handleCreateSprint = async () => {
    if (!newSprint.nome || !newSprint.data_inicio || !newSprint.data_fim) {
      toast.error('Preencha todos os campos da sprint');
      return;
    }

    if (newSprint.data_fim < newSprint.data_inicio) {
      toast.error('Data de fim deve ser posterior à data de início');
      return;
    }

    try {
      const dataInicioFormatted = format(newSprint.data_inicio, 'yyyy-MM-dd');
      const dataFimFormatted = format(newSprint.data_fim, 'yyyy-MM-dd');
      const status = calculateSprintStatus(dataInicioFormatted, dataFimFormatted);

      const sprint = await addSprint({
        nome: newSprint.nome,
        data_inicio: dataInicioFormatted,
        data_fim: dataFimFormatted,
        status
      });

      setSelectedSprint(sprint.id);
      setIsCreatingSprint(false);
      setNewSprint({ nome: '', data_inicio: undefined, data_fim: undefined });
      
      if (status === 'ativo') {
        toast.success('Sprint criada e ativada automaticamente');
      } else if (status === 'concluido') {
        toast.success('Sprint criada com status concluído (datas no passado)');
      } else {
        toast.success('Sprint criada com status planejamento');
      }
    } catch (error) {
      // Error já tratado no hook
    }
  };

  const handleActivateSprint = async (sprintId: string) => {
    try {
      // Desativar todas as outras sprints
      const otherActiveSprint = sprints.find(s => s.status === 'ativo' && s.id !== sprintId);
      if (otherActiveSprint) {
        await updateSprint(otherActiveSprint.id, { status: 'planejamento' });
      }
      
      // Ativar a sprint selecionada
      await updateSprint(sprintId, { status: 'ativo' });
      toast.success('Sprint ativada');
    } catch (error) {
      // Error já tratado no hook
    }
  };

  const handleFinishSprint = async (sprintId: string) => {
    try {
      await updateSprint(sprintId, { status: 'concluido' });
      toast.success('Sprint encerrada com sucesso');
    } catch (error) {
      // Error já tratado no hook
    }
  };

  const handleUpdateSprintDates = async () => {
    if (!selectedSprintData) {
      return;
    }

    // Usar as datas atuais da sprint se não foram editadas
    const dataInicio = editSprint.data_inicio || toZonedTime(parseISO(selectedSprintData.data_inicio), 'America/Sao_Paulo');
    const dataFim = editSprint.data_fim || toZonedTime(parseISO(selectedSprintData.data_fim), 'America/Sao_Paulo');

    if (dataFim < dataInicio) {
      toast.error('Data de fim deve ser posterior à data de início');
      return;
    }

    try {
      const updates: { data_inicio?: string; data_fim?: string } = {};
      
      if (editSprint.data_inicio) {
        updates.data_inicio = format(editSprint.data_inicio, 'yyyy-MM-dd');
      }
      
      if (editSprint.data_fim) {
        updates.data_fim = format(editSprint.data_fim, 'yyyy-MM-dd');
      }

      if (Object.keys(updates).length === 0) {
        toast.error('Selecione pelo menos uma data para atualizar');
        return;
      }

      await updateSprint(selectedSprintData.id, updates);

      setIsEditingSprint(false);
      setEditSprint({ data_inicio: undefined, data_fim: undefined });
      toast.success('Datas da sprint atualizadas com sucesso');
    } catch (error) {
      // Error já tratado no hook
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.titulo.trim()) {
      toast.error('O título é obrigatório');
      return;
    }

    if (newTask.titulo.trim().length > 200) {
      toast.error('O título deve ter no máximo 200 caracteres');
      return;
    }

    if (newTask.descricao && newTask.descricao.trim().length > 1000) {
      toast.error('A descrição deve ter no máximo 1000 caracteres');
      return;
    }

    if (newTask.story_points < 1 || newTask.story_points > 100) {
      toast.error('Story points deve estar entre 1 e 100');
      return;
    }

    if (!newTask.responsavel || !newTask.responsavel.trim()) {
      toast.error('O responsável é obrigatório');
      return;
    }

    try {
      await addBacklogItem({
        titulo: newTask.titulo.trim(),
        descricao: newTask.descricao.trim() || null,
        story_points: newTask.story_points,
        prioridade: newTask.prioridade,
        responsavel: newTask.responsavel.trim(),
        status: 'todo',
        ...(newTask.tipo_produto && { tipo_produto: newTask.tipo_produto })
      } as any);

      setNewTask({
        titulo: '',
        descricao: '',
        story_points: 1,
        prioridade: 'media',
        responsavel: '',
        tipo_produto: undefined
      });
      setIsCreatingTask(false);
      toast.success('Tarefa criada no backlog');
    } catch (error) {
      // Error já tratado no hook
    }
  };

  const handleEditTask = (task: Tables<'backlog'>) => {
    setEditingTask({
      id: task.id,
      titulo: task.titulo,
      descricao: task.descricao || '',
      story_points: task.story_points,
      prioridade: task.prioridade as 'baixa' | 'media' | 'alta',
      status: task.status as Status,
      responsavel: task.responsavel || '',
      tipo_produto: (task as any).tipo_produto as 'Produto' | 'Projeto GHAS' | 'Projeto Inovemed' | undefined
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;

    if (!editingTask.titulo.trim()) {
      toast.error('O título é obrigatório');
      return;
    }

    if (editingTask.titulo.trim().length > 200) {
      toast.error('O título deve ter no máximo 200 caracteres');
      return;
    }

    if (editingTask.descricao && editingTask.descricao.trim().length > 1000) {
      toast.error('A descrição deve ter no máximo 1000 caracteres');
      return;
    }

    if (editingTask.story_points < 1 || editingTask.story_points > 100) {
      toast.error('Story points deve estar entre 1 e 100');
      return;
    }

    if (!editingTask.responsavel || !editingTask.responsavel.trim()) {
      toast.error('O responsável é obrigatório');
      return;
    }

    try {
      const updates: any = {
        titulo: editingTask.titulo.trim(),
        descricao: editingTask.descricao?.trim() || null,
        story_points: editingTask.story_points,
        prioridade: editingTask.prioridade,
        responsavel: editingTask.responsavel.trim()
      };
      
      if (editingTask.tipo_produto) {
        updates.tipo_produto = editingTask.tipo_produto;
      }

      await updateBacklogItem(editingTask.id, updates);

      setIsEditDialogOpen(false);
      setEditingTask(null);
      toast.success('Tarefa atualizada com sucesso');
    } catch (error) {
      // Error já tratado no hook
    }
  };

  const handleAddToSprint = async (backlogId: string) => {
    if (!selectedSprint) {
      toast.error('Selecione uma sprint no agrupamento "Gerenciar Sprint" primeiro');
      return;
    }

    const alreadyAdded = sprintTarefas.some(
      st => st.sprint_id === selectedSprint && st.backlog_id === backlogId
    );

    if (alreadyAdded) {
      toast.error('Tarefa já está na sprint');
      return;
    }

    const backlogItem = backlog.find(b => b.id === backlogId);
    const responsavel = defaultResponsavel || backlogItem?.responsavel || null;

    try {
      await addTarefaToSprint({
        sprint_id: selectedSprint,
        backlog_id: backlogId,
        responsavel,
        status: 'todo'
      });
      toast.success('Tarefa adicionada à sprint');
    } catch (error) {
      // Error já tratado no hook
    }
  };

  const handleRemoveFromSprint = async (backlogId: string) => {
    const sprintTarefa = sprintTarefas.find(
      st => st.sprint_id === selectedSprint && st.backlog_id === backlogId
    );

    if (!sprintTarefa) return;

    try {
      await deleteSprintTarefa(sprintTarefa.id);
    } catch (error) {
      // Error já tratado no hook
    }
  };

  const getAvailableBacklog = () => {
    // Mostra sempre todas as tarefas, exceto as validadas
    let filteredBacklog = backlog.filter(b => b.status !== 'validated');
    
    // Se houver sprint selecionada, remover tarefas que já estão nela
    if (selectedSprint) {
      const tarefasNaSprint = sprintTarefas
        .filter(st => st.sprint_id === selectedSprint)
        .map(st => st.backlog_id);
      
      filteredBacklog = filteredBacklog.filter(b => !tarefasNaSprint.includes(b.id));
    }
    
    if (filtroResponsavel && filtroResponsavel !== 'all') {
      filteredBacklog = filteredBacklog.filter(b => b.responsavel === filtroResponsavel);
    }

    if (filtroTipoProduto && filtroTipoProduto !== 'all') {
      filteredBacklog = filteredBacklog.filter(b => (b as any).tipo_produto === filtroTipoProduto);
    }
    
    // Filtrar por tarefas sem sprint
    if (mostrarApenasSemSprint) {
      const todasTarefasEmSprints = sprintTarefas.map(st => st.backlog_id);
      filteredBacklog = filteredBacklog.filter(b => !todasTarefasEmSprints.includes(b.id));
    }
    
    return filteredBacklog;
  };

  const getSprintDaTarefa = (backlogId: string) => {
    const sprintTarefa = sprintTarefas.find(st => st.backlog_id === backlogId);
    if (!sprintTarefa) return null;
    return sprints.find(s => s.id === sprintTarefa.sprint_id);
  };

  const getTarefasDaSprint = () => {
    if (!selectedSprint) return [];
    
    const tarefasIds = sprintTarefas
      .filter(st => st.sprint_id === selectedSprint)
      .map(st => st.backlog_id);
    
    return backlog.filter(b => tarefasIds.includes(b.id));
  };

  const selectedSprintData = sprints.find(s => s.id === selectedSprint);
  const availableBacklog = getAvailableBacklog();
  const tarefasDaSprint = getTarefasDaSprint();

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Sprint Planning</h2>
          <p className="text-muted-foreground mt-1">Planeje e organize as sprints do projeto</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Sprint</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isCreatingSprint ? (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Sprint Selecionada</label>
                    <Select value={selectedSprint} onValueChange={setSelectedSprint}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma sprint" />
                      </SelectTrigger>
                      <SelectContent>
                        {sprints.map(sprint => (
                          <SelectItem key={sprint.id} value={sprint.id}>
                            {sprint.nome} ({sprint.status === 'ativo' ? 'Ativa' : sprint.status === 'concluido' ? 'Concluída' : 'Planejamento'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedSprintData && (
                    <div className="p-4 bg-muted rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{selectedSprintData.nome}</h4>
                        <Badge variant={selectedSprintData.status === 'ativo' ? 'default' : 'secondary'}>
                          {selectedSprintData.status === 'ativo' ? 'Ativa' : selectedSprintData.status === 'concluido' ? 'Concluída' : 'Planejamento'}
                        </Badge>
                      </div>

                      {!isEditingSprint ? (
                        <>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(selectedSprintData.data_inicio)} - {formatDate(selectedSprintData.data_fim)}
                          </p>
                          
                          <div className="space-y-2">
                            {selectedSprintData.status !== 'ativo' && (
                              <Button 
                                onClick={() => handleActivateSprint(selectedSprintData.id)}
                                size="sm"
                                className="w-full"
                              >
                                Ativar Sprint
                              </Button>
                            )}
                            
                            {selectedSprintData.status === 'ativo' && (
                              <Button 
                                onClick={() => handleFinishSprint(selectedSprintData.id)}
                                size="sm"
                                variant="destructive"
                                className="w-full"
                              >
                                Encerrar Sprint
                              </Button>
                            )}

                            {selectedSprintData.status !== 'concluido' && (
                              <Button 
                                onClick={() => {
                                  setIsEditingSprint(true);
                                  setEditSprint({
                                    data_inicio: toZonedTime(parseISO(selectedSprintData.data_inicio), 'America/Sao_Paulo'),
                                    data_fim: toZonedTime(parseISO(selectedSprintData.data_fim), 'America/Sao_Paulo')
                                  });
                                }}
                                size="sm"
                                variant="outline"
                                className="w-full"
                              >
                                Alterar Datas
                              </Button>
                            )}

                            {/* Botão Deletar Sprint */}
                            {(() => {
                              const tarefasNaSprint = sprintTarefas.filter(st => st.sprint_id === selectedSprintData.id);
                              const podeDeletar = tarefasNaSprint.length === 0;
                              return (
                                <Button 
                                  onClick={async () => {
                                    if (!podeDeletar) {
                                      toast.error('Não é possível excluir: existem tarefas associadas a esta sprint');
                                      return;
                                    }
                                    if (confirm(`Tem certeza que deseja excluir a sprint "${selectedSprintData.nome}"?`)) {
                                      await deleteSprint(selectedSprintData.id);
                                      setSelectedSprint('');
                                    }
                                  }}
                                  size="sm"
                                  variant="destructive"
                                  className="w-full"
                                  disabled={!podeDeletar}
                                  title={!podeDeletar ? 'Remova todas as tarefas da sprint primeiro' : ''}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir Sprint
                                </Button>
                              );
                            })()}
                          </div>
                        </>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium block mb-2">Nova Data de Início</label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !editSprint.data_inicio && "text-muted-foreground")}>
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {editSprint.data_inicio ? format(editSprint.data_inicio, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione a data'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={editSprint.data_inicio}
                                  onSelect={(date) => setEditSprint({ ...editSprint, data_inicio: date })}
                                  initialFocus
                                  className="pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                          </div>

                          <div>
                            <label className="text-sm font-medium block mb-2">Nova Data de Fim</label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !editSprint.data_fim && "text-muted-foreground")}>
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {editSprint.data_fim ? format(editSprint.data_fim, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione a data'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={editSprint.data_fim}
                                  onSelect={(date) => setEditSprint({ ...editSprint, data_fim: date })}
                                  initialFocus
                                  className="pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                          </div>

                          <div className="flex gap-2">
                            <Button onClick={handleUpdateSprintDates} size="sm" className="flex-1">
                              Salvar
                            </Button>
                            <Button 
                              onClick={() => {
                                setIsEditingSprint(false);
                                setEditSprint({ data_inicio: undefined, data_fim: undefined });
                              }} 
                              size="sm"
                              variant="outline" 
                              className="flex-1"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <Button onClick={() => setIsCreatingSprint(true)} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Sprint
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Nome da Sprint</label>
                    <Input
                      placeholder="Ex: Sprint 2"
                      value={newSprint.nome}
                      onChange={(e) => setNewSprint({ ...newSprint, nome: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-2">Data de Início</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newSprint.data_inicio && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newSprint.data_inicio ? format(newSprint.data_inicio, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione a data'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={newSprint.data_inicio}
                          onSelect={(date) => setNewSprint({ ...newSprint, data_inicio: date })}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-2">Data de Fim</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newSprint.data_fim && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newSprint.data_fim ? format(newSprint.data_fim, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione a data'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={newSprint.data_fim}
                          onSelect={(date) => setNewSprint({ ...newSprint, data_fim: date })}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleCreateSprint} className="flex-1">
                      Criar Sprint
                    </Button>
                    <Button onClick={() => setIsCreatingSprint(false)} variant="outline" className="flex-1">
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Responsável Padrão (opcional)</label>
                <Input
                  placeholder="Nome padrão para tarefas"
                  value={defaultResponsavel}
                  onChange={(e) => setDefaultResponsavel(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Será usado se a tarefa não tiver responsável definido
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tarefas na Sprint ({tarefasDaSprint.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedSprint ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Selecione uma sprint para ver as tarefas
                </p>
              ) : tarefasDaSprint.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma tarefa na sprint. Adicione tarefas do backlog.
                </p>
              ) : (
                <div className="space-y-2">
                  {tarefasDaSprint.map(tarefa => (
                    <div key={tarefa.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{tarefa.titulo}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            SP: {tarefa.story_points} | {tarefa.responsavel}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveFromSprint(tarefa.id)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle>RoadMap Produtos GHAS ({availableBacklog.length})</CardTitle>
                <Button onClick={() => setIsCreatingTask(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Tarefa
                </Button>
              </div>
              
              <div className="mt-4 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Filtrar por Responsável</label>
                    <Select value={filtroResponsavel} onValueChange={setFiltroResponsavel}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Todos os responsáveis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os responsáveis</SelectItem>
                        {Array.from(new Set(backlog.map(b => b.responsavel).filter(Boolean))).map((responsavel) => (
                          <SelectItem key={responsavel} value={responsavel!}>
                            {responsavel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Filtrar por Tipo de Produto</label>
                    <Select value={filtroTipoProduto} onValueChange={setFiltroTipoProduto}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Todos os tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="Produto">Produto</SelectItem>
                        <SelectItem value="Projeto GHAS">Projeto GHAS</SelectItem>
                        <SelectItem value="Projeto Inovemed">Projeto Inovemed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="sem-sprint" 
                    checked={mostrarApenasSemSprint}
                    onCheckedChange={(checked) => setMostrarApenasSemSprint(checked === true)}
                  />
                  <label
                    htmlFor="sem-sprint"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Mostrar apenas tarefas fora de sprint
                  </label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isCreatingTask && (
                <div className="mb-6 p-4 border rounded-lg space-y-4 bg-muted/50">
                  <h3 className="font-semibold">Criar Nova Tarefa</h3>
                  
                  <div>
                    <label className="text-sm font-medium">Título *</label>
                    <Input
                      placeholder="Título da tarefa"
                      value={newTask.titulo}
                      onChange={(e) => setNewTask({ ...newTask, titulo: e.target.value })}
                      maxLength={200}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Descrição</label>
                    <Input
                      placeholder="Descrição da tarefa"
                      value={newTask.descricao}
                      onChange={(e) => setNewTask({ ...newTask, descricao: e.target.value })}
                      maxLength={1000}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Story Points *</label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={newTask.story_points}
                        onChange={(e) => setNewTask({ ...newTask, story_points: parseInt(e.target.value) || 1 })}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Prioridade *</label>
                      <Select value={newTask.prioridade} onValueChange={(value: 'baixa' | 'media' | 'alta') => setNewTask({ ...newTask, prioridade: value })}>
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

                  <div>
                    <label className="text-sm font-medium">Responsável *</label>
                    <Select 
                      value={newTask.responsavel || undefined} 
                      onValueChange={(value) => setNewTask({ ...newTask, responsavel: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.nome}>
                            {profile.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Tipo de Produto</label>
                    <Select 
                      value={newTask.tipo_produto || undefined} 
                      onValueChange={(value: 'Produto' | 'Projeto GHAS' | 'Projeto Inovemed') => setNewTask({ ...newTask, tipo_produto: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Produto">Produto</SelectItem>
                        <SelectItem value="Projeto GHAS">Projeto GHAS</SelectItem>
                        <SelectItem value="Projeto Inovemed">Projeto Inovemed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleCreateTask} className="flex-1">
                      Criar no Backlog
                    </Button>
                    <Button
                      onClick={() => {
                        setIsCreatingTask(false);
                        setNewTask({
                          titulo: '',
                          descricao: '',
                          story_points: 1,
                          prioridade: 'media',
                          responsavel: '',
                          tipo_produto: undefined
                        });
                      }} 
                      variant="outline" 
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {availableBacklog.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableBacklog.map(item => {
                    const sprintDaTarefa = getSprintDaTarefa(item.id);
                    const subtarefasDaTarefa = getSubtarefasByBacklogId(item.id);
                    const isExpanded = expandedTasks.has(item.id);
                    
                    return (
                      <div 
                        key={item.id} 
                        className="p-4 border rounded-lg space-y-3"
                      >
                        <Collapsible open={isExpanded} onOpenChange={(open) => {
                          const newExpanded = new Set(expandedTasks);
                          if (open) {
                            newExpanded.add(item.id);
                          } else {
                            newExpanded.delete(item.id);
                          }
                          setExpandedTasks(newExpanded);
                        }}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 cursor-pointer" onClick={() => handleEditTask(item)}>
                              <h4 className="font-semibold text-sm hover:text-primary transition-colors">{item.titulo}</h4>
                              <p className="text-xs text-muted-foreground mt-1">{item.descricao}</p>
                            </div>
                            {subtarefasDaTarefa.length > 0 && (
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </Button>
                              </CollapsibleTrigger>
                            )}
                          </div>
                          
                          <div className="flex gap-2 flex-wrap mt-2">
                            <Badge variant="outline" className="text-xs">SP: {item.story_points}</Badge>
                            {(item as any).tipo_produto && (
                              <Badge variant="default" className="text-xs">
                                {(item as any).tipo_produto}
                              </Badge>
                            )}
                            {sprintDaTarefa ? (
                              <Badge variant="secondary" className="text-xs">
                                Sprint: {sprintDaTarefa.nome}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">Fora do Sprint</Badge>
                            )}
                            {subtarefasDaTarefa.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                <ListTodo className="h-3 w-3 mr-1" />
                                {subtarefasDaTarefa.length} subtarefa(s)
                              </Badge>
                            )}
                          </div>

                          <p className="text-xs text-muted-foreground mt-2">
                            Responsável: {item.responsavel}
                          </p>

                          {/* Subtarefas expandidas */}
                          <CollapsibleContent className="mt-3">
                            <div className="border-t pt-3 space-y-2">
                              <p className="text-xs font-medium text-muted-foreground">Subtarefas:</p>
                              {subtarefasDaTarefa.map(sub => (
                                <div key={sub.id} className="flex items-center gap-2 text-xs p-2 bg-muted/50 rounded">
                                  <Badge 
                                    variant={sub.status === 'done' ? 'default' : sub.status === 'doing' ? 'secondary' : 'outline'} 
                                    className="text-[10px] px-1.5"
                                  >
                                    {sub.status === 'done' ? 'Concluída' : sub.status === 'doing' ? 'Em progresso' : 'Pendente'}
                                  </Badge>
                                  <span className="flex-1 truncate">{sub.titulo}</span>
                                  {sub.responsavel && (
                                    <span className="text-muted-foreground">{sub.responsavel}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>

                        <div className="flex gap-2 flex-wrap pt-2 border-t">
                          <Button 
                            onClick={() => handleAddToSprint(item.id)} 
                            size="sm" 
                            className="flex-1"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Sprint
                          </Button>
                          <Button
                            onClick={() => {
                              setSubtarefasTask(item);
                              setIsSubtarefasDialogOpen(true);
                            }}
                            size="sm"
                            variant="outline"
                            title="Gerenciar Subtarefas"
                          >
                            <ListTodo className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => {
                              setDuplicateTask(item);
                              setIsDuplicateDialogOpen(true);
                            }}
                            size="sm"
                            variant="outline"
                            title="Duplicar Tarefa"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => {
                              if (confirm('Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.')) {
                                deleteBacklogItem(item.id);
                              }
                            }}
                            size="sm"
                            variant="destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : !isCreatingTask && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {mostrarApenasSemSprint 
                    ? 'Nenhuma tarefa fora de sprint encontrada.' 
                    : 'Nenhuma tarefa disponível no backlog. Crie uma nova tarefa acima.'}
                </p>
              )}
            </CardContent>
          </Card>
      </div>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Tarefa</DialogTitle>
          </DialogHeader>
          
          {editingTask && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título *</label>
                <Input
                  placeholder="Título da tarefa"
                  value={editingTask.titulo}
                  onChange={(e) => setEditingTask({ ...editingTask, titulo: e.target.value })}
                  maxLength={200}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Input
                  placeholder="Descrição da tarefa"
                  value={editingTask.descricao || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, descricao: e.target.value })}
                  maxLength={1000}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Story Points *</label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={editingTask.story_points}
                    onChange={(e) => setEditingTask({ ...editingTask, story_points: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Prioridade *</label>
                  <Select 
                    value={editingTask.prioridade} 
                    onValueChange={(value: 'baixa' | 'media' | 'alta') => setEditingTask({ ...editingTask, prioridade: value })}
                  >
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

              <div>
                <label className="text-sm font-medium">Responsável *</label>
                <Select 
                  value={editingTask.responsavel || undefined} 
                  onValueChange={(value) => setEditingTask({ ...editingTask, responsavel: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.nome}>
                        {profile.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Tipo de Produto</label>
                <Select 
                  value={editingTask.tipo_produto || undefined} 
                  onValueChange={(value: 'Produto' | 'Projeto GHAS' | 'Projeto Inovemed') => setEditingTask({ ...editingTask, tipo_produto: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Produto">Produto</SelectItem>
                    <SelectItem value="Projeto GHAS">Projeto GHAS</SelectItem>
                    <SelectItem value="Projeto Inovemed">Projeto Inovemed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleUpdateTask} className="flex-1">
                  Salvar Alterações
                </Button>
                <Button
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingTask(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Duplicar Tarefa */}
      {duplicateTask && (
        <DuplicateTaskDialog
          open={isDuplicateDialogOpen}
          onOpenChange={(open) => {
            setIsDuplicateDialogOpen(open);
            if (!open) setDuplicateTask(null);
          }}
          task={duplicateTask}
          onSuccess={() => {
            setIsDuplicateDialogOpen(false);
            setDuplicateTask(null);
          }}
        />
      )}

      {/* Dialog de Subtarefas */}
      {subtarefasTask && (
        <BacklogSubtarefasDialog
          open={isSubtarefasDialogOpen}
          onOpenChange={(open) => {
            setIsSubtarefasDialogOpen(open);
            if (!open) setSubtarefasTask(null);
          }}
          backlogId={subtarefasTask.id}
          backlogTitulo={subtarefasTask.titulo}
        />
      )}
    </Layout>
  );
};

export default SprintPlanning;
