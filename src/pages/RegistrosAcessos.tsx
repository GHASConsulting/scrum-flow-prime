import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useClientAccessRecords, ClientAccessRecordWithDetails, VpnAccess, ServerAccess, DockerAccess, DatabaseAccess, AppAccess } from "@/hooks/useClientAccessRecords";
import { Plus, Pencil, Trash2, Download, Eye, EyeOff, X } from "lucide-react";
import { toast } from "sonner";

export default function RegistrosAcessos() {
  const { records, isLoading, createRecord, updateRecord, deleteRecord, uploadVpnExecutable, downloadVpnExecutable } = useClientAccessRecords();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ClientAccessRecordWithDetails | null>(null);
  const [filterCliente, setFilterCliente] = useState("");
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState<{
    cliente: string;
    vpn_access: VpnAccess[];
    server_access: ServerAccess[];
    docker_access: DockerAccess[];
    database_access: DatabaseAccess[];
    app_access: AppAccess[];
  }>({
    cliente: "",
    vpn_access: [],
    server_access: [],
    docker_access: [],
    database_access: [],
    app_access: [],
  });

  const filteredRecords = records.filter((record) =>
    filterCliente === "" || record.cliente.toLowerCase().includes(filterCliente.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Upload de executáveis VPN
    const vpnAccessWithFiles = await Promise.all(
      formData.vpn_access.map(async (vpn) => {
        // Verifica se é um arquivo (File) a ser enviado
        if (vpn.vpn_executavel_path && 
            typeof vpn.vpn_executavel_path !== "string") {
          try {
            const uploadedPath = await uploadVpnExecutable(vpn.vpn_executavel_path as any);
            return { ...vpn, vpn_executavel_path: uploadedPath };
          } catch (error) {
            toast.error("Erro ao fazer upload do executável");
            return vpn;
          }
        }
        return vpn;
      })
    );

    const data = {
      ...formData,
      vpn_access: vpnAccessWithFiles,
    };

    if (editingRecord) {
      updateRecord.mutate({ id: editingRecord.id, ...data });
    } else {
      createRecord.mutate(data);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      cliente: "",
      vpn_access: [],
      server_access: [],
      docker_access: [],
      database_access: [],
      app_access: [],
    });
    setEditingRecord(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (record: ClientAccessRecordWithDetails) => {
    setEditingRecord(record);
    setFormData({
      cliente: record.cliente,
      vpn_access: record.vpn_access.length > 0 ? record.vpn_access : [],
      server_access: record.server_access.length > 0 ? record.server_access : [],
      docker_access: record.docker_access.length > 0 ? record.docker_access : [],
      database_access: record.database_access.length > 0 ? record.database_access : [],
      app_access: record.app_access.length > 0 ? record.app_access : [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja deletar este registro?")) {
      deleteRecord.mutate(id);
    }
  };

  const handleDownloadExecutable = async (path: string, cliente: string) => {
    try {
      const blob = await downloadVpnExecutable(path);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vpn-${cliente}.exe`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Download iniciado");
    } catch (error) {
      toast.error("Erro ao fazer download do executável");
    }
  };

  const togglePasswordVisibility = (recordId: string, field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [`${recordId}-${field}`]: !prev[`${recordId}-${field}`]
    }));
  };

  const PasswordField = ({ value, recordId, field }: { value?: string; recordId: string; field: string }) => {
    const key = `${recordId}-${field}`;
    const isVisible = showPasswords[key];
    
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm">
          {isVisible ? value : "••••••••"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => togglePasswordVisibility(recordId, field)}
        >
          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    );
  };

  // Funções para adicionar/remover itens
  const addVpnAccess = () => {
    setFormData({
      ...formData,
      vpn_access: [...formData.vpn_access, {}]
    });
  };

  const removeVpnAccess = (index: number) => {
    setFormData({
      ...formData,
      vpn_access: formData.vpn_access.filter((_, i) => i !== index)
    });
  };

  const updateVpnAccess = (index: number, field: keyof VpnAccess, value: any) => {
    const updated = [...formData.vpn_access];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, vpn_access: updated });
  };

  const addServerAccess = () => {
    setFormData({
      ...formData,
      server_access: [...formData.server_access, {}]
    });
  };

  const removeServerAccess = (index: number) => {
    setFormData({
      ...formData,
      server_access: formData.server_access.filter((_, i) => i !== index)
    });
  };

  const updateServerAccess = (index: number, field: keyof ServerAccess, value: any) => {
    const updated = [...formData.server_access];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, server_access: updated });
  };

  const addDockerAccess = () => {
    setFormData({
      ...formData,
      docker_access: [...formData.docker_access, {}]
    });
  };

  const removeDockerAccess = (index: number) => {
    setFormData({
      ...formData,
      docker_access: formData.docker_access.filter((_, i) => i !== index)
    });
  };

  const updateDockerAccess = (index: number, field: keyof DockerAccess, value: any) => {
    const updated = [...formData.docker_access];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, docker_access: updated });
  };

  const addDatabaseAccess = () => {
    setFormData({
      ...formData,
      database_access: [...formData.database_access, {}]
    });
  };

  const removeDatabaseAccess = (index: number) => {
    setFormData({
      ...formData,
      database_access: formData.database_access.filter((_, i) => i !== index)
    });
  };

  const updateDatabaseAccess = (index: number, field: keyof DatabaseAccess, value: any) => {
    const updated = [...formData.database_access];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, database_access: updated });
  };

  const addAppAccess = () => {
    setFormData({
      ...formData,
      app_access: [...formData.app_access, {}]
    });
  };

  const removeAppAccess = (index: number) => {
    setFormData({
      ...formData,
      app_access: formData.app_access.filter((_, i) => i !== index)
    });
  };

  const updateAppAccess = (index: number, field: keyof AppAccess, value: any) => {
    const updated = [...formData.app_access];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, app_access: updated });
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Registros de Acessos</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingRecord(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Registro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingRecord ? "Editar Registro" : "Novo Registro de Acesso"}
                </DialogTitle>
                <DialogDescription>
                  Preencha as informações de acesso do cliente
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cliente">Cliente *</Label>
                    <Input
                      id="cliente"
                      value={formData.cliente}
                      onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                      required
                    />
                  </div>

                  <Accordion type="multiple" className="w-full">
                    {/* VPN Access */}
                    <AccordionItem value="vpn">
                      <AccordionTrigger>
                        <div className="flex items-center justify-between w-full pr-4">
                          <span>Acesso ao Cliente via VPN ({formData.vpn_access.length})</span>
                          <Button
                            type="button"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              addVpnAccess();
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Adicionar VPN
                          </Button>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-6">
                          {formData.vpn_access.map((vpn, index) => (
                            <Card key={index}>
                              <CardHeader>
                                <div className="flex justify-between items-center">
                                  <CardTitle className="text-sm">VPN {index + 1}</CardTitle>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeVpnAccess(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div>
                                  <Label>Nome da VPN</Label>
                                  <Input
                                    value={vpn.vpn_nome || ""}
                                    onChange={(e) => updateVpnAccess(index, "vpn_nome", e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>Upload do Executável</Label>
                                  <Input
                                    type="file"
                                    onChange={(e) => updateVpnAccess(index, "vpn_executavel_path", e.target.files?.[0])}
                                  />
                                  {vpn.vpn_executavel_path && typeof vpn.vpn_executavel_path === "string" && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      Arquivo atual: {vpn.vpn_executavel_path}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <Label>IP do Servidor</Label>
                                  <Input
                                    value={vpn.vpn_ip_servidor || ""}
                                    onChange={(e) => updateVpnAccess(index, "vpn_ip_servidor", e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>Usuário</Label>
                                  <Input
                                    value={vpn.vpn_usuario || ""}
                                    onChange={(e) => updateVpnAccess(index, "vpn_usuario", e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>Senha</Label>
                                  <Input
                                    type="password"
                                    value={vpn.vpn_senha || ""}
                                    onChange={(e) => updateVpnAccess(index, "vpn_senha", e.target.value)}
                                  />
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          {formData.vpn_access.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Nenhum acesso VPN adicionado. Clique em "Adicionar VPN" acima.
                            </p>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Server Access */}
                    <AccordionItem value="servidor">
                      <AccordionTrigger>
                        <div className="flex items-center justify-between w-full pr-4">
                          <span>Servidor ({formData.server_access.length})</span>
                          <Button
                            type="button"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              addServerAccess();
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Adicionar Servidor
                          </Button>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-6">
                          {formData.server_access.map((server, index) => (
                            <Card key={index}>
                              <CardHeader>
                                <div className="flex justify-between items-center">
                                  <CardTitle className="text-sm">Servidor {index + 1}</CardTitle>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeServerAccess(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div>
                                  <Label>SO do Servidor</Label>
                                  <Input
                                    value={server.servidor_so || ""}
                                    onChange={(e) => updateServerAccess(index, "servidor_so", e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>IP do Servidor</Label>
                                  <Input
                                    value={server.servidor_ip || ""}
                                    onChange={(e) => updateServerAccess(index, "servidor_ip", e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>Usuário</Label>
                                  <Input
                                    value={server.servidor_usuario || ""}
                                    onChange={(e) => updateServerAccess(index, "servidor_usuario", e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>Senha</Label>
                                  <Input
                                    type="password"
                                    value={server.servidor_senha || ""}
                                    onChange={(e) => updateServerAccess(index, "servidor_senha", e.target.value)}
                                  />
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          {formData.server_access.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Nenhum servidor adicionado. Clique em "Adicionar Servidor" acima.
                            </p>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Docker Access */}
                    <AccordionItem value="docker">
                      <AccordionTrigger>
                        <div className="flex items-center justify-between w-full pr-4">
                          <span>Docker ({formData.docker_access.length})</span>
                          <Button
                            type="button"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              addDockerAccess();
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Adicionar Docker
                          </Button>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-6">
                          {formData.docker_access.map((docker, index) => (
                            <Card key={index}>
                              <CardHeader>
                                <div className="flex justify-between items-center">
                                  <CardTitle className="text-sm">Docker {index + 1}</CardTitle>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeDockerAccess(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div>
                                  <Label>SO do Servidor</Label>
                                  <Input
                                    value={docker.docker_so || ""}
                                    onChange={(e) => updateDockerAccess(index, "docker_so", e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>Usuário</Label>
                                  <Input
                                    value={docker.docker_usuario || ""}
                                    onChange={(e) => updateDockerAccess(index, "docker_usuario", e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>Senha</Label>
                                  <Input
                                    type="password"
                                    value={docker.docker_senha || ""}
                                    onChange={(e) => updateDockerAccess(index, "docker_senha", e.target.value)}
                                  />
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          {formData.docker_access.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Nenhum Docker adicionado. Clique em "Adicionar Docker" acima.
                            </p>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Database Access */}
                    <AccordionItem value="bd">
                      <AccordionTrigger>
                        <div className="flex items-center justify-between w-full pr-4">
                          <span>Banco de Dados ({formData.database_access.length})</span>
                          <Button
                            type="button"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              addDatabaseAccess();
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Adicionar BD
                          </Button>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-6">
                          {formData.database_access.map((db, index) => (
                            <Card key={index}>
                              <CardHeader>
                                <div className="flex justify-between items-center">
                                  <CardTitle className="text-sm">Banco de Dados {index + 1}</CardTitle>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeDatabaseAccess(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div>
                                  <Label>Host de Conexão</Label>
                                  <Input
                                    value={db.bd_host || ""}
                                    onChange={(e) => updateDatabaseAccess(index, "bd_host", e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>Service Name</Label>
                                  <Input
                                    value={db.bd_service_name || ""}
                                    onChange={(e) => updateDatabaseAccess(index, "bd_service_name", e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>Porta</Label>
                                  <Input
                                    value={db.bd_porta || ""}
                                    onChange={(e) => updateDatabaseAccess(index, "bd_porta", e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>Usuário</Label>
                                  <Input
                                    value={db.bd_usuario || ""}
                                    onChange={(e) => updateDatabaseAccess(index, "bd_usuario", e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>Senha</Label>
                                  <Input
                                    type="password"
                                    value={db.bd_senha || ""}
                                    onChange={(e) => updateDatabaseAccess(index, "bd_senha", e.target.value)}
                                  />
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          {formData.database_access.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Nenhum banco de dados adicionado. Clique em "Adicionar BD" acima.
                            </p>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* App Access */}
                    <AccordionItem value="app">
                      <AccordionTrigger>
                        <div className="flex items-center justify-between w-full pr-4">
                          <span>Aplicações ({formData.app_access.length})</span>
                          <Button
                            type="button"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              addAppAccess();
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Adicionar App
                          </Button>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-6">
                          {formData.app_access.map((app, index) => (
                            <Card key={index}>
                              <CardHeader>
                                <div className="flex justify-between items-center">
                                  <CardTitle className="text-sm">Aplicação {index + 1}</CardTitle>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeAppAccess(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div>
                                  <Label>Nome da Aplicação</Label>
                                  <Input
                                    value={app.app_nome || ""}
                                    onChange={(e) => updateAppAccess(index, "app_nome", e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>Usuário</Label>
                                  <Input
                                    value={app.app_usuario || ""}
                                    onChange={(e) => updateAppAccess(index, "app_usuario", e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>Senha</Label>
                                  <Input
                                    type="password"
                                    value={app.app_senha || ""}
                                    onChange={(e) => updateAppAccess(index, "app_senha", e.target.value)}
                                  />
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          {formData.app_access.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Nenhuma aplicação adicionada. Clique em "Adicionar App" acima.
                            </p>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingRecord ? "Atualizar" : "Criar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Filtre os registros de acesso</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="filter-cliente">Cliente</Label>
                <Input
                  id="filter-cliente"
                  placeholder="Filtrar por cliente..."
                  value={filterCliente}
                  onChange={(e) => setFilterCliente(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registros</CardTitle>
            <CardDescription>
              {filteredRecords.length} registro{filteredRecords.length !== 1 ? "s" : ""} encontrado{filteredRecords.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Carregando...</p>
            ) : (
              <div className="space-y-4">
                {filteredRecords.map((record) => (
                  <Card key={record.id}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-xl">{record.cliente}</CardTitle>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(record)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(record.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="multiple" className="w-full">
                        {/* VPN Details */}
                        {record.vpn_access.length > 0 && (
                          <AccordionItem value="vpn">
                            <AccordionTrigger>
                              Acesso VPN ({record.vpn_access.length})
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-4">
                                {record.vpn_access.map((vpn, index) => (
                                  <Card key={vpn.id || index}>
                                    <CardHeader>
                                      <CardTitle className="text-sm">VPN {index + 1}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                      {vpn.vpn_nome && (
                                        <div>
                                          <strong>Nome:</strong> {vpn.vpn_nome}
                                        </div>
                                      )}
                                      {vpn.vpn_executavel_path && (
                                        <div className="flex items-center gap-2">
                                          <strong>Executável:</strong>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDownloadExecutable(vpn.vpn_executavel_path!, record.cliente)}
                                          >
                                            <Download className="h-4 w-4 mr-1" />
                                            Download
                                          </Button>
                                        </div>
                                      )}
                                      {vpn.vpn_ip_servidor && (
                                        <div>
                                          <strong>IP Servidor:</strong> {vpn.vpn_ip_servidor}
                                        </div>
                                      )}
                                      {vpn.vpn_usuario && (
                                        <div>
                                          <strong>Usuário:</strong> {vpn.vpn_usuario}
                                        </div>
                                      )}
                                      {vpn.vpn_senha && (
                                        <div>
                                          <strong>Senha:</strong>
                                          <PasswordField value={vpn.vpn_senha} recordId={vpn.id || `vpn-${index}`} field="vpn_senha" />
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        )}

                        {/* Server Details */}
                        {record.server_access.length > 0 && (
                          <AccordionItem value="servidor">
                            <AccordionTrigger>
                              Servidores ({record.server_access.length})
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-4">
                                {record.server_access.map((server, index) => (
                                  <Card key={server.id || index}>
                                    <CardHeader>
                                      <CardTitle className="text-sm">Servidor {index + 1}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                      {server.servidor_so && (
                                        <div>
                                          <strong>SO:</strong> {server.servidor_so}
                                        </div>
                                      )}
                                      {server.servidor_ip && (
                                        <div>
                                          <strong>IP:</strong> {server.servidor_ip}
                                        </div>
                                      )}
                                      {server.servidor_usuario && (
                                        <div>
                                          <strong>Usuário:</strong> {server.servidor_usuario}
                                        </div>
                                      )}
                                      {server.servidor_senha && (
                                        <div>
                                          <strong>Senha:</strong>
                                          <PasswordField value={server.servidor_senha} recordId={server.id || `server-${index}`} field="servidor_senha" />
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        )}

                        {/* Docker Details */}
                        {record.docker_access.length > 0 && (
                          <AccordionItem value="docker">
                            <AccordionTrigger>
                              Docker ({record.docker_access.length})
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-4">
                                {record.docker_access.map((docker, index) => (
                                  <Card key={docker.id || index}>
                                    <CardHeader>
                                      <CardTitle className="text-sm">Docker {index + 1}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                      {docker.docker_so && (
                                        <div>
                                          <strong>SO:</strong> {docker.docker_so}
                                        </div>
                                      )}
                                      {docker.docker_usuario && (
                                        <div>
                                          <strong>Usuário:</strong> {docker.docker_usuario}
                                        </div>
                                      )}
                                      {docker.docker_senha && (
                                        <div>
                                          <strong>Senha:</strong>
                                          <PasswordField value={docker.docker_senha} recordId={docker.id || `docker-${index}`} field="docker_senha" />
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        )}

                        {/* Database Details */}
                        {record.database_access.length > 0 && (
                          <AccordionItem value="bd">
                            <AccordionTrigger>
                              Banco de Dados ({record.database_access.length})
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-4">
                                {record.database_access.map((db, index) => (
                                  <Card key={db.id || index}>
                                    <CardHeader>
                                      <CardTitle className="text-sm">BD {index + 1}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                      {db.bd_host && (
                                        <div>
                                          <strong>Host:</strong> {db.bd_host}
                                        </div>
                                      )}
                                      {db.bd_service_name && (
                                        <div>
                                          <strong>Service Name:</strong> {db.bd_service_name}
                                        </div>
                                      )}
                                      {db.bd_porta && (
                                        <div>
                                          <strong>Porta:</strong> {db.bd_porta}
                                        </div>
                                      )}
                                      {db.bd_usuario && (
                                        <div>
                                          <strong>Usuário:</strong> {db.bd_usuario}
                                        </div>
                                      )}
                                      {db.bd_senha && (
                                        <div>
                                          <strong>Senha:</strong>
                                          <PasswordField value={db.bd_senha} recordId={db.id || `db-${index}`} field="bd_senha" />
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        )}

                        {/* App Details */}
                        {record.app_access.length > 0 && (
                          <AccordionItem value="app">
                            <AccordionTrigger>
                              Aplicações ({record.app_access.length})
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-4">
                                {record.app_access.map((app, index) => (
                                  <Card key={app.id || index}>
                                    <CardHeader>
                                      <CardTitle className="text-sm">App {index + 1}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                      {app.app_nome && (
                                        <div>
                                          <strong>Nome:</strong> {app.app_nome}
                                        </div>
                                      )}
                                      {app.app_usuario && (
                                        <div>
                                          <strong>Usuário:</strong> {app.app_usuario}
                                        </div>
                                      )}
                                      {app.app_senha && (
                                        <div>
                                          <strong>Senha:</strong>
                                          <PasswordField value={app.app_senha} recordId={app.id || `app-${index}`} field="app_senha" />
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        )}
                      </Accordion>
                    </CardContent>
                  </Card>
                ))}

                {filteredRecords.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum registro encontrado
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
