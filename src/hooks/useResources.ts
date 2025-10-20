import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Resource = Tables<'resource'>;
type ResourceInsert = Omit<Resource, 'id' | 'created_at'>;

export const useResources = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  const loadResources = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('resource')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Erro ao carregar recursos:', error);
      toast.error('Erro ao carregar recursos');
    } finally {
      setLoading(false);
    }
  };

  const addResource = async (resource: ResourceInsert) => {
    try {
      const { data, error } = await supabase
        .from('resource')
        .insert([resource])
        .select()
        .single();

      if (error) throw error;
      setResources(prev => [...prev, data]);
      toast.success('Recurso adicionado com sucesso');
      return data;
    } catch (error) {
      console.error('Erro ao criar recurso:', error);
      toast.error('Erro ao criar recurso');
      throw error;
    }
  };

  useEffect(() => {
    loadResources();

    const channel = supabase
      .channel('resource-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resource' }, () => {
        loadResources();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { resources, loading, addResource, loadResources };
};
