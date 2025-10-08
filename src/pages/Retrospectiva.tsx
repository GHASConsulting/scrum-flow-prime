import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Retrospectiva = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Retrospectiva</h2>
          <p className="text-muted-foreground mt-1">Reflita sobre a sprint e identifique melhorias</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Retrospectiva da Sprint</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Funcionalidade de Retrospectiva em desenvolvimento...
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Retrospectiva;
