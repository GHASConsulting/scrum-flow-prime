import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { CronogramaTab } from '@/components/projetos/CronogramaTab';
import { ProjetosListTab } from '@/components/projetos/ProjetosListTab';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Projetos() {
  const { projects, addProject, loading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    status: 'planejamento' as const,
    data_inicio: null,
    data_fim: null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newProject = await addProject(formData);
      setSelectedProjectId(newProject.id);
      setIsDialogOpen(false);
      setFormData({ nome: '', descricao: '', status: 'planejamento', data_inicio: null, data_fim: null });
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Projetos</h1>
            <p className="text-muted-foreground">Gerencie projetos e cronogramas</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Projeto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Projeto</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Projeto</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao || ''}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planejamento">Planejamento</SelectItem>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Criar Projeto</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="lista" className="w-full">
          <TabsList>
            <TabsTrigger value="lista">Lista de Projetos</TabsTrigger>
            <TabsTrigger value="cronograma">Cronograma</TabsTrigger>
          </TabsList>
          
          <TabsContent value="lista">
            <ProjetosListTab
              projects={projects}
              loading={loading}
              selectedProjectId={selectedProjectId}
              onSelectProject={setSelectedProjectId}
            />
          </TabsContent>
          
          <TabsContent value="cronograma">
            <CronogramaTab
              projectId={selectedProjectId}
              projects={projects}
              onSelectProject={setSelectedProjectId}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
