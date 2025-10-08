import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getBacklog, getSprintTarefas, getSprints, initializeData } from '@/lib/storage';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle2, Circle, Clock, Star } from 'lucide-react';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    total: 0,
    todo: 0,
    doing: 0,
    done: 0,
    validated: 0,
    totalSP: 0
  });

  useEffect(() => {
    initializeData();
    
    const backlog = getBacklog();
    const total = backlog.length;
    const todo = backlog.filter(i => i.status === 'todo').length;
    const doing = backlog.filter(i => i.status === 'doing').length;
    const done = backlog.filter(i => i.status === 'done').length;
    const validated = backlog.filter(i => i.status === 'validated').length;
    const totalSP = backlog.reduce((sum, i) => sum + i.story_points, 0);

    setMetrics({ total, todo, doing, done, validated, totalSP });
  }, []);

  const burndownData = [
    { dia: 1, idealizado: 100, real: 100 },
    { dia: 3, idealizado: 85, real: 92 },
    { dia: 5, idealizado: 70, real: 78 },
    { dia: 7, idealizado: 55, real: 65 },
    { dia: 9, idealizado: 40, real: 48 },
    { dia: 11, idealizado: 25, real: 30 },
    { dia: 13, idealizado: 10, real: 15 },
    { dia: 15, idealizado: 0, real: 0 },
  ];

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
            <CardTitle>Burndown Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={burndownData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" label={{ value: 'Dia da Sprint', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Story Points', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Line type="monotone" dataKey="idealizado" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" name="Idealizado" />
                <Line type="monotone" dataKey="real" stroke="hsl(var(--primary))" strokeWidth={2} name="Real" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
