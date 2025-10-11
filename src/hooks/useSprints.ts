import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Sprint = Tables<'sprint'>;
type SprintInsert = Omit<Sprint, 'id' | 'created_at' | 'updated_at'>;

export const useSprints = () => {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSprints = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sprint')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSprints(data || []);
    } catch (error) {
      console.error('Erro ao carregar sprints:', error);
      toast.error('Erro ao carregar sprints');
    } finally {
      setLoading(false);
    }
  };

  const addSprint = async (sprint: SprintInsert) => {
    try {
      const { data, error } = await supabase
        .from('sprint')
        .insert([sprint])
        .select()
        .single();

      if (error) throw error;
      setSprints(prev => [data, ...prev]);
      toast.success('Sprint criada com sucesso');
      return data;
    } catch (error) {
      console.error('Erro ao criar sprint:', error);
      toast.error('Erro ao criar sprint');
      throw error;
    }
  };

  const updateSprint = async (id: string, updates: Partial<Sprint>) => {
    try {
      const { data, error } = await supabase
        .from('sprint')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Atualiza o estado imediatamente com os dados retornados
      setSprints(prev => prev.map(s => s.id === id ? data : s));
      
      return data;
    } catch (error) {
      console.error('Erro ao atualizar sprint:', error);
      toast.error('Erro ao atualizar sprint');
      throw error;
    }
  };

  useEffect(() => {
    loadSprints();

    const channel = supabase
      .channel('sprint-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sprint' }, () => {
        loadSprints();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { sprints, loading, addSprint, updateSprint, loadSprints };
};
