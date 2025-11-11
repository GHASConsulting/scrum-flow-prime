import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

export interface AvaEvento {
  id: string;
  nm_cliente: string;
  dt_registro: string;
  ds_tipo: string;
  ds_descricao: string | null;
  ie_status: 'success' | 'error' | 'pending' | 'info' | 'other';
  created_at: string;
}

export const useAvaEventos = () => {
  const queryClient = useQueryClient();

  // Setup realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('ava_evento_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ava_evento'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ava-eventos'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: eventos = [], isLoading } = useQuery({
    queryKey: ['ava-eventos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ava_evento')
        .select('*')
        .order('dt_registro', { ascending: false });

      if (error) throw error;
      return data as AvaEvento[];
    },
  });

  const deleteEvento = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ava_evento')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ava-eventos'] });
      toast.success("Evento excluído com sucesso");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir evento: ${error.message}`);
    },
  });

  return {
    eventos,
    isLoading,
    deleteEvento: deleteEvento.mutate,
  };
};
