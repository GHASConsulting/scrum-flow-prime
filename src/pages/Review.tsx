import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Review = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Review</h2>
          <p className="text-muted-foreground mt-1">Revise o trabalho realizado na sprint</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sprint Review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Funcionalidade de Review em desenvolvimento...
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Review;
