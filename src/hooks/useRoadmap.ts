import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Roadmap = Tables<'roadmap'>;
type RoadmapInsert = Omit<Roadmap, 'id' | 'created_at' | 'updated_at'>;

export const useRoadmap = () => {
  const [roadmapItems, setRoadmapItems] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRoadmap = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('roadmap')
        .select('*')
        .order('data_inicio_prevista', { ascending: true });

      if (error) throw error;
      setRoadmapItems(data || []);
    } catch (error) {
      console.error('Erro ao carregar roadmap:', error);
      toast.error('Erro ao carregar roadmap');
    } finally {
      setLoading(false);
    }
  };

  const addRoadmapItem = async (item: RoadmapInsert) => {
    try {
      const { data, error } = await supabase
        .from('roadmap')
        .insert([item])
        .select()
        .single();

      if (error) throw error;
      setRoadmapItems(prev => [data, ...prev]);
      toast.success('Item do roadmap criado com sucesso');
      return data;
    } catch (error) {
      console.error('Erro ao criar item do roadmap:', error);
      toast.error('Erro ao criar item do roadmap');
      throw error;
    }
  };

  const updateRoadmapItem = async (id: string, updates: Partial<Roadmap>) => {
    try {
      const { data, error } = await supabase
        .from('roadmap')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setRoadmapItems(prev => prev.map(item => item.id === id ? data : item));
      toast.success('Item do roadmap atualizado com sucesso');
      return data;
    } catch (error) {
      console.error('Erro ao atualizar item do roadmap:', error);
      toast.error('Erro ao atualizar item do roadmap');
      throw error;
    }
  };

  const deleteRoadmapItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('roadmap')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setRoadmapItems(prev => prev.filter(item => item.id !== id));
      toast.success('Item do roadmap excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir item do roadmap:', error);
      toast.error('Erro ao excluir item do roadmap');
      throw error;
    }
  };

  useEffect(() => {
    loadRoadmap();

    const channel = supabase
      .channel('roadmap-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'roadmap' }, () => {
        loadRoadmap();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { roadmapItems, loading, addRoadmapItem, updateRoadmapItem, deleteRoadmapItem, loadRoadmap };
};
