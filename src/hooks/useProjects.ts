import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Project = Tables<'project'>;
type ProjectInsert = Omit<Project, 'id' | 'created_at' | 'updated_at'>;

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      toast.error('Erro ao carregar projetos');
    } finally {
      setLoading(false);
    }
  };

  const addProject = async (project: ProjectInsert) => {
    try {
      const { data, error } = await supabase
        .from('project')
        .insert([project])
        .select()
        .single();

      if (error) throw error;
      setProjects(prev => [data, ...prev]);
      toast.success('Projeto criado com sucesso');
      return data;
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      toast.error('Erro ao criar projeto');
      throw error;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const { data, error } = await supabase
        .from('project')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setProjects(prev => prev.map(p => p.id === id ? data : p));
      toast.success('Projeto atualizado com sucesso');
      return data;
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      toast.error('Erro ao atualizar projeto');
      throw error;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('project')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setProjects(prev => prev.filter(p => p.id !== id));
      toast.success('Projeto excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      toast.error('Erro ao excluir projeto');
      throw error;
    }
  };

  useEffect(() => {
    loadProjects();

    const channel = supabase
      .channel('project-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project' }, () => {
        loadProjects();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { projects, loading, addProject, updateProject, deleteProject, loadProjects };
};
