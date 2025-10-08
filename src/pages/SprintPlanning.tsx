import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSprints, saveSprints, getBacklog, getSprintTarefas, addSprintTarefa, initializeData } from '@/lib/storage';
import { Sprint, BacklogItem, SprintTarefa } from '@/types/scrum';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { statusLabels } from '@/lib/formatters';

const SprintPlanning = () => {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<string>('');
  const [isCreatingSprint, setIsCreatingSprint] = useState(false);
  const [backlog, setBacklog] = useState<BacklogItem[]>([]);
  const [sprintTarefas, setSprintTarefas] = useState<SprintTarefa[]>([]);
  const [defaultResponsavel, setDefaultResponsavel] = useState('');
  const [isEditingSprint, setIsEditingSprint] = useState(false);
  
  const [newSprint, setNewSprint] = useState({
    nome: '',
    data_inicio: undefined as Date | undefined,
    data_fim: undefined as Date | undefined
  });

  const [editSprint, setEditSprint] = useState({
    data_inicio: undefined as Date | undefined,
    data_fim: undefined as Date | undefined
  });

  useEffect(() => {
    initializeData();
    loadData();
  }, []);

  const loadData = () => {
    const loadedSprints = getSprints();
    setSprints(loadedSprints);
    
    const activeSprint = loadedSprints.find(s => s.status === 'ativo');
    if (activeSprint) {
      setSelectedSprint(activeSprint.id);
    }
    
    setBacklog(getBacklog());
    setSprintTarefas(getSprintTarefas());
  };

  const handleCreateSprint = () => {
    if (!newSprint.nome || !newSprint.data_inicio || !newSprint.data_fim) {
      toast.error('Preencha todos os campos da sprint');
      return;
    }

    if (newSprint.data_fim < newSprint.data_inicio) {
      toast.error('Data de fim deve ser posterior à data de início');
      return;
    }

    const sprint: Sprint = {
      id: `sprint-${Date.now()}`,
      nome: newSprint.nome,
      data_inicio: format(newSprint.data_inicio, 'yyyy-MM-dd'),
      data_fim: format(newSprint.data_fim, 'yyyy-MM-dd'),
      status: 'planejamento'
    };

    const allSprints = [...sprints, sprint];
    saveSprints(allSprints);
    setSprints(allSprints);
    setSelectedSprint(sprint.id);
    setIsCreatingSprint(false);
    setNewSprint({ nome: '', data_inicio: undefined, data_fim: undefined });
    toast.success('Sprint criada com sucesso');
  };

  const handleActivateSprint = (sprintId: string) => {
    const updated = sprints.map(s => ({
      ...s,
      status: s.id === sprintId ? 'ativo' as const : s.status === 'ativo' ? 'planejamento' as const : s.status
    }));
    saveSprints(updated);
    setSprints(updated);
    toast.success('Sprint ativada');
  };

  const handleFinishSprint = (sprintId: string) => {
    const updated = sprints.map(s => ({
      ...s,
      status: s.id === sprintId ? 'concluido' as const : s.status
    }));
    saveSprints(updated);
    setSprints(updated);
    toast.success('Sprint encerrada com sucesso');
  };

  const handleUpdateSprintDates = () => {
    if (!selectedSprintData || !editSprint.data_inicio || !editSprint.data_fim) {
      toast.error('Preencha ambas as datas');
      return;
    }

    if (editSprint.data_fim < editSprint.data_inicio) {
      toast.error('Data de fim deve ser posterior à data de início');
      return;
    }

    const updated = sprints.map(s => 
      s.id === selectedSprintData.id 
        ? {
            ...s,
            data_inicio: format(editSprint.data_inicio, 'yyyy-MM-dd'),
            data_fim: format(editSprint.data_fim, 'yyyy-MM-dd')
          }
        : s
    );
    
    saveSprints(updated);
    setSprints(updated);
    setIsEditingSprint(false);
    setEditSprint({ data_inicio: undefined, data_fim: undefined });
    toast.success('Datas da sprint atualizadas com sucesso');
  };

  const handleAddToSprint = (backlogId: string) => {
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
    const responsavel = defaultResponsavel || backlogItem?.responsavel || '';

    const sprintTarefa: SprintTarefa = {
      id: `st-${Date.now()}`,
      sprint_id: selectedSprint,
      backlog_id: backlogId,
      responsavel,
      status: 'todo'
    };

    addSprintTarefa(sprintTarefa);
    setSprintTarefas([...sprintTarefas, sprintTarefa]);
    toast.success('Tarefa adicionada à sprint');
  };

  const getAvailableBacklog = () => {
    if (!selectedSprint) return [];
    
    const tarefasNaSprint = sprintTarefas
      .filter(st => st.sprint_id === selectedSprint)
      .map(st => st.backlog_id);
    
    return backlog.filter(b => !tarefasNaSprint.includes(b.id));
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
                            {format(new Date(selectedSprintData.data_inicio), 'dd/MM/yyyy', { locale: ptBR })} - {format(new Date(selectedSprintData.data_fim), 'dd/MM/yyyy', { locale: ptBR })}
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
                                    data_inicio: new Date(selectedSprintData.data_inicio),
                                    data_fim: new Date(selectedSprintData.data_fim)
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

        {selectedSprint && availableBacklog.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Backlog Disponível ({availableBacklog.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableBacklog.map(item => (
                  <div key={item.id} className="p-4 border rounded-lg space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm">{item.titulo}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{item.descricao}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">SP: {item.story_points}</Badge>
                      <Badge variant="outline" className="text-xs">{statusLabels[item.status]}</Badge>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Responsável: {item.responsavel}
                    </p>

                    <Button 
                      onClick={() => handleAddToSprint(item.id)} 
                      size="sm" 
                      className="w-full"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar à Sprint
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default SprintPlanning;
