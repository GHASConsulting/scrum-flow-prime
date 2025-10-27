import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ClientAccessRecord {
  id: string;
  cliente: string;
  vpn_nome?: string;
  vpn_executavel_path?: string;
  vpn_ip_servidor?: string;
  vpn_usuario?: string;
  vpn_senha?: string;
  servidor_so?: string;
  servidor_usuario?: string;
  servidor_senha?: string;
  docker_so?: string;
  docker_usuario?: string;
  docker_senha?: string;
  bd_tns?: string;
  bd_usuario?: string;
  bd_senha?: string;
  app_nome?: string;
  app_usuario?: string;
  app_senha?: string;
  created_at: string;
  updated_at: string;
}

export const useClientAccessRecords = () => {
  const queryClient = useQueryClient();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["client-access-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_access_records")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ClientAccessRecord[];
    },
  });

  const createRecord = useMutation({
    mutationFn: async (record: Omit<ClientAccessRecord, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("client_access_records")
        .insert(record)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-access-records"] });
      toast.success("Registro criado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao criar registro: " + error.message);
    },
  });

  const updateRecord = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ClientAccessRecord> & { id: string }) => {
      const { data, error } = await supabase
        .from("client_access_records")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-access-records"] });
      toast.success("Registro atualizado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar registro: " + error.message);
    },
  });

  const deleteRecord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("client_access_records")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-access-records"] });
      toast.success("Registro deletado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao deletar registro: " + error.message);
    },
  });

  const uploadVpnExecutable = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("vpn-executables")
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    return filePath;
  };

  const downloadVpnExecutable = async (path: string) => {
    const { data, error } = await supabase.storage
      .from("vpn-executables")
      .download(path);

    if (error) throw error;
    return data;
  };

  const deleteVpnExecutable = async (path: string) => {
    const { error } = await supabase.storage
      .from("vpn-executables")
      .remove([path]);

    if (error) throw error;
  };

  return {
    records,
    isLoading,
    createRecord,
    updateRecord,
    deleteRecord,
    uploadVpnExecutable,
    downloadVpnExecutable,
    deleteVpnExecutable,
  };
};
