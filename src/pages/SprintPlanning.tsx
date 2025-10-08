import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SprintPlanning = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Sprint Planning</h2>
          <p className="text-muted-foreground mt-1">Planeje a próxima sprint</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Planejamento da Sprint</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Funcionalidade de Sprint Planning em desenvolvimento...
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SprintPlanning;
