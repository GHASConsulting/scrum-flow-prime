import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Activity, CheckCircle, XCircle, Clock, Info, Filter, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
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
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [clienteFilter, setClienteFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

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

  // Lista de clientes únicos
  const clientes = useMemo(() => {
    const uniqueClientes = Array.from(new Set(eventos.map(e => e.nm_cliente))).sort();
    return uniqueClientes;
  }, [eventos]);

  // Aplicar filtros
  const filteredEventos = useMemo(() => {
    return eventos.filter(evento => {
      // Filtro de status
      if (statusFilter && evento.ie_status !== statusFilter) return false;
      
      // Filtro de cliente
      if (clienteFilter !== "all" && evento.nm_cliente !== clienteFilter) return false;
      
      // Filtro de data
      if (dateRange?.from) {
        const eventoDate = new Date(evento.dt_registro);
        eventoDate.setHours(0, 0, 0, 0);
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        
        if (eventoDate < fromDate) return false;
        
        if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          if (eventoDate > toDate) return false;
        }
      }
      
      return true;
    });
  }, [eventos, statusFilter, clienteFilter, dateRange]);

  // Estatísticas baseadas nos eventos filtrados
  const stats = useMemo(() => {
    const duvidas = filteredEventos.filter(e => e.ds_tipo?.toLowerCase().includes('dúvida') || e.ds_tipo?.toLowerCase().includes('duvida'));
    const duvidasSolucionadas = duvidas.filter(e => e.ie_status === 'success');
    const alteracaoSenha = filteredEventos.filter(e => e.ds_tipo?.toLowerCase().includes('senha'));
    const alteracaoSenhaSolucionadas = alteracaoSenha.filter(e => e.ie_status === 'success');

    return {
      total: filteredEventos.length,
      duvidas: duvidas.length,
      duvidasSolucionadas: duvidasSolucionadas.length,
      alteracaoSenha: alteracaoSenha.length,
      alteracaoSenhaSolucionadas: alteracaoSenhaSolucionadas.length,
    };
  }, [filteredEventos]);

  const clearFilters = () => {
    setStatusFilter(null);
    setClienteFilter("all");
    setDateRange(undefined);
  };

  const hasActiveFilters = statusFilter || clienteFilter !== "all" || dateRange?.from;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dados AVA</h1>
          <p className="text-muted-foreground">
            Painel de indicadores alimentado pelo BotConversa
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {/* Filtro de Cliente */}
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Cliente</label>
                <Select value={clienteFilter} onValueChange={setClienteFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os clientes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os clientes</SelectItem>
                    {clientes.map(cliente => (
                      <SelectItem key={cliente} value={cliente}>
                        {cliente}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Data */}
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Período</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange?.from && "text-muted-foreground"
                      )}
                    >
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                            {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                          </>
                        ) : (
                          format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                        )
                      ) : (
                        <span>Selecione o período</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      locale={ptBR}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Botão Limpar */}
              {hasActiveFilters && (
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={clearFilters}
                    title="Limpar filtros"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dúvidas</CardTitle>
              <Info className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.duvidas}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dúvidas Solucionadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.duvidasSolucionadas}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alteração de Senha</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.alteracaoSenha}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Senhas Solucionadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.alteracaoSenhaSolucionadas}</div>
            </CardContent>
          </Card>
        </div>

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
