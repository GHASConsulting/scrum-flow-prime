import { Card } from '@/components/ui/card';
import { Target, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface RoadmapKPIsProps {
  total: number;
  concluidos: number;
  percentualConcluido: number;
  tempoMedioReal: number;
  atrasoMedio: number;
}

export const RoadmapKPIs = ({
  total,
  concluidos,
  percentualConcluido,
  tempoMedioReal,
  atrasoMedio,
}: RoadmapKPIsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Target className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Total de KRs</p>
            <p className="text-2xl font-bold">{total}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-8 w-8 text-green-600" />
          <div>
            <p className="text-sm text-muted-foreground">Concluídos</p>
            <p className="text-2xl font-bold">{concluidos}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Target className="h-8 w-8 text-blue-600" />
          <div>
            <p className="text-sm text-muted-foreground">% Concluído</p>
            <p className="text-2xl font-bold">{percentualConcluido}%</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Clock className="h-8 w-8 text-orange-600" />
          <div>
            <p className="text-sm text-muted-foreground">Tempo Médio</p>
            <p className="text-2xl font-bold">{tempoMedioReal}d</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-red-600" />
          <div>
            <p className="text-sm text-muted-foreground">Atraso Médio</p>
            <p className="text-2xl font-bold">{atrasoMedio}d</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
