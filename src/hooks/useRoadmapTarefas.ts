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

      // Combinar os dados
      const tarefasCompletas: RoadmapTarefa[] = (sprintTarefas || []).map((tarefa: any) => ({
        id: tarefa.id,
        sprint_id: tarefa.sprint_id,
        backlog_id: tarefa.backlog_id,
        status: tarefa.status,
        responsavel: tarefa.responsavel,
        created_at: tarefa.created_at,
        updated_at: tarefa.updated_at,
        titulo: tarefa.backlog?.titulo || 'Sem título',
        descricao: tarefa.backlog?.descricao || null,
        story_points: tarefa.backlog?.story_points || 0,
        prioridade: tarefa.backlog?.prioridade || 'media',
        tipo_produto: tarefa.backlog?.tipo_produto || null,
        sprint_nome: tarefa.sprint?.nome || 'Sem sprint',
        sprint_data_inicio: tarefa.sprint?.data_inicio || '',
        sprint_data_fim: tarefa.sprint?.data_fim || '',
        sprint_status: tarefa.sprint?.status || 'planejamento',
        subtarefas: (subtarefas || [])
          .filter((sub: any) => sub.sprint_tarefa_id === tarefa.id)
          .map((sub: any) => ({
            id: sub.id,
            titulo: sub.titulo,
            inicio: sub.inicio,
            fim: sub.fim,
            status: sub.status,
            responsavel: sub.responsavel,
          })),
      }));

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
