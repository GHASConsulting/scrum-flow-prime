import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Daily = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Daily</h2>
          <p className="text-muted-foreground mt-1">Acompanhamento diário do time</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daily Standup</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Funcionalidade de Daily em desenvolvimento...
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Daily;
