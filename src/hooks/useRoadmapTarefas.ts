import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RoadmapTarefa {
  id: string;
  sprint_id: string;
  backlog_id: string;
  status: string;
  responsavel: string | null;
  created_at: string;
  updated_at: string;
  // Dados do backlog
  titulo: string;
  descricao: string | null;
  story_points: number;
  prioridade: string;
  tipo_produto: string | null;
  // Dados da sprint
  sprint_nome: string;
  sprint_data_inicio: string;
  sprint_data_fim: string;
  sprint_status: string;
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

export const useRoadmapTarefas = () => {
  const [tarefas, setTarefas] = useState<RoadmapTarefa[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTarefas = async () => {
    try {
      setLoading(true);
      
      // Buscar tarefas com JOIN para backlog e sprint
      const { data: sprintTarefas, error: tarefasError } = await supabase
        .from('sprint_tarefas')
        .select(`
          *,
          backlog:backlog_id (
            titulo,
            descricao,
            story_points,
            prioridade,
            tipo_produto
          ),
          sprint:sprint_id (
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

      // Agrupar tarefas por backlog_id
      const tarefasPorBacklog = new Map<string, any[]>();
      
      (sprintTarefas || []).forEach((tarefa: any) => {
        const backlogId = tarefa.backlog_id;
        if (!tarefasPorBacklog.has(backlogId)) {
          tarefasPorBacklog.set(backlogId, []);
        }
        tarefasPorBacklog.get(backlogId)!.push(tarefa);
      });

      // Criar tarefas agregadas
      const tarefasCompletas: RoadmapTarefa[] = Array.from(tarefasPorBacklog.entries()).map(([backlogId, tarefas]) => {
        // Pegar a primeira tarefa como base
        const primeiraTarefa = tarefas[0];
        
        // Calcular primeira data de início e última data de fim
        const datasInicio = tarefas.map(t => new Date(t.sprint?.data_inicio || '').getTime()).filter(d => !isNaN(d));
        const datasFim = tarefas.map(t => new Date(t.sprint?.data_fim || '').getTime()).filter(d => !isNaN(d));
        
        const primeiraDataInicio = datasInicio.length > 0 ? new Date(Math.min(...datasInicio)).toISOString() : '';
        const ultimaDataFim = datasFim.length > 0 ? new Date(Math.max(...datasFim)).toISOString() : '';
        
        // Coletar subtarefas diretamente pelo backlog_id
        const todasSubtarefas = (subtarefas || [])
          .filter((sub: any) => sub.backlog_id === backlogId)
          .map((sub: any) => ({
            id: sub.id,
            titulo: sub.titulo,
            inicio: sub.inicio,
            fim: sub.fim,
            status: sub.status,
            responsavel: sub.responsavel,
          }));
        
        return {
          id: primeiraTarefa.id,
          sprint_id: primeiraTarefa.sprint_id,
          backlog_id: backlogId,
          status: primeiraTarefa.status,
          responsavel: primeiraTarefa.responsavel,
          created_at: primeiraTarefa.created_at,
          updated_at: primeiraTarefa.updated_at,
          titulo: primeiraTarefa.backlog?.titulo || 'Sem título',
          descricao: primeiraTarefa.backlog?.descricao || null,
          story_points: primeiraTarefa.backlog?.story_points || 0,
          prioridade: primeiraTarefa.backlog?.prioridade || 'media',
          tipo_produto: primeiraTarefa.backlog?.tipo_produto || null,
          sprint_nome: '',
          sprint_data_inicio: primeiraDataInicio,
          sprint_data_fim: ultimaDataFim,
          sprint_status: primeiraTarefa.sprint?.status || 'planejamento',
          subtarefas: todasSubtarefas,
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
