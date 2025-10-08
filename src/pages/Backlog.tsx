import { Layout } from '@/components/Layout';
import { useBacklog } from '@/hooks/useBacklog';
import { useSprintTarefas } from '@/hooks/useSprintTarefas';
import { Status, BacklogItem } from '@/types/scrum';
import { statusLabels } from '@/lib/formatters';
import { BacklogCard } from '@/components/BacklogCard';
import { toast } from 'sonner';

const Backlog = () => {
  const { backlog, updateBacklogItem } = useBacklog();
  const { sprintTarefas } = useSprintTarefas();

  // Filtrar apenas tarefas que estão em sprints e converter para o tipo correto
  const tarefasNasSprints: BacklogItem[] = backlog
    .filter(item => sprintTarefas.some(st => st.backlog_id === item.id))
    .map(item => ({
      id: item.id,
      titulo: item.titulo,
      descricao: item.descricao || '',
      story_points: item.story_points,
      prioridade: item.prioridade as 'baixa' | 'media' | 'alta',
      status: item.status as Status,
      responsavel: item.responsavel || ''
    }));

  const handleStatusChange = async (id: string, newStatus: Status) => {
    try {
      await updateBacklogItem(id, { status: newStatus });
      toast.success(`Status atualizado para ${statusLabels[newStatus]}`);
    } catch (error) {
      // Error já tratado no hook
    }
  };

  const statusColumns: Status[] = ['todo', 'doing', 'done', 'validated'];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Backlog</h2>
            <p className="text-muted-foreground mt-1">Tarefas das sprints organizadas por status</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(['todo', 'doing', 'done', 'validated'] as Status[]).map((status) => {
            const items = tarefasNasSprints.filter(item => item.status === status);
            return (
              <div key={status} className="space-y-3">
                <div className="bg-secondary rounded-lg p-3">
                  <h3 className="font-semibold text-foreground">{statusLabels[status]}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{items.length} tarefa(s)</p>
                </div>
                <div className="space-y-3">
                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma tarefa
                    </p>
                  ) : (
                    items.map((item) => (
                      <BacklogCard
                        key={item.id}
                        item={item}
                        onStatusChange={handleStatusChange}
                        onUpdate={() => {}}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default Backlog;
