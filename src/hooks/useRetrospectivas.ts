import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Retrospectiva {
  id: string;
  sprint_id: string;
  bom: string[];
  melhorar: string[];
  acoes: string[];
  data: string;
  created_at?: string;
  updated_at?: string;
}

export type RetrospectivaInsert = Omit<Retrospectiva, 'id' | 'created_at' | 'updated_at'>;

export const useRetrospectivas = () => {
  const [retrospectivas, setRetrospectivas] = useState<Retrospectiva[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRetrospectivas = async () => {
    try {
      const { data, error } = await supabase
        .from('retrospectiva')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRetrospectivas(data || []);
    } catch (error) {
      console.error('Erro ao carregar retrospectivas:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRetrospectiva = async (retrospectiva: RetrospectivaInsert) => {
    try {
      const { data, error } = await supabase
        .from('retrospectiva')
        .insert(retrospectiva)
        .select()
        .single();

      if (error) throw error;
      await loadRetrospectivas();
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao adicionar retrospectiva:', error);
      return { data: null, error };
    }
  };

  const getRetrospectivaBySprint = (sprintId: string): Retrospectiva | null => {
    return retrospectivas.find(r => r.sprint_id === sprintId) || null;
  };

  useEffect(() => {
    loadRetrospectivas();

    const channel = supabase
      .channel('retrospectiva-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'retrospectiva'
        },
        () => {
          loadRetrospectivas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { retrospectivas, loading, addRetrospectiva, getRetrospectivaBySprint, loadRetrospectivas };
};
