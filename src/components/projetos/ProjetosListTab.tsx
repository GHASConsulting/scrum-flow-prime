import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Tables } from '@/integrations/supabase/types';
import { formatDate } from '@/lib/formatters';

type Project = Tables<'project'>;

interface ProjetosListTabProps {
  projects: Project[];
  loading: boolean;
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
}

const statusColors: Record<string, string> = {
  planejamento: 'bg-yellow-500',
  ativo: 'bg-green-500',
  concluido: 'bg-blue-500',
  cancelado: 'bg-red-500',
};

const statusLabels: Record<string, string> = {
  planejamento: 'Planejamento',
  ativo: 'Ativo',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

export function ProjetosListTab({ projects, loading, selectedProjectId, onSelectProject }: ProjetosListTabProps) {
  if (loading) {
    return <div className="text-center py-8">Carregando projetos...</div>;
  }

  if (projects.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Nenhum projeto encontrado. Crie um novo projeto para começar.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Card
          key={project.id}
          className={`p-4 cursor-pointer hover:shadow-lg transition-shadow ${
            selectedProjectId === project.id ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => onSelectProject(project.id)}
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-lg">{project.nome}</h3>
              <Badge className={statusColors[project.status || 'planejamento']}>
                {statusLabels[project.status || 'planejamento']}
              </Badge>
            </div>
            {project.descricao && (
              <p className="text-sm text-muted-foreground line-clamp-2">{project.descricao}</p>
            )}
            <div className="text-xs text-muted-foreground space-y-1">
              {project.data_inicio && (
                <div>Início: {formatDate(project.data_inicio)}</div>
              )}
              {project.data_fim && (
                <div>Fim: {formatDate(project.data_fim)}</div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
