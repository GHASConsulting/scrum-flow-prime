import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Subtarefa = Tables<'subtarefas'>;
type SubtarefaInsert = Omit<Subtarefa, 'id' | 'created_at' | 'updated_at'>;

export const useSubtarefas = () => {
  const [subtarefas, setSubtarefas] = useState<Subtarefa[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSubtarefas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subtarefas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubtarefas(data || []);
    } catch (error) {
      console.error('Erro ao carregar subtarefas:', error);
      toast.error('Erro ao carregar subtarefas');
    } finally {
      setLoading(false);
    }
  };

  const getSubtarefasByBacklogId = (backlogId: string) => {
    return subtarefas.filter(s => s.backlog_id === backlogId);
  };

  const addSubtarefa = async (subtarefa: SubtarefaInsert) => {
    try {
      const { data, error } = await supabase
        .from('subtarefas')
        .insert([subtarefa])
        .select()
        .single();

      if (error) throw error;
      setSubtarefas(prev => [data, ...prev]);
      toast.success('Subtarefa criada');
      return data;
    } catch (error) {
      console.error('Erro ao criar subtarefa:', error);
      toast.error('Erro ao criar subtarefa');
      throw error;
    }
  };

  const updateSubtarefa = async (id: string, updates: Partial<Subtarefa>) => {
    try {
      const { error } = await supabase
        .from('subtarefas')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setSubtarefas(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    } catch (error) {
      console.error('Erro ao atualizar subtarefa:', error);
      toast.error('Erro ao atualizar subtarefa');
      throw error;
    }
  };

  const deleteSubtarefa = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subtarefas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSubtarefas(prev => prev.filter(s => s.id !== id));
      toast.success('Subtarefa removida');
    } catch (error) {
      console.error('Erro ao remover subtarefa:', error);
      toast.error('Erro ao remover subtarefa');
      throw error;
    }
  };

  useEffect(() => {
    loadSubtarefas();

    const channel = supabase
      .channel('subtarefas-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subtarefas' }, () => {
        loadSubtarefas();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { subtarefas, loading, addSubtarefa, updateSubtarefa, deleteSubtarefa, loadSubtarefas, getSubtarefasByBacklogId };
};
