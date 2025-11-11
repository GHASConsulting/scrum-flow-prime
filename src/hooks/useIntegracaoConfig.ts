import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface IntegracaoConfig {
  id: string;
  webhook_token: string;
  created_at: string;
  updated_at: string;
}

export const useIntegracaoConfig = () => {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['integracao-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integracao_config')
        .select('*')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as IntegracaoConfig | null;
    },
  });

  const saveConfig = useMutation({
    mutationFn: async (webhookToken: string) => {
      if (config) {
        // Update existing
        const { error } = await supabase
          .from('integracao_config')
          .update({ webhook_token: webhookToken })
          .eq('id', config.id);
        
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('integracao_config')
          .insert({ webhook_token: webhookToken });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integracao-config'] });
      toast.success("Configuração salva com sucesso");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar configuração: ${error.message}`);
    },
  });

  return {
    config,
    isLoading,
    saveConfig: saveConfig.mutate,
  };
};
