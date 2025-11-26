import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Subtarefa = Tables<'subtarefas'>;

export type RoadmapStatus = 'NAO_INICIADO' | 'EM_DESENVOLVIMENTO' | 'TESTES' | 'DESENVOLVIDO' | 'CANCELADO';

export const getStatusColor = (status: RoadmapStatus): string => {
  switch (status) {
    case 'DESENVOLVIDO':
      return 'bg-[#B5E3B5]';
    case 'CANCELADO':
      return 'bg-[#F49B9B]';
    case 'EM_DESENVOLVIMENTO':
      return 'bg-[#FFF4A3]';
    case 'TESTES':
      return 'bg-[#A5C8FF]';
    case 'NAO_INICIADO':
      return 'bg-[#E5C3A3]';
    default:
      return 'bg-gray-100';
  }
};

export const getStatusLabel = (status: RoadmapStatus): string => {
  switch (status) {
    case 'NAO_INICIADO':
      return 'NÃO INICIADO';
    case 'EM_DESENVOLVIMENTO':
      return 'EM DESENVOLVIMENTO';
    case 'TESTES':
      return 'TESTES';
    case 'DESENVOLVIDO':
      return 'DESENVOLVIDO';
    case 'CANCELADO':
      return 'CANCELADO';
    default:
      return status;
  }
};

export const calculateRoadmapStatus = async (
  sprintTarefaIds: string[] = []
): Promise<{
  status: RoadmapStatus;
  dataInicioReal: Date | null;
  dataFimReal: Date | null;
  percentualConcluido: number;
}> => {
  if (!sprintTarefaIds || sprintTarefaIds.length === 0) {
    return {
      status: 'NAO_INICIADO',
      dataInicioReal: null,
      dataFimReal: null,
      percentualConcluido: 0,
    };
  }

  try {
    const { data: subtarefas, error } = await supabase
      .from('subtarefas')
      .select('*')
      .in('sprint_tarefa_id', sprintTarefaIds);

    if (error) throw error;

    if (!subtarefas || subtarefas.length === 0) {
      return {
        status: 'NAO_INICIADO',
        dataInicioReal: null,
        dataFimReal: null,
        percentualConcluido: 0,
      };
    }

    const doingCount = subtarefas.filter(s => s.status === 'doing').length;
    const doneCount = subtarefas.filter(s => s.status === 'done').length;
    const validatedCount = subtarefas.filter(s => s.status === 'validated').length;
    const totalCount = subtarefas.length;

    let status: RoadmapStatus = 'NAO_INICIADO';
    
    if (validatedCount === totalCount) {
      status = 'DESENVOLVIDO';
    } else if (doneCount + validatedCount === totalCount && validatedCount < totalCount) {
      status = 'TESTES';
    } else if (doingCount > 0 || doneCount > 0 || validatedCount > 0) {
      status = 'EM_DESENVOLVIMENTO';
    }

    const percentualConcluido = Math.round((validatedCount / totalCount) * 100);

    const sortedByInicio = [...subtarefas].sort((a, b) => 
      new Date(a.inicio).getTime() - new Date(b.inicio).getTime()
    );
    const dataInicioReal = sortedByInicio.length > 0 
      ? new Date(sortedByInicio[0].inicio) 
      : null;

    const subtarefasValidadas = subtarefas.filter(s => s.status === 'validated');
    const sortedByFim = [...subtarefasValidadas].sort((a, b) => 
      new Date(b.fim).getTime() - new Date(a.fim).getTime()
    );
    const dataFimReal = sortedByFim.length > 0 
      ? new Date(sortedByFim[0].fim) 
      : null;

    return {
      status,
      dataInicioReal,
      dataFimReal,
      percentualConcluido,
    };
  } catch (error) {
    console.error('Erro ao calcular status do roadmap:', error);
    return {
      status: 'NAO_INICIADO',
      dataInicioReal: null,
      dataFimReal: null,
      percentualConcluido: 0,
    };
  }
};

export const calculateKPIs = (items: any[]) => {
  const total = items.length;
  const concluidos = items.filter(item => item.status === 'DESENVOLVIDO').length;
  const percentualConcluido = total > 0 ? Math.round((concluidos / total) * 100) : 0;

  const itensComDatas = items.filter(
    item => item.data_inicio_real && item.data_fim_real
  );
  
  const tempoMedioReal = itensComDatas.length > 0
    ? Math.round(
        itensComDatas.reduce((acc, item) => {
          const inicio = new Date(item.data_inicio_real).getTime();
          const fim = new Date(item.data_fim_real).getTime();
          return acc + (fim - inicio) / (1000 * 60 * 60 * 24);
        }, 0) / itensComDatas.length
      )
    : 0;

  const itensComAtraso = items.filter(
    item => 
      item.data_fim_prevista && 
      item.data_fim_real && 
      new Date(item.data_fim_real) > new Date(item.data_fim_prevista)
  );
  
  const atrasoMedio = itensComAtraso.length > 0
    ? Math.round(
        itensComAtraso.reduce((acc, item) => {
          const prevista = new Date(item.data_fim_prevista).getTime();
          const real = new Date(item.data_fim_real).getTime();
          return acc + (real - prevista) / (1000 * 60 * 60 * 24);
        }, 0) / itensComAtraso.length
      )
    : 0;

  return {
    total,
    concluidos,
    percentualConcluido,
    tempoMedioReal,
    atrasoMedio,
  };
};
