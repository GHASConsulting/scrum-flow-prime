import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type BacklogItem = Tables<'backlog'>;
type BacklogInsert = Omit<BacklogItem, 'id' | 'created_at' | 'updated_at'>;

export const useBacklog = () => {
  const [backlog, setBacklog] = useState<BacklogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBacklog = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('backlog')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBacklog(data || []);
    } catch (error) {
      console.error('Erro ao carregar backlog:', error);
      toast.error('Erro ao carregar backlog');
    } finally {
      setLoading(false);
    }
  };

  const addBacklogItem = async (item: BacklogInsert) => {
    try {
      const { data, error } = await supabase
        .from('backlog')
        .insert([item])
        .select()
        .single();

      if (error) throw error;
      setBacklog(prev => [data, ...prev]);
      toast.success('Item adicionado ao backlog');
      return data;
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      toast.error('Erro ao adicionar item ao backlog');
      throw error;
    }
  };

  const updateBacklogItem = async (id: string, updates: Partial<BacklogItem>) => {
    try {
      const { error } = await supabase
        .from('backlog')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setBacklog(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
      toast.success('Item atualizado');
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      toast.error('Erro ao atualizar item');
      throw error;
    }
  };

  const deleteBacklogItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('backlog')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setBacklog(prev => prev.filter(item => item.id !== id));
      toast.success('Item removido');
    } catch (error) {
      console.error('Erro ao remover item:', error);
      toast.error('Erro ao remover item');
      throw error;
    }
  };

  useEffect(() => {
    loadBacklog();

    const channel = supabase
      .channel('backlog-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'backlog' }, () => {
        loadBacklog();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { backlog, loading, addBacklogItem, updateBacklogItem, deleteBacklogItem, loadBacklog };
};
