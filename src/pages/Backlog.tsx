import { Layout } from '@/components/Layout';
import { useBacklog } from '@/hooks/useBacklog';
import { useSprintTarefas } from '@/hooks/useSprintTarefas';
import { useSprints } from '@/hooks/useSprints';
import { useAuth } from '@/hooks/useAuth';
import { useProfiles } from '@/hooks/useProfiles';
import { Status, BacklogItem } from '@/types/scrum';
import { statusLabels } from '@/lib/formatters';
import { BacklogCard } from '@/components/BacklogCard';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';

const Backlog = () => {
  const { backlog, updateBacklogItem, deleteBacklogItem } = useBacklog();
  const { sprintTarefas } = useSprintTarefas();
  const { sprints } = useSprints();
  const { user, userRole } = useAuth();
  const { profiles } = useProfiles();
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  const [selectedResponsavel, setSelectedResponsavel] = useState<string>('');

  // Sprints disponíveis para filtro (planejamento ou concluído)
  const availableSprints = sprints.filter(s => s.status === 'planejamento' || s.status === 'concluido');
  
  // Sprint ativo
  const activeSprint = sprints.find(s => s.status === 'ativo');

  // Definir sprint ativo como padrão ao carregar
  useEffect(() => {
    if (activeSprint && !selectedSprintId) {
      setSelectedSprintId(activeSprint.id);
    }
  }, [activeSprint, selectedSprintId]);

  // Definir responsável padrão para operadores
  useEffect(() => {
    if (userRole === 'operador' && user && profiles.length > 0) {
      const userProfile = profiles.find(p => p.user_id === user.id);
      if (userProfile) {
        setSelectedResponsavel(userProfile.nome);
      }
    }
  }, [userRole, user, profiles]);

  // Filtrar tarefas do sprint selecionado
  let tarefasNasSprints: BacklogItem[] = backlog
    .filter(item => sprintTarefas.some(st => st.backlog_id === item.id && st.sprint_id === selectedSprintId))
    .map(item => ({
      id: item.id,
      titulo: item.titulo,
      descricao: item.descricao || '',
      story_points: item.story_points,
      prioridade: item.prioridade as 'baixa' | 'media' | 'alta',
      status: item.status as Status,
      responsavel: item.responsavel || ''
    }));

  // Aplicar filtro por responsável (ignorar se for "all")
  if (selectedResponsavel && selectedResponsavel !== 'all') {
    tarefasNasSprints = tarefasNasSprints.filter(item => item.responsavel === selectedResponsavel);
  }

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
          <div className="flex gap-3">
            <div className="w-64">
              <Select 
                value={selectedResponsavel || 'all'} 
                onValueChange={setSelectedResponsavel}
                disabled={userRole === 'operador'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {profiles.map(profile => (
                    <SelectItem key={profile.id} value={profile.nome}>
                      {profile.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-64">
              <Select value={selectedSprintId} onValueChange={setSelectedSprintId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma sprint" />
                </SelectTrigger>
                <SelectContent>
                  {activeSprint && (
                    <SelectItem value={activeSprint.id}>
                      {activeSprint.nome} (Ativo)
                    </SelectItem>
                  )}
                  {availableSprints.map(sprint => (
                    <SelectItem key={sprint.id} value={sprint.id}>
                      {sprint.nome} ({sprint.status === 'planejamento' ? 'Planejamento' : 'Encerrado'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                        onDelete={deleteBacklogItem}
                        userRole={userRole}
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
