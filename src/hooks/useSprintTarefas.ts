import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type SprintTarefa = Tables<'sprint_tarefas'>;
type SprintTarefaInsert = Omit<SprintTarefa, 'id' | 'created_at' | 'updated_at'>;

export const useSprintTarefas = () => {
  const [sprintTarefas, setSprintTarefas] = useState<SprintTarefa[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSprintTarefas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sprint_tarefas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSprintTarefas(data || []);
    } catch (error) {
      console.error('Erro ao carregar tarefas da sprint:', error);
      toast.error('Erro ao carregar tarefas da sprint');
    } finally {
      setLoading(false);
    }
  };

  const addSprintTarefa = async (tarefa: SprintTarefaInsert) => {
    try {
      const { data, error } = await supabase
        .from('sprint_tarefas')
        .insert([tarefa])
        .select()
        .single();

      if (error) throw error;
      setSprintTarefas(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Erro ao adicionar tarefa à sprint:', error);
      toast.error('Erro ao adicionar tarefa à sprint');
      throw error;
    }
  };

  const updateSprintTarefa = async (id: string, updates: Partial<SprintTarefa>) => {
    try {
      const { error } = await supabase
        .from('sprint_tarefas')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setSprintTarefas(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      toast.error('Erro ao atualizar tarefa');
      throw error;
    }
  };

  const deleteSprintTarefa = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sprint_tarefas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSprintTarefas(prev => prev.filter(t => t.id !== id));
      toast.success('Tarefa removida da sprint');
    } catch (error) {
      console.error('Erro ao remover tarefa da sprint:', error);
      toast.error('Erro ao remover tarefa da sprint');
      throw error;
    }
  };

  useEffect(() => {
    loadSprintTarefas();

    const channel = supabase
      .channel('sprint-tarefas-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sprint_tarefas' }, () => {
        loadSprintTarefas();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { sprintTarefas, loading, addSprintTarefa, updateSprintTarefa, deleteSprintTarefa, loadSprintTarefas };
};
