import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBacklog } from '@/hooks/useBacklog';
import { useSprints } from '@/hooks/useSprints';
import { useSprintTarefas } from '@/hooks/useSprintTarefas';
import { useProfiles } from '@/hooks/useProfiles';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';
import { CalendarIcon, Plus, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { statusLabels, formatDate } from '@/lib/formatters';

const SprintPlanning = () => {
  const { backlog, addBacklogItem, deleteBacklogItem } = useBacklog();
  const { sprints, addSprint, updateSprint } = useSprints();
  const { sprintTarefas, addSprintTarefa: addTarefaToSprint } = useSprintTarefas();
  const { profiles } = useProfiles();
  
  const [selectedSprint, setSelectedSprint] = useState<string>('');
  const [isCreatingSprint, setIsCreatingSprint] = useState(false);
  const [defaultResponsavel, setDefaultResponsavel] = useState('');
  const [isEditingSprint, setIsEditingSprint] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  
  const [newTask, setNewTask] = useState<{
    titulo: string;
    descricao: string;
    story_points: number;
    prioridade: 'baixa' | 'media' | 'alta';
    responsavel: string;
  }>({
    titulo: '',
    descricao: '',
    story_points: 1,
    prioridade: 'media',
    responsavel: ''
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
    if (!selectedSprintData || !editSprint.data_inicio || !editSprint.data_fim) {
      toast.error('Preencha ambas as datas');
      return;
    }

    if (editSprint.data_fim < editSprint.data_inicio) {
      toast.error('Data de fim deve ser posterior à data de início');
      return;
    }

    try {
      await updateSprint(selectedSprintData.id, {
        data_inicio: format(editSprint.data_inicio, 'yyyy-MM-dd'),
        data_fim: format(editSprint.data_fim, 'yyyy-MM-dd')
      });

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
        status: 'todo'
      });

      setNewTask({
        titulo: '',
        descricao: '',
        story_points: 1,
        prioridade: 'media',
        responsavel: ''
      });
      setIsCreatingTask(false);
      toast.success('Tarefa criada no backlog');
    } catch (error) {
      // Error já tratado no hook
    }
  };

  const handleAddToSprint = async (backlogId: string) => {
    if (!selectedSprint) {
      toast.error('Selecione uma sprint primeiro');
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

  const getAvailableBacklog = () => {
    if (!selectedSprint) return [];
    
    const tarefasNaSprint = sprintTarefas
      .filter(st => st.sprint_id === selectedSprint)
      .map(st => st.backlog_id);
    
    return backlog.filter(b => !tarefasNaSprint.includes(b.id) && b.status !== 'validated');
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
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{tarefa.titulo}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            SP: {tarefa.story_points} | {tarefa.responsavel}
                          </p>
                        </div>
                        <Check className="h-4 w-4 text-success" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {selectedSprint && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Backlog Disponível ({availableBacklog.length})</CardTitle>
              <Button onClick={() => setIsCreatingTask(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
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
                          responsavel: ''
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
                  {availableBacklog.map(item => (
                    <div key={item.id} className="p-4 border rounded-lg space-y-3">
                      <div>
                        <h4 className="font-semibold text-sm">{item.titulo}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{item.descricao}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">SP: {item.story_points}</Badge>
                        <Badge variant="outline" className="text-xs">Em Planejamento/Fora Do Sprint</Badge>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Responsável: {item.responsavel}
                      </p>

                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleAddToSprint(item.id)} 
                          size="sm" 
                          className="flex-1"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Adicionar à Sprint
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
                  ))}
                </div>
              ) : !isCreatingTask && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma tarefa disponível no backlog. Crie uma nova tarefa acima.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default SprintPlanning;
