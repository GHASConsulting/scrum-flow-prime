export type Status = 'todo' | 'doing' | 'done' | 'validated';

export interface BacklogItem {
  id: string;
  titulo: string;
  descricao: string;
  story_points: number;
  prioridade: 'baixa' | 'media' | 'alta';
  status: Status;
  responsavel: string;
}

export interface Sprint {
  id: string;
  nome: string;
  data_inicio: string;
  data_fim: string;
  status: 'planejamento' | 'ativo' | 'concluido';
}

export interface SprintTarefa {
  id: string;
  sprint_id: string;
  backlog_id: string;
  responsavel: string;
  status: Status;
}

export interface Subtarefa {
  id: string;
  sprint_tarefa_id: string;
  titulo: string;
  responsavel: string;
  inicio: string;
  fim: string;
  status?: Status;
}

export interface Daily {
  id: string;
  sprint_id: string;
  usuario: string;
  data: string;
  ontem: string;
  hoje: string;
  impedimentos: string;
}

export interface Review {
  id: string;
  sprint_id: string;
  entregas: string;
  observacoes: string;
  data: string;
}

export interface Retrospectiva {
  id: string;
  sprint_id: string;
  bom: string[];
  melhorar: string[];
  acoes: string[];
  data: string;
}
