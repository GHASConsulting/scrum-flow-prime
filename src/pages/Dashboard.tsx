import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { CheckCircle2, Circle, Clock, Star, Users } from 'lucide-react';
import { useSprints } from '@/hooks/useSprints';
import { useSprintTarefas } from '@/hooks/useSprintTarefas';
import { useBacklog } from '@/hooks/useBacklog';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Dashboard = () => {
  const { sprints } = useSprints();
  const { sprintTarefas } = useSprintTarefas();
  const { backlog } = useBacklog();
  
  const [metrics, setMetrics] = useState({
    total: 0,
    todo: 0,
    doing: 0,
    done: 0,
    validated: 0,
    totalSP: 0
  });

  const [burndownData, setBurndownData] = useState<any[]>([]);
  const [responsibleStats, setResponsibleStats] = useState<any[]>([]);
  const [totalSprintSP, setTotalSprintSP] = useState<number>(0);

  useEffect(() => {
    // Métricas gerais do backlog
    const total = backlog.length;
    const todo = backlog.filter(i => i.status === 'todo').length;
    const doing = backlog.filter(i => i.status === 'doing').length;
    const done = backlog.filter(i => i.status === 'done').length;
    const validated = backlog.filter(i => i.status === 'validated').length;
    const totalSP = backlog.reduce((sum, i) => sum + i.story_points, 0);

    setMetrics({ total, todo, doing, done, validated, totalSP });

    // Encontrar sprint ativa
    const activeSprint = sprints.find(s => s.status === 'ativo');
    
    if (activeSprint) {
      // Calcular burndown
      const startDate = new Date(activeSprint.data_inicio);
      const endDate = new Date(activeSprint.data_fim);
      const totalDays = differenceInDays(endDate, startDate) + 1;
      
      // Tarefas da sprint ativa
      const sprintTasks = sprintTarefas.filter(t => t.sprint_id === activeSprint.id);
      const sprintSP = sprintTasks.reduce((sum, t) => {
        const task = backlog.find(b => b.id === t.backlog_id);
        return sum + (task?.story_points || 0);
      }, 0);
      
      setTotalSprintSP(sprintSP);

      // Gerar dados do burndown
      const burndown = [];
      for (let i = 0; i <= totalDays; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const idealizado = sprintSP - (sprintSP / totalDays) * i;
        
        // Calcular pontos completados até esta data (excluindo validados)
        const completedTasks = sprintTasks.filter(t => 
          t.status === 'validated'
        );
        const completedSP = completedTasks.reduce((sum, t) => {
          const task = backlog.find(b => b.id === t.backlog_id);
          return sum + (task?.story_points || 0);
        }, 0);
        const real = sprintSP - completedSP;

        burndown.push({
          dia: format(currentDate, 'dd/MM', { locale: ptBR }),
          idealizado: Math.max(0, Math.round(idealizado)),
          real: Math.max(0, Math.round(real))
        });
      }
      
      setBurndownData(burndown);

      // Estatísticas por responsável
      const responsibleMap = new Map();
      
      sprintTasks.forEach(t => {
        const responsible = t.responsavel || 'Não atribuído';
        if (!responsibleMap.has(responsible)) {
          responsibleMap.set(responsible, {
            name: responsible,
            todo: 0,
            doing: 0,
            done: 0,
            validated: 0
          });
        }
        
        const stats = responsibleMap.get(responsible);
        stats[t.status]++;
      });

      setResponsibleStats(Array.from(responsibleMap.values()));
    } else {
      setBurndownData([]);
      setResponsibleStats([]);
      setTotalSprintSP(0);
    }
  }, [backlog, sprints, sprintTarefas]);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground mt-1">Visão geral do projeto</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">A Fazer</CardTitle>
              <Circle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.todo}</div>
              <p className="text-xs text-muted-foreground">tarefas pendentes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Fazendo</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.doing}</div>
              <p className="text-xs text-muted-foreground">em progresso</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Feito</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.done}</div>
              <p className="text-xs text-muted-foreground">concluídas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Story Points</CardTitle>
              <Star className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalSP}</div>
              <p className="text-xs text-muted-foreground">total do backlog</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Burndown Chart - Sprint Ativa</CardTitle>
          </CardHeader>
          <CardContent>
            {burndownData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={burndownData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" label={{ value: 'Período da Sprint', position: 'insideBottom', offset: -5 }} />
                  <YAxis 
                    label={{ value: 'Story Points', angle: -90, position: 'insideLeft' }} 
                    domain={[0, totalSprintSP]}
                  />
                  <Tooltip />
                  <Line type="monotone" dataKey="idealizado" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" name="Idealizado" />
                  <Line type="monotone" dataKey="real" stroke="hsl(var(--primary))" strokeWidth={2} name="Real" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nenhuma sprint ativa encontrada
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Tarefas por Responsável</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {responsibleStats.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={responsibleStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="todo" fill="hsl(var(--muted-foreground))" name="A Fazer" />
                    <Bar dataKey="doing" fill="hsl(var(--warning))" name="Fazendo" />
                    <Bar dataKey="done" fill="hsl(var(--success))" name="Feito" />
                    <Bar dataKey="validated" fill="hsl(var(--primary))" name="Validado" />
                  </BarChart>
                </ResponsiveContainer>
                
                <div className="mt-6 space-y-4">
                  {responsibleStats.map((stat) => (
                    <div key={stat.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{stat.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {stat.todo + stat.doing + stat.done + stat.validated} tarefas
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Circle className="h-3 w-3" />
                          <span>{stat.todo} A Fazer</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-warning" />
                          <span>{stat.doing} Fazendo</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-success" />
                          <span>{stat.done} Feito</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="h-3 w-3 text-primary" />
                          <span>{stat.validated} Validado</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nenhuma tarefa na sprint ativa
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
