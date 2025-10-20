import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type ScheduleTask = Tables<'schedule_task'>;
type ScheduleTaskInsert = Omit<ScheduleTask, 'id' | 'created_at' | 'updated_at'>;

export const useScheduleTasks = (projectId: string | null) => {
  const [tasks, setTasks] = useState<ScheduleTask[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    if (!projectId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('schedule_task')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      toast.error('Erro ao carregar tarefas');
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (task: ScheduleTaskInsert) => {
    try {
      const { data, error } = await supabase
        .from('schedule_task')
        .insert([task])
        .select()
        .single();

      if (error) throw error;
      setTasks(prev => [...prev, data]);
      toast.success('Tarefa adicionada com sucesso');
      return data;
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast.error('Erro ao criar tarefa');
      throw error;
    }
  };

  const updateTask = async (id: string, updates: Partial<ScheduleTask>) => {
    try {
      const { data, error } = await supabase
        .from('schedule_task')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setTasks(prev => prev.map(t => t.id === id ? data : t));
      return data;
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      toast.error('Erro ao atualizar tarefa');
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('schedule_task')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTasks(prev => prev.filter(t => t.id !== id));
      toast.success('Tarefa excluída com sucesso');
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      toast.error('Erro ao excluir tarefa');
      throw error;
    }
  };

  useEffect(() => {
    loadTasks();

    if (!projectId) return;

    const channel = supabase
      .channel(`schedule-task-changes-${projectId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'schedule_task',
        filter: `project_id=eq.${projectId}`
      }, () => {
        loadTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return { tasks, loading, addTask, updateTask, deleteTask, loadTasks };
};
