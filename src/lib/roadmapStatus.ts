import type { RoadmapTarefa } from '@/hooks/useRoadmapTarefas';

export type RoadmapStatus = 
  | 'EM_SPRINT' 
  | 'NAO_PLANEJADA' 
  | 'EM_PLANEJAMENTO' 
  | 'ENTREGUE' 
  | 'EM_ATRASO';

export const getStatusColor = (status: RoadmapStatus): string => {
  switch (status) {
    case 'ENTREGUE':
      return 'bg-[#B5E3B5]'; // Verde claro
    case 'EM_ATRASO':
      return 'bg-[#F49B9B]'; // Vermelho claro
    case 'EM_PLANEJAMENTO':
      return 'bg-[#E5C3A3]'; // Marrom claro
    case 'NAO_PLANEJADA':
      return 'bg-[#E5E5E5]'; // Cinza claro
    case 'EM_SPRINT':
      return 'bg-[#FFF4A3]'; // Amarelo claro
    default:
      return 'bg-gray-100';
  }
};

export const getStatusLabel = (status: RoadmapStatus): string => {
  switch (status) {
    case 'EM_SPRINT':
      return 'EM SPRINT';
    case 'NAO_PLANEJADA':
      return 'NÃO PLANEJADA';
    case 'EM_PLANEJAMENTO':
      return 'EM PLANEJAMENTO';
    case 'ENTREGUE':
      return 'ENTREGUE';
    case 'EM_ATRASO':
      return 'EM ATRASO';
    default:
      return status;
  }
};

/**
 * Calcula o status da tarefa baseado nas regras:
 * - EM SPRINT: Tarefa está em uma SPRINT ATIVA
 * - NÃO PLANEJADA: Tarefa que está fora de Sprint
 * - EM PLANEJAMENTO: Tarefa está dentro de uma sprint, mas não está com status ATIVA
 * - ENTREGUE: Tarefa está em uma SPRINT ATIVA e o status no backlog é FEITO ou VALIDADO
 * - EM ATRASO: Tarefa não está com status FEITO/VALIDADO e a data da sprint ou maior data fim de subtarefa passou
 */
export const calculateTaskStatus = (item: RoadmapTarefa): RoadmapStatus => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const statusBacklogFinalizado = item.status_backlog === 'done' || item.status_backlog === 'validated';
  
  // Se não está em nenhuma sprint
  if (!item.sprint_id) {
    // Verificar se está em atraso (tem subtarefas com data fim passada)
    if (item.subtarefas.length > 0) {
      const maiorDataFim = new Date(Math.max(...item.subtarefas.map(s => new Date(s.fim).getTime())));
      if (maiorDataFim < hoje && !statusBacklogFinalizado) {
        return 'EM_ATRASO';
      }
    }
    return 'NAO_PLANEJADA';
  }

  // Se está em uma sprint ativa
  if (item.sprint_status === 'ativo') {
    // Se o status do backlog é FEITO ou VALIDADO
    if (statusBacklogFinalizado) {
      return 'ENTREGUE';
    }
    
    // Verificar atraso
    const sprintDataFim = item.sprint_data_fim ? new Date(item.sprint_data_fim) : null;
    const maiorDataFimSubtarefa = item.subtarefas.length > 0
      ? new Date(Math.max(...item.subtarefas.map(s => new Date(s.fim).getTime())))
      : null;
    
    // Em atraso se: data da sprint passou OU maior data fim de subtarefa passou
    if (sprintDataFim && sprintDataFim < hoje) {
      return 'EM_ATRASO';
    }
    if (maiorDataFimSubtarefa && maiorDataFimSubtarefa < hoje) {
      return 'EM_ATRASO';
    }
    
    return 'EM_SPRINT';
  }

  // Se está em uma sprint mas não é ativa (planejamento ou concluída)
  // Verificar atraso para sprints concluídas
  if (item.sprint_status === 'concluido' && !statusBacklogFinalizado) {
    const sprintDataFim = item.sprint_data_fim ? new Date(item.sprint_data_fim) : null;
    const maiorDataFimSubtarefa = item.subtarefas.length > 0
      ? new Date(Math.max(...item.subtarefas.map(s => new Date(s.fim).getTime())))
      : null;
    
    if (sprintDataFim && sprintDataFim < hoje) {
      return 'EM_ATRASO';
    }
    if (maiorDataFimSubtarefa && maiorDataFimSubtarefa < hoje) {
      return 'EM_ATRASO';
    }
  }
  
  // Se está entregue mesmo em sprint não ativa
  if (statusBacklogFinalizado) {
    return 'ENTREGUE';
  }

  return 'EM_PLANEJAMENTO';
};

/**
 * Calcula a data de início:
 * - Se não tem subtarefas: usa data de início da sprint
 * - Se tem subtarefas: usa a menor data de início das subtarefas
 */
export const getDataInicio = (item: RoadmapTarefa): string | null => {
  if (item.subtarefas.length > 0) {
    const menorDataInicio = new Date(Math.min(...item.subtarefas.map(s => new Date(s.inicio).getTime())));
    return menorDataInicio.toISOString();
  }
  return item.sprint_data_inicio;
};

/**
 * Calcula a data de fim:
 * - Se não tem subtarefas: usa data de fim da sprint
 * - Se tem subtarefas: usa a maior data de fim das subtarefas
 */
export const getDataFim = (item: RoadmapTarefa): string | null => {
  if (item.subtarefas.length > 0) {
    const maiorDataFim = new Date(Math.max(...item.subtarefas.map(s => new Date(s.fim).getTime())));
    return maiorDataFim.toISOString();
  }
  return item.sprint_data_fim;
};

export const calculateKPIs = (items: RoadmapTarefa[]) => {
  const total = items.length;
  const concluidos = items.filter(item => calculateTaskStatus(item) === 'ENTREGUE').length;
  const percentualConcluido = total > 0 ? Math.round((concluidos / total) * 100) : 0;

  return {
    total,
    concluidos,
    percentualConcluido,
    tempoMedioReal: 0,
    atrasoMedio: 0,
  };
};
