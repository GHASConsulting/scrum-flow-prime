import { Card } from '@/components/ui/card';
import { useScheduleTasks } from '@/hooks/useScheduleTasks';
import { format, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

interface GanttChartProps {
  projectId: string;
}

const TIMEZONE = 'America/Sao_Paulo';

export function GanttChart({ projectId }: GanttChartProps) {
  const { tasks, loading } = useScheduleTasks(projectId);

  if (loading) {
    return <Card className="p-8 text-center">Carregando gráfico de Gantt...</Card>;
  }

  if (tasks.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Nenhuma tarefa encontrada para exibir no Gantt.</p>
      </Card>
    );
  }

  // Encontrar datas mínima e máxima
  const dates = tasks
    .filter(t => t.start_at && t.end_at)
    .flatMap(t => [new Date(t.start_at!), new Date(t.end_at!)]);

  if (dates.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Adicione datas às tarefas para visualizar o Gantt.</p>
      </Card>
    );
  }

  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

  const startDate = startOfMonth(minDate);
  const endDate = endOfMonth(maxDate);
  const dayRange = eachDayOfInterval({ start: startDate, end: endDate });
  const totalDays = dayRange.length;

  const today = new Date();

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Gráfico de Gantt</h3>
        
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Cabeçalho com datas */}
            <div className="flex border-b">
              <div className="w-[200px] p-2 font-semibold border-r bg-muted/50">Tarefa</div>
              <div className="flex-1 flex">
                {dayRange.map((day, index) => {
                  const dayDate = toZonedTime(day, TIMEZONE);
                  const isCurrentDay = isToday(dayDate);
                  return (
                    <div
                      key={index}
                      className={`flex-1 min-w-[40px] p-2 text-xs text-center border-r ${
                        isCurrentDay ? 'bg-primary/10' : ''
                      }`}
                    >
                      {format(dayDate, 'dd/MM')}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Linhas de tarefas */}
            {tasks.map((task) => {
              if (!task.start_at || !task.end_at) return null;

              const taskStart = new Date(task.start_at);
              const taskEnd = new Date(task.end_at);
              const startOffset = differenceInDays(taskStart, startDate);
              const duration = differenceInDays(taskEnd, taskStart) + 1;
              const isOverdue = taskEnd < today && task.is_summary === false;

              return (
                <div key={task.id} className="flex border-b hover:bg-muted/30">
                  <div className={`w-[200px] p-2 border-r truncate ${task.is_summary ? 'font-bold' : ''}`}>
                    {task.name}
                  </div>
                  <div className="flex-1 relative" style={{ height: '40px' }}>
                    <div
                      className={`absolute h-6 top-1 rounded ${
                        isOverdue
                          ? 'bg-destructive'
                          : task.is_summary
                          ? 'bg-primary/80'
                          : 'bg-primary/60'
                      }`}
                      style={{
                        left: `${(startOffset / totalDays) * 100}%`,
                        width: `${(duration / totalDays) * 100}%`,
                        minWidth: '4px',
                      }}
                      title={`${task.name}: ${format(taskStart, 'dd/MM/yyyy')} - ${format(taskEnd, 'dd/MM/yyyy')}`}
                    />
                    {/* Linha do hoje */}
                    {dayRange.some(d => isToday(toZonedTime(d, TIMEZONE))) && (
                      <div
                        className="absolute top-0 bottom-0 w-px bg-destructive z-10"
                        style={{
                          left: `${(differenceInDays(today, startDate) / totalDays) * 100}%`,
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary/60 rounded" />
            <span>Tarefa</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary/80 rounded" />
            <span>Resumo/Fase</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-destructive rounded" />
            <span>Atrasada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-px h-4 bg-destructive" />
            <span>Hoje</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
