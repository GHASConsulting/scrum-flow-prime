import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Tables } from '@/integrations/supabase/types';
import { CronogramaTreeGrid } from './CronogramaTreeGrid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GanttChart } from './GanttChart';

type Project = Tables<'project'>;

interface CronogramaTabProps {
  projectId: string | null;
  projects: Project[];
  onSelectProject: (id: string) => void;
}

export function CronogramaTab({ projectId, projects, onSelectProject }: CronogramaTabProps) {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="space-y-2">
          <Label>Selecione um Projeto</Label>
          <Select value={projectId || ''} onValueChange={onSelectProject}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um projeto..." />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {projectId ? (
        <Tabs defaultValue="tabela" className="w-full">
          <TabsList>
            <TabsTrigger value="tabela">Tabela</TabsTrigger>
            <TabsTrigger value="gantt">Gantt</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tabela">
            <CronogramaTreeGrid projectId={projectId} />
          </TabsContent>
          
          <TabsContent value="gantt">
            <GanttChart projectId={projectId} />
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Selecione um projeto para visualizar o cronograma</p>
        </Card>
      )}
    </div>
  );
}
