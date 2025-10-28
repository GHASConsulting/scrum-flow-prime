import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ClientAccessRecord {
  id: string;
  cliente: string;
  created_at: string;
  updated_at: string;
}

export interface VpnAccess {
  id?: string;
  client_record_id?: string;
  vpn_nome?: string;
  vpn_executavel_path?: string;
  vpn_ip_servidor?: string;
  vpn_usuario?: string;
  vpn_senha?: string;
}

export interface ServerAccess {
  id?: string;
  client_record_id?: string;
  servidor_so?: string;
  servidor_ip?: string;
  servidor_usuario?: string;
  servidor_senha?: string;
}

export interface DockerAccess {
  id?: string;
  client_record_id?: string;
  docker_so?: string;
  docker_usuario?: string;
  docker_senha?: string;
}

export interface DatabaseAccess {
  id?: string;
  client_record_id?: string;
  bd_host?: string;
  bd_service_name?: string;
  bd_porta?: string;
  bd_usuario?: string;
  bd_senha?: string;
}

export interface AppAccess {
  id?: string;
  client_record_id?: string;
  app_nome?: string;
  app_usuario?: string;
  app_senha?: string;
}

export interface ClientAccessRecordWithDetails extends ClientAccessRecord {
  vpn_access: VpnAccess[];
  server_access: ServerAccess[];
  docker_access: DockerAccess[];
  database_access: DatabaseAccess[];
  app_access: AppAccess[];
}

export const useClientAccessRecords = () => {
  const queryClient = useQueryClient();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["client-access-records"],
    queryFn: async () => {
      const { data: mainRecords, error: mainError } = await supabase
        .from("client_access_records")
        .select("*")
        .order("created_at", { ascending: false });

      if (mainError) throw mainError;

      const recordsWithDetails = await Promise.all(
        mainRecords.map(async (record) => {
          const [vpnData, serverData, dockerData, dbData, appData] = await Promise.all([
            supabase.from("client_vpn_access").select("*").eq("client_record_id", record.id),
            supabase.from("client_server_access").select("*").eq("client_record_id", record.id),
            supabase.from("client_docker_access").select("*").eq("client_record_id", record.id),
            supabase.from("client_database_access").select("*").eq("client_record_id", record.id),
            supabase.from("client_app_access").select("*").eq("client_record_id", record.id),
          ]);

          return {
            ...record,
            vpn_access: vpnData.data || [],
            server_access: serverData.data || [],
            docker_access: dockerData.data || [],
            database_access: dbData.data || [],
            app_access: appData.data || [],
          };
        })
      );

      return recordsWithDetails as ClientAccessRecordWithDetails[];
    },
  });

  const createRecord = useMutation({
    mutationFn: async (data: {
      cliente: string;
      vpn_access: VpnAccess[];
      server_access: ServerAccess[];
      docker_access: DockerAccess[];
      database_access: DatabaseAccess[];
      app_access: AppAccess[];
    }) => {
      const { data: mainRecord, error: mainError } = await supabase
        .from("client_access_records")
        .insert({ cliente: data.cliente })
        .select()
        .single();

      if (mainError) throw mainError;

      await Promise.all([
        ...data.vpn_access.map((vpn) =>
          supabase.from("client_vpn_access").insert({ ...vpn, client_record_id: mainRecord.id })
        ),
        ...data.server_access.map((server) =>
          supabase.from("client_server_access").insert({ ...server, client_record_id: mainRecord.id })
        ),
        ...data.docker_access.map((docker) =>
          supabase.from("client_docker_access").insert({ ...docker, client_record_id: mainRecord.id })
        ),
        ...data.database_access.map((db) =>
          supabase.from("client_database_access").insert({ ...db, client_record_id: mainRecord.id })
        ),
        ...data.app_access.map((app) =>
          supabase.from("client_app_access").insert({ ...app, client_record_id: mainRecord.id })
        ),
      ]);

      return mainRecord;
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
    mutationFn: async (data: {
      id: string;
      cliente: string;
      vpn_access: VpnAccess[];
      server_access: ServerAccess[];
      docker_access: DockerAccess[];
      database_access: DatabaseAccess[];
      app_access: AppAccess[];
    }) => {
      const { error: mainError } = await supabase
        .from("client_access_records")
        .update({ cliente: data.cliente })
        .eq("id", data.id);

      if (mainError) throw mainError;

      // Deletar todos os registros relacionados antigos
      await Promise.all([
        supabase.from("client_vpn_access").delete().eq("client_record_id", data.id),
        supabase.from("client_server_access").delete().eq("client_record_id", data.id),
        supabase.from("client_docker_access").delete().eq("client_record_id", data.id),
        supabase.from("client_database_access").delete().eq("client_record_id", data.id),
        supabase.from("client_app_access").delete().eq("client_record_id", data.id),
      ]);

      // Inserir novos registros
      await Promise.all([
        ...data.vpn_access.map((vpn) =>
          supabase.from("client_vpn_access").insert({ ...vpn, client_record_id: data.id })
        ),
        ...data.server_access.map((server) =>
          supabase.from("client_server_access").insert({ ...server, client_record_id: data.id })
        ),
        ...data.docker_access.map((docker) =>
          supabase.from("client_docker_access").insert({ ...docker, client_record_id: data.id })
        ),
        ...data.database_access.map((db) =>
          supabase.from("client_database_access").insert({ ...db, client_record_id: data.id })
        ),
        ...data.app_access.map((app) =>
          supabase.from("client_app_access").insert({ ...app, client_record_id: data.id })
        ),
      ]);
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
