import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RoadmapTarefa {
  id: string; // backlog_id
  backlog_id: string;
  status_backlog: string; // status no backlog
  responsavel: string | null;
  created_at: string;
  updated_at: string;
  // Dados do backlog
  titulo: string;
  descricao: string | null;
  story_points: number;
  prioridade: string;
  tipo_produto: string | null;
  // Dados da sprint (se houver)
  sprint_id: string | null;
  sprint_nome: string | null;
  sprint_data_inicio: string | null;
  sprint_data_fim: string | null;
  sprint_status: string | null;
  // Dados das subtarefas
  subtarefas: {
    id: string;
    titulo: string;
    inicio: string;
    fim: string;
    status: string | null;
    responsavel: string | null;
  }[];
}

export type RoadmapStatusType = 
  | 'EM_SPRINT' 
  | 'NAO_PLANEJADA' 
  | 'EM_PLANEJAMENTO' 
  | 'ENTREGUE' 
  | 'EM_ATRASO';

export const useRoadmapTarefas = () => {
  const [tarefas, setTarefas] = useState<RoadmapTarefa[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTarefas = async () => {
    try {
      setLoading(true);
      
      // Buscar TODOS os itens do backlog
      const { data: backlogItems, error: backlogError } = await supabase
        .from('backlog')
        .select('*')
        .order('created_at', { ascending: false });

      if (backlogError) throw backlogError;

      // Buscar todas as sprint_tarefas com dados da sprint
      const { data: sprintTarefas, error: tarefasError } = await supabase
        .from('sprint_tarefas')
        .select(`
          *,
          sprint:sprint_id (
            id,
            nome,
            data_inicio,
            data_fim,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (tarefasError) throw tarefasError;

      // Buscar todas as subtarefas
      const { data: subtarefas, error: subtarefasError } = await supabase
        .from('subtarefas')
        .select('*')
        .order('inicio', { ascending: true });

      if (subtarefasError) throw subtarefasError;

      // Agrupar sprint_tarefas por backlog_id
      const sprintTarefasPorBacklog = new Map<string, any[]>();
      (sprintTarefas || []).forEach((tarefa: any) => {
        const backlogId = tarefa.backlog_id;
        if (!sprintTarefasPorBacklog.has(backlogId)) {
          sprintTarefasPorBacklog.set(backlogId, []);
        }
        sprintTarefasPorBacklog.get(backlogId)!.push(tarefa);
      });

      // Criar tarefas baseadas no backlog
      const tarefasCompletas: RoadmapTarefa[] = (backlogItems || []).map((backlog: any) => {
        const sprintTarefasDoBacklog = sprintTarefasPorBacklog.get(backlog.id) || [];
        
        // Encontrar a sprint ativa ou a mais recente
        let sprintAtiva = sprintTarefasDoBacklog.find((st: any) => st.sprint?.status === 'ativo');
        if (!sprintAtiva && sprintTarefasDoBacklog.length > 0) {
          // Ordenar por data de fim da sprint (mais recente primeiro)
          sprintTarefasDoBacklog.sort((a: any, b: any) => {
            const dateA = new Date(a.sprint?.data_fim || '').getTime();
            const dateB = new Date(b.sprint?.data_fim || '').getTime();
            return dateB - dateA;
          });
          sprintAtiva = sprintTarefasDoBacklog[0];
        }

        // Coletar subtarefas do backlog
        const subtarefasDoBacklog = (subtarefas || [])
          .filter((sub: any) => sub.backlog_id === backlog.id)
          .map((sub: any) => ({
            id: sub.id,
            titulo: sub.titulo,
            inicio: sub.inicio,
            fim: sub.fim,
            status: sub.status,
            responsavel: sub.responsavel,
          }));

        return {
          id: backlog.id,
          backlog_id: backlog.id,
          status_backlog: backlog.status,
          responsavel: backlog.responsavel || sprintAtiva?.responsavel || null,
          created_at: backlog.created_at,
          updated_at: backlog.updated_at,
          titulo: backlog.titulo,
          descricao: backlog.descricao,
          story_points: backlog.story_points,
          prioridade: backlog.prioridade,
          tipo_produto: backlog.tipo_produto,
          sprint_id: sprintAtiva?.sprint_id || null,
          sprint_nome: sprintAtiva?.sprint?.nome || null,
          sprint_data_inicio: sprintAtiva?.sprint?.data_inicio || null,
          sprint_data_fim: sprintAtiva?.sprint?.data_fim || null,
          sprint_status: sprintAtiva?.sprint?.status || null,
          subtarefas: subtarefasDoBacklog,
        };
      });

      setTarefas(tarefasCompletas);
    } catch (error) {
      console.error('Erro ao carregar tarefas do roadmap:', error);
      toast.error('Erro ao carregar tarefas do roadmap');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTarefas();

    // Escutar mudanças em todas as tabelas relacionadas
    const channel = supabase
      .channel('roadmap-tarefas-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sprint_tarefas' }, loadTarefas)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'backlog' }, loadTarefas)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subtarefas' }, loadTarefas)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sprint' }, loadTarefas)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { tarefas, loading, loadTarefas };
};
