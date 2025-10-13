import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Daily {
  id: string;
  sprint_id: string;
  usuario: string;
  data: string;
  ontem: string;
  hoje: string;
  impedimentos: string | null;
  created_at?: string;
  updated_at?: string;
}

export type DailyInsert = Omit<Daily, 'id' | 'created_at' | 'updated_at'>;

export const useDailies = () => {
  const [dailies, setDailies] = useState<Daily[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDailies = async () => {
    try {
      const { data, error } = await supabase
        .from('daily')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDailies(data || []);
    } catch (error) {
      console.error('Erro ao carregar dailies:', error);
    } finally {
      setLoading(false);
    }
  };

  const addDaily = async (daily: DailyInsert) => {
    try {
      const { data, error } = await supabase
        .from('daily')
        .insert(daily)
        .select()
        .single();

      if (error) throw error;
      await loadDailies();
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao adicionar daily:', error);
      return { data: null, error };
    }
  };

  useEffect(() => {
    loadDailies();

    const channel = supabase
      .channel('daily-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily'
        },
        () => {
          loadDailies();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { dailies, loading, addDaily, loadDailies };
};
