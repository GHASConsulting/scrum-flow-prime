import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Activity, CheckCircle, XCircle, Clock, Info } from "lucide-react";
import { useAvaEventos } from "@/hooks/useAvaEventos";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

const DadosAVA = () => {
  const { eventos, isLoading, deleteEvento } = useAvaEventos();
  const [filter, setFilter] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'error':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const filteredEventos = filter 
    ? eventos.filter(e => e.ie_status === filter)
    : eventos;

  // Estatísticas
  const stats = {
    total: eventos.length,
    success: eventos.filter(e => e.ie_status === 'success').length,
    error: eventos.filter(e => e.ie_status === 'error').length,
    pending: eventos.filter(e => e.ie_status === 'pending').length,
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dados AVA</h1>
          <p className="text-muted-foreground">
            Painel de indicadores alimentado pelo BotConversa
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setFilter(filter === 'success' ? null : 'success')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sucesso</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.success}</div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setFilter(filter === 'error' ? null : 'error')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Erros</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.error}</div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setFilter(filter === 'pending' ? null : 'pending')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendente</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
        </div>

        {filter && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtrado por:</span>
            <Badge variant={getStatusVariant(filter)}>{filter}</Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setFilter(null)}
            >
              Limpar filtro
            </Button>
          </div>
        )}

        {/* Lista de eventos */}
        <Card>
          <CardHeader>
            <CardTitle>Eventos Recentes</CardTitle>
            <CardDescription>
              Atualizações em tempo real dos eventos do BotConversa
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredEventos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum evento encontrado
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEventos.map((evento) => (
                  <div
                    key={evento.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge variant={getStatusVariant(evento.ie_status)} className="flex items-center gap-1">
                          {getStatusIcon(evento.ie_status)}
                          {evento.ie_status}
                        </Badge>
                        <span className="font-semibold">{evento.nm_cliente}</span>
                        <Badge variant="outline">{evento.ds_tipo}</Badge>
                      </div>
                      
                      {evento.ds_descricao && (
                        <p className="text-sm text-muted-foreground">
                          {evento.ds_descricao}
                        </p>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(evento.dt_registro), "PPpp", { locale: ptBR })}
                      </div>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir evento?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O evento será permanentemente excluído.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteEvento(evento.id)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default DadosAVA;
