import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { Trash2, Search, Edit, KeyRound } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const userSchema = z.object({
  nome: z.string().min(3, { message: "Nome deve ter no mínimo 3 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
  role: z.enum(["administrador", "operador"]),
});

interface UserProfile {
  id: string;
  nome: string;
  user_id: string;
  user_roles: {
    role: string;
  }[];
}

export default function Administracao() {
  const navigate = useNavigate();
  const { user, userRole, loading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editFormData, setEditFormData] = useState({ nome: "", role: "operador" as "administrador" | "operador" });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    password: "",
    role: "operador" as "administrador" | "operador",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && (!user || userRole !== "administrador")) {
      navigate("/");
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    if (user && userRole === "administrador") {
      fetchUsers();
    }
  }, [user, userRole]);

  const fetchUsers = async () => {
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("*");

    if (profilesError) {
      toast.error("Erro ao carregar usuários");
      return;
    }

    const { data: rolesData, error: rolesError } = await supabase
      .from("user_roles")
      .select("*");

    if (rolesError) {
      toast.error("Erro ao carregar roles");
      return;
    }

    const usersWithRoles = (profilesData || []).map((profile) => ({
      ...profile,
      user_roles: rolesData?.filter((role) => role.user_id === profile.user_id) || [],
    }));

    setUsers(usersWithRoles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const validatedData = userSchema.parse(formData);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            nome: validatedData.nome,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: authData.user.id,
            role: validatedData.role,
          });

        if (roleError) throw roleError;

        toast.success("Usuário cadastrado com sucesso!");
        setFormData({ nome: "", email: "", password: "", role: "operador" });
        fetchUsers();
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Erro ao cadastrar usuário");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Deseja realmente excluir este usuário?")) return;

    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      toast.error("Erro ao excluir usuário");
      return;
    }

    toast.success("Usuário excluído com sucesso!");
    fetchUsers();
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleEditUser = () => {
    if (selectedUsers.size !== 1) {
      toast.error("Selecione apenas um usuário para editar");
      return;
    }
    const userId = Array.from(selectedUsers)[0];
    const userToEdit = users.find(u => u.user_id === userId);
    if (userToEdit) {
      setEditingUser(userToEdit);
      setEditFormData({
        nome: userToEdit.nome,
        role: userToEdit.user_roles?.[0]?.role as "administrador" | "operador" || "operador"
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setSubmitting(true);

    try {
      // Atualizar perfil
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ nome: editFormData.nome })
        .eq("user_id", editingUser.user_id);

      if (profileError) throw profileError;

      // Atualizar role
      const { error: roleError } = await supabase
        .from("user_roles")
        .update({ role: editFormData.role })
        .eq("user_id", editingUser.user_id);

      if (roleError) throw roleError;

      toast.success("Usuário atualizado com sucesso!");
      setIsEditDialogOpen(false);
      setSelectedUsers(new Set());
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar usuário");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = () => {
    if (selectedUsers.size !== 1) {
      toast.error("Selecione apenas um usuário para redefinir a senha");
      return;
    }
    setNewPassword("");
    setIsResetPasswordDialogOpen(true);
  };

  const handleConfirmResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    const userId = Array.from(selectedUsers)[0];
    setSubmitting(true);

    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (error) throw error;

      toast.success("Senha redefinida com sucesso!");
      setIsResetPasswordDialogOpen(false);
      setSelectedUsers(new Set());
      setNewPassword("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao redefinir senha");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          Carregando...
        </div>
      </Layout>
    );
  }

  if (!user || userRole !== "administrador") {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-8">
        <h1 className="text-3xl font-bold">Administração de Usuários</h1>

        <Card>
          <CardHeader>
            <CardTitle>Cadastrar Novo Usuário</CardTitle>
            <CardDescription>
              Adicione novos usuários ao sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Pessoa</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Tipo de Usuário</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: "administrador" | "operador") =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="administrador">Administrador</SelectItem>
                      <SelectItem value="operador">Operador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" disabled={submitting}>
                {submitting ? "Cadastrando..." : "Cadastrar Usuário"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usuários Cadastrados</CardTitle>
            <CardDescription>
              Gerencie os usuários do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                onClick={handleEditUser}
                disabled={selectedUsers.size !== 1}
                variant="outline"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button
                onClick={handleResetPassword}
                disabled={selectedUsers.size !== 1}
                variant="outline"
              >
                <KeyRound className="h-4 w-4 mr-2" />
                Redefinir Senha
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.has(user.user_id)}
                        onCheckedChange={() => handleSelectUser(user.user_id)}
                      />
                    </TableCell>
                    <TableCell>{user.nome}</TableCell>
                    <TableCell>
                      {user.user_roles?.[0]?.role === "administrador"
                        ? "Administrador"
                        : "Operador"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(user.user_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Atualize os dados do usuário selecionado
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nome">Nome</Label>
                <Input
                  id="edit-nome"
                  value={editFormData.nome}
                  onChange={(e) => setEditFormData({ ...editFormData, nome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Tipo de Usuário</Label>
                <Select
                  value={editFormData.role}
                  onValueChange={(value: "administrador" | "operador") =>
                    setEditFormData({ ...editFormData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrador">Administrador</SelectItem>
                    <SelectItem value="operador">Operador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateUser} disabled={submitting} className="flex-1">
                  {submitting ? "Salvando..." : "Salvar"}
                </Button>
                <Button
                  onClick={() => setIsEditDialogOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Redefinir Senha</DialogTitle>
              <DialogDescription>
                Defina uma nova senha para o usuário selecionado
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleConfirmResetPassword} disabled={submitting} className="flex-1">
                  {submitting ? "Redefinindo..." : "Redefinir Senha"}
                </Button>
                <Button
                  onClick={() => setIsResetPasswordDialogOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
