import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useClientAccessRecords, ClientAccessRecord } from "@/hooks/useClientAccessRecords";
import { Plus, Pencil, Trash2, Download, Upload, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function RegistrosAcessos() {
  const { records, isLoading, createRecord, updateRecord, deleteRecord, uploadVpnExecutable, downloadVpnExecutable } = useClientAccessRecords();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ClientAccessRecord | null>(null);
  const [filterCliente, setFilterCliente] = useState("");
  const [vpnFile, setVpnFile] = useState<File | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    cliente: "",
    vpn_nome: "",
    vpn_ip_servidor: "",
    vpn_usuario: "",
    vpn_senha: "",
    servidor_so: "",
    servidor_usuario: "",
    servidor_senha: "",
    docker_so: "",
    docker_usuario: "",
    docker_senha: "",
    bd_tns: "",
    bd_usuario: "",
    bd_senha: "",
    app_nome: "",
    app_usuario: "",
    app_senha: "",
  });

  const filteredRecords = records.filter((record) =>
    filterCliente === "" || record.cliente.toLowerCase().includes(filterCliente.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let vpnExecutavelPath = editingRecord?.vpn_executavel_path;
    
    if (vpnFile) {
      try {
        vpnExecutavelPath = await uploadVpnExecutable(vpnFile);
      } catch (error) {
        toast.error("Erro ao fazer upload do executável");
        return;
      }
    }

    const data = {
      ...formData,
      vpn_executavel_path: vpnExecutavelPath,
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
      vpn_nome: "",
      vpn_ip_servidor: "",
      vpn_usuario: "",
      vpn_senha: "",
      servidor_so: "",
      servidor_usuario: "",
      servidor_senha: "",
      docker_so: "",
      docker_usuario: "",
      docker_senha: "",
      bd_tns: "",
      bd_usuario: "",
      bd_senha: "",
      app_nome: "",
      app_usuario: "",
      app_senha: "",
    });
    setVpnFile(null);
    setEditingRecord(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (record: ClientAccessRecord) => {
    setEditingRecord(record);
    setFormData({
      cliente: record.cliente,
      vpn_nome: record.vpn_nome || "",
      vpn_ip_servidor: record.vpn_ip_servidor || "",
      vpn_usuario: record.vpn_usuario || "",
      vpn_senha: record.vpn_senha || "",
      servidor_so: record.servidor_so || "",
      servidor_usuario: record.servidor_usuario || "",
      servidor_senha: record.servidor_senha || "",
      docker_so: record.docker_so || "",
      docker_usuario: record.docker_usuario || "",
      docker_senha: record.docker_senha || "",
      bd_tns: record.bd_tns || "",
      bd_usuario: record.bd_usuario || "",
      bd_senha: record.bd_senha || "",
      app_nome: record.app_nome || "",
      app_usuario: record.app_usuario || "",
      app_senha: record.app_senha || "",
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="vpn">
                      <AccordionTrigger>Acesso ao Cliente via VPN</AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div>
                          <Label htmlFor="vpn_nome">Nome da VPN</Label>
                          <Input
                            id="vpn_nome"
                            value={formData.vpn_nome}
                            onChange={(e) => setFormData({ ...formData, vpn_nome: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="vpn_executavel">Upload do Executável</Label>
                          <Input
                            id="vpn_executavel"
                            type="file"
                            onChange={(e) => setVpnFile(e.target.files?.[0] || null)}
                          />
                          {editingRecord?.vpn_executavel_path && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Arquivo atual: {editingRecord.vpn_executavel_path}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="vpn_ip_servidor">IP do Servidor</Label>
                          <Input
                            id="vpn_ip_servidor"
                            value={formData.vpn_ip_servidor}
                            onChange={(e) => setFormData({ ...formData, vpn_ip_servidor: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="vpn_usuario">Usuário</Label>
                          <Input
                            id="vpn_usuario"
                            value={formData.vpn_usuario}
                            onChange={(e) => setFormData({ ...formData, vpn_usuario: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="vpn_senha">Senha</Label>
                          <Input
                            id="vpn_senha"
                            type="password"
                            value={formData.vpn_senha}
                            onChange={(e) => setFormData({ ...formData, vpn_senha: e.target.value })}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="servidor">
                      <AccordionTrigger>Servidor</AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div>
                          <Label htmlFor="servidor_so">SO do Servidor</Label>
                          <Input
                            id="servidor_so"
                            value={formData.servidor_so}
                            onChange={(e) => setFormData({ ...formData, servidor_so: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="servidor_usuario">Usuário</Label>
                          <Input
                            id="servidor_usuario"
                            value={formData.servidor_usuario}
                            onChange={(e) => setFormData({ ...formData, servidor_usuario: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="servidor_senha">Senha</Label>
                          <Input
                            id="servidor_senha"
                            type="password"
                            value={formData.servidor_senha}
                            onChange={(e) => setFormData({ ...formData, servidor_senha: e.target.value })}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="docker">
                      <AccordionTrigger>Docker</AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div>
                          <Label htmlFor="docker_so">SO do Servidor</Label>
                          <Input
                            id="docker_so"
                            value={formData.docker_so}
                            onChange={(e) => setFormData({ ...formData, docker_so: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="docker_usuario">Usuário</Label>
                          <Input
                            id="docker_usuario"
                            value={formData.docker_usuario}
                            onChange={(e) => setFormData({ ...formData, docker_usuario: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="docker_senha">Senha</Label>
                          <Input
                            id="docker_senha"
                            type="password"
                            value={formData.docker_senha}
                            onChange={(e) => setFormData({ ...formData, docker_senha: e.target.value })}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="bd">
                      <AccordionTrigger>Banco de Dados</AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div>
                          <Label htmlFor="bd_tns">TNS de Conexão</Label>
                          <Input
                            id="bd_tns"
                            value={formData.bd_tns}
                            onChange={(e) => setFormData({ ...formData, bd_tns: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="bd_usuario">Usuário</Label>
                          <Input
                            id="bd_usuario"
                            value={formData.bd_usuario}
                            onChange={(e) => setFormData({ ...formData, bd_usuario: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="bd_senha">Senha</Label>
                          <Input
                            id="bd_senha"
                            type="password"
                            value={formData.bd_senha}
                            onChange={(e) => setFormData({ ...formData, bd_senha: e.target.value })}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="app">
                      <AccordionTrigger>Aplicações</AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div>
                          <Label htmlFor="app_nome">Nome da Aplicação</Label>
                          <Input
                            id="app_nome"
                            value={formData.app_nome}
                            onChange={(e) => setFormData({ ...formData, app_nome: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="app_usuario">Usuário</Label>
                          <Input
                            id="app_usuario"
                            value={formData.app_usuario}
                            onChange={(e) => setFormData({ ...formData, app_usuario: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="app_senha">Senha</Label>
                          <Input
                            id="app_senha"
                            type="password"
                            value={formData.app_senha}
                            onChange={(e) => setFormData({ ...formData, app_senha: e.target.value })}
                          />
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
                      <Accordion type="single" collapsible>
                        {record.vpn_nome && (
                          <AccordionItem value="vpn">
                            <AccordionTrigger>VPN</AccordionTrigger>
                            <AccordionContent>
                              <Table>
                                <TableBody>
                                  <TableRow>
                                    <TableCell className="font-semibold">Nome da VPN</TableCell>
                                    <TableCell>{record.vpn_nome}</TableCell>
                                  </TableRow>
                                  {record.vpn_executavel_path && (
                                    <TableRow>
                                      <TableCell className="font-semibold">Executável</TableCell>
                                      <TableCell>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleDownloadExecutable(record.vpn_executavel_path!, record.cliente)}
                                        >
                                          <Download className="mr-2 h-4 w-4" />
                                          Download
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                  {record.vpn_ip_servidor && (
                                    <TableRow>
                                      <TableCell className="font-semibold">IP do Servidor</TableCell>
                                      <TableCell>{record.vpn_ip_servidor}</TableCell>
                                    </TableRow>
                                  )}
                                  {record.vpn_usuario && (
                                    <TableRow>
                                      <TableCell className="font-semibold">Usuário</TableCell>
                                      <TableCell>{record.vpn_usuario}</TableCell>
                                    </TableRow>
                                  )}
                                  {record.vpn_senha && (
                                    <TableRow>
                                      <TableCell className="font-semibold">Senha</TableCell>
                                      <TableCell>
                                        <PasswordField value={record.vpn_senha} recordId={record.id} field="vpn_senha" />
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </AccordionContent>
                          </AccordionItem>
                        )}

                        {record.servidor_so && (
                          <AccordionItem value="servidor">
                            <AccordionTrigger>Servidor</AccordionTrigger>
                            <AccordionContent>
                              <Table>
                                <TableBody>
                                  <TableRow>
                                    <TableCell className="font-semibold">SO do Servidor</TableCell>
                                    <TableCell>{record.servidor_so}</TableCell>
                                  </TableRow>
                                  {record.servidor_usuario && (
                                    <TableRow>
                                      <TableCell className="font-semibold">Usuário</TableCell>
                                      <TableCell>{record.servidor_usuario}</TableCell>
                                    </TableRow>
                                  )}
                                  {record.servidor_senha && (
                                    <TableRow>
                                      <TableCell className="font-semibold">Senha</TableCell>
                                      <TableCell>
                                        <PasswordField value={record.servidor_senha} recordId={record.id} field="servidor_senha" />
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </AccordionContent>
                          </AccordionItem>
                        )}

                        {record.docker_so && (
                          <AccordionItem value="docker">
                            <AccordionTrigger>Docker</AccordionTrigger>
                            <AccordionContent>
                              <Table>
                                <TableBody>
                                  <TableRow>
                                    <TableCell className="font-semibold">SO do Servidor</TableCell>
                                    <TableCell>{record.docker_so}</TableCell>
                                  </TableRow>
                                  {record.docker_usuario && (
                                    <TableRow>
                                      <TableCell className="font-semibold">Usuário</TableCell>
                                      <TableCell>{record.docker_usuario}</TableCell>
                                    </TableRow>
                                  )}
                                  {record.docker_senha && (
                                    <TableRow>
                                      <TableCell className="font-semibold">Senha</TableCell>
                                      <TableCell>
                                        <PasswordField value={record.docker_senha} recordId={record.id} field="docker_senha" />
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </AccordionContent>
                          </AccordionItem>
                        )}

                        {record.bd_tns && (
                          <AccordionItem value="bd">
                            <AccordionTrigger>Banco de Dados</AccordionTrigger>
                            <AccordionContent>
                              <Table>
                                <TableBody>
                                  <TableRow>
                                    <TableCell className="font-semibold">TNS de Conexão</TableCell>
                                    <TableCell>{record.bd_tns}</TableCell>
                                  </TableRow>
                                  {record.bd_usuario && (
                                    <TableRow>
                                      <TableCell className="font-semibold">Usuário</TableCell>
                                      <TableCell>{record.bd_usuario}</TableCell>
                                    </TableRow>
                                  )}
                                  {record.bd_senha && (
                                    <TableRow>
                                      <TableCell className="font-semibold">Senha</TableCell>
                                      <TableCell>
                                        <PasswordField value={record.bd_senha} recordId={record.id} field="bd_senha" />
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </AccordionContent>
                          </AccordionItem>
                        )}

                        {record.app_nome && (
                          <AccordionItem value="app">
                            <AccordionTrigger>Aplicações</AccordionTrigger>
                            <AccordionContent>
                              <Table>
                                <TableBody>
                                  <TableRow>
                                    <TableCell className="font-semibold">Nome da Aplicação</TableCell>
                                    <TableCell>{record.app_nome}</TableCell>
                                  </TableRow>
                                  {record.app_usuario && (
                                    <TableRow>
                                      <TableCell className="font-semibold">Usuário</TableCell>
                                      <TableCell>{record.app_usuario}</TableCell>
                                    </TableRow>
                                  )}
                                  {record.app_senha && (
                                    <TableRow>
                                      <TableCell className="font-semibold">Senha</TableCell>
                                      <TableCell>
                                        <PasswordField value={record.app_senha} recordId={record.id} field="app_senha" />
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </AccordionContent>
                          </AccordionItem>
                        )}
                      </Accordion>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
