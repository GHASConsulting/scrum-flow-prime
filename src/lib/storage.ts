import { BacklogItem, Sprint, SprintTarefa, Subtarefa } from '@/types/scrum';

const STORAGE_KEYS = {
  BACKLOG: 'scrum_backlog',
  SPRINTS: 'scrum_sprints',
  SPRINT_TAREFAS: 'scrum_sprint_tarefas',
  SUBTAREFAS: 'scrum_subtarefas',
  INITIALIZED: 'scrum_initialized'
};

// Backlog
export const getBacklog = (): BacklogItem[] => {
  const data = localStorage.getItem(STORAGE_KEYS.BACKLOG);
  return data ? JSON.parse(data) : [];
};

export const saveBacklog = (items: BacklogItem[]) => {
  localStorage.setItem(STORAGE_KEYS.BACKLOG, JSON.stringify(items));
};

export const addBacklogItem = (item: BacklogItem) => {
  const items = getBacklog();
  items.push(item);
  saveBacklog(items);
};

export const updateBacklogItem = (id: string, updates: Partial<BacklogItem>) => {
  const items = getBacklog();
  const index = items.findIndex(i => i.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    saveBacklog(items);
  }
};

export const deleteBacklogItem = (id: string) => {
  const items = getBacklog().filter(i => i.id !== id);
  saveBacklog(items);
};

// Sprints
export const getSprints = (): Sprint[] => {
  const data = localStorage.getItem(STORAGE_KEYS.SPRINTS);
  return data ? JSON.parse(data) : [];
};

export const saveSprints = (sprints: Sprint[]) => {
  localStorage.setItem(STORAGE_KEYS.SPRINTS, JSON.stringify(sprints));
};

export const addSprint = (sprint: Sprint) => {
  const sprints = getSprints();
  sprints.push(sprint);
  saveSprints(sprints);
};

export const updateSprint = (id: string, updates: Partial<Sprint>) => {
  const sprints = getSprints();
  const index = sprints.findIndex(s => s.id === id);
  if (index !== -1) {
    sprints[index] = { ...sprints[index], ...updates };
    saveSprints(sprints);
  }
};

// Sprint Tarefas
export const getSprintTarefas = (): SprintTarefa[] => {
  const data = localStorage.getItem(STORAGE_KEYS.SPRINT_TAREFAS);
  return data ? JSON.parse(data) : [];
};

export const saveSprintTarefas = (tarefas: SprintTarefa[]) => {
  localStorage.setItem(STORAGE_KEYS.SPRINT_TAREFAS, JSON.stringify(tarefas));
};

export const addSprintTarefa = (tarefa: SprintTarefa) => {
  const tarefas = getSprintTarefas();
  tarefas.push(tarefa);
  saveSprintTarefas(tarefas);
};

export const updateSprintTarefa = (id: string, updates: Partial<SprintTarefa>) => {
  const tarefas = getSprintTarefas();
  const index = tarefas.findIndex(t => t.id === id);
  if (index !== -1) {
    tarefas[index] = { ...tarefas[index], ...updates };
    saveSprintTarefas(tarefas);
  }
};

// Subtarefas
export const getSubtarefas = (): Subtarefa[] => {
  const data = localStorage.getItem(STORAGE_KEYS.SUBTAREFAS);
  return data ? JSON.parse(data) : [];
};

export const saveSubtarefas = (subtarefas: Subtarefa[]) => {
  localStorage.setItem(STORAGE_KEYS.SUBTAREFAS, JSON.stringify(subtarefas));
};

export const addSubtarefa = (subtarefa: Subtarefa) => {
  const subtarefas = getSubtarefas();
  subtarefas.push(subtarefa);
  saveSubtarefas(subtarefas);
};

export const updateSubtarefa = (id: string, updates: Partial<Subtarefa>) => {
  const subtarefas = getSubtarefas();
  const index = subtarefas.findIndex(s => s.id === id);
  if (index !== -1) {
    subtarefas[index] = { ...subtarefas[index], ...updates };
    saveSubtarefas(subtarefas);
  }
};

export const deleteSubtarefa = (id: string) => {
  const subtarefas = getSubtarefas().filter(s => s.id !== id);
  saveSubtarefas(subtarefas);
};

export const getSubtarefasBySprintTarefa = (sprintTarefaId: string): Subtarefa[] => {
  return getSubtarefas().filter(s => s.sprint_tarefa_id === sprintTarefaId);
};

// Inicialização com dados de exemplo
export const initializeData = () => {
  if (localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
    return;
  }

  // Backlog inicial
  const backlogItems: BacklogItem[] = [
    {
      id: '1',
      titulo: 'API - Dados Assistenciais',
      descricao: 'Desenvolver API para gerenciar dados assistenciais',
      story_points: 8,
      prioridade: 'alta',
      status: 'doing',
      responsavel: 'Gabriel'
    },
    {
      id: '2',
      titulo: 'Automatização de Contas - H.Olhos',
      descricao: 'Automatizar processamento de contas do Hospital de Olhos',
      story_points: 13,
      prioridade: 'alta',
      status: 'doing',
      responsavel: 'Fernando'
    },
    {
      id: '3',
      titulo: 'AVA - AD',
      descricao: 'Implementar sistema AVA com Active Directory',
      story_points: 13,
      prioridade: 'media',
      status: 'todo',
      responsavel: 'Iury'
    }
  ];

  // Sprint inicial
  const sprints: Sprint[] = [
    {
      id: 'sprint-1',
      nome: 'Sprint 1',
      data_inicio: '2025-10-01',
      data_fim: '2025-10-15',
      status: 'ativo'
    }
  ];

  // Tarefa do sprint
  const sprintTarefas: SprintTarefa[] = [
    {
      id: 'st-1',
      sprint_id: 'sprint-1',
      backlog_id: '1',
      responsavel: 'Gabriel',
      status: 'doing'
    }
  ];

  // Subtarefa inicial
  const subtarefas: Subtarefa[] = [
    {
      id: 'sub-1',
      sprint_tarefa_id: 'st-1',
      titulo: 'Criar Endpoints para DRG',
      responsavel: 'Gabriel',
      inicio: '2025-10-08T09:00:00',
      fim: '2025-10-10T18:00:00',
      status: 'todo'
    }
  ];

  saveBacklog(backlogItems);
  saveSprints(sprints);
  saveSprintTarefas(sprintTarefas);
  saveSubtarefas(subtarefas);
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
};
