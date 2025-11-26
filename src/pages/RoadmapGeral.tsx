import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { useRoadmapTarefas } from '@/hooks/useRoadmapTarefas';
import { RoadmapKPIs } from '@/components/roadmap/RoadmapKPIs';
import { RoadmapFilters } from '@/components/roadmap/RoadmapFilters';
import { RoadmapTable } from '@/components/roadmap/RoadmapTable';
import { RoadmapExport } from '@/components/roadmap/RoadmapExport';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RoadmapGeral() {
  const { tarefas, loading } = useRoadmapTarefas();
  const navigate = useNavigate();
  
  const [searchTarefa, setSearchTarefa] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [responsavelFilter, setResponsavelFilter] = useState('todos');
  const [tipoFilter, setTipoFilter] = useState('todos');
  
  const [produtosExpanded, setProdutosExpanded] = useState(true);
  const [ghasExpanded, setGhasExpanded] = useState(true);
  const [innovemedExpanded, setInnovemedExpanded] = useState(true);

  const filteredItems = useMemo(() => {
    return tarefas.filter(item => {
      const matchTarefa = item.titulo.toLowerCase().includes(searchTarefa.toLowerCase());
      
      let itemStatus = 'NAO_INICIADO';
      if (item.subtarefas.length > 0) {
        const concluidas = item.subtarefas.filter(s => s.status === 'done' || s.status === 'validated').length;
        if (concluidas === item.subtarefas.length) itemStatus = 'DESENVOLVIDO';
        else if (concluidas > 0) itemStatus = 'EM_DESENVOLVIMENTO';
      }
      
      const matchStatus = statusFilter === 'todos' || itemStatus === statusFilter;
      const matchResponsavel = responsavelFilter === 'todos' || item.responsavel === responsavelFilter;
      const matchTipo = tipoFilter === 'todos' || item.tipo_produto === tipoFilter;
      
      return matchTarefa && matchStatus && matchResponsavel && matchTipo;
    });
  }, [tarefas, searchTarefa, statusFilter, responsavelFilter, tipoFilter]);

  const produtos = useMemo(() => filteredItems.filter(i => i.tipo_produto === 'Produto'), [filteredItems]);
  const ghas = useMemo(() => filteredItems.filter(i => i.tipo_produto === 'Projeto GHAS'), [filteredItems]);
  const inovemed = useMemo(() => filteredItems.filter(i => i.tipo_produto === 'Projeto Inovemed'), [filteredItems]);

  const calculateKPIsForItems = (items: typeof tarefas) => {
    const total = items.length;
    const concluidos = items.filter(item => {
      const concluidasCount = item.subtarefas.filter(s => s.status === 'done' || s.status === 'validated').length;
      return item.subtarefas.length > 0 && concluidasCount === item.subtarefas.length;
    }).length;
    
    return {
      total,
      concluidos,
      percentualConcluido: total > 0 ? Math.round((concluidos / total) * 100) : 0,
      tempoMedioReal: 0,
      atrasoMedio: 0,
    };
  };

  const kpisProdutos = calculateKPIsForItems(produtos);
  const kpisGhas = calculateKPIsForItems(ghas);
  const kpisInovemed = calculateKPIsForItems(inovemed);
  const kpisGeral = calculateKPIsForItems(filteredItems);

  const responsaveisUnicos = useMemo(() => {
    const responsaveis = new Set<string>();
    tarefas.forEach(item => {
      if (item.responsavel) responsaveis.add(item.responsavel);
      item.subtarefas.forEach(sub => {
        if (sub.responsavel) responsaveis.add(sub.responsavel);
      });
    });
    return Array.from(responsaveis).sort();
  }, [tarefas]);

  const handleClearFilters = () => {
    setSearchTarefa('');
    setStatusFilter('todos');
    setResponsavelFilter('todos');
    setTipoFilter('todos');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando roadmap...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Roadmap Geral</h1>
            <p className="text-muted-foreground">Visão completa de todas as tarefas e projetos</p>
          </div>
        </div>

        <RoadmapKPIs {...kpisGeral} />

        <RoadmapFilters
          searchKR={searchTarefa}
          onSearchKRChange={setSearchTarefa}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          atorFilter={responsavelFilter}
          onAtorFilterChange={setResponsavelFilter}
          tipoFilter={tipoFilter}
          onTipoFilterChange={setTipoFilter}
          onClearFilters={handleClearFilters}
          atoresUnicos={responsaveisUnicos}
          showTipoFilter={true}
        />

        {/* Produtos Section */}
        <Card className="border-green-200">
          <CardHeader className="bg-green-50">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  🟩 Produtos
                  <span className="text-sm text-muted-foreground ml-4">
                    ({kpisProdutos.total} KRs • {kpisProdutos.percentualConcluido}% concluídos)
                  </span>
                </CardTitle>
              </div>
              <div className="flex gap-2">
                <RoadmapExport items={produtos as any} titulo="Roadmap_Produtos" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/roadmap/produtos')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visão Exclusiva
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setProdutosExpanded(!produtosExpanded)}
                >
                  {produtosExpanded ? <ChevronUp /> : <ChevronDown />}
                </Button>
              </div>
            </div>
          </CardHeader>
          {produtosExpanded && (
            <CardContent className="pt-6">
              <RoadmapTable items={produtos} />
            </CardContent>
          )}
        </Card>

        {/* GHAS Section */}
        <Card className="border-blue-200">
          <CardHeader className="bg-blue-50">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  🟦 Projetos GHAS
                  <span className="text-sm text-muted-foreground ml-4">
                    ({kpisGhas.total} KRs • {kpisGhas.percentualConcluido}% concluídos)
                  </span>
                </CardTitle>
              </div>
              <div className="flex gap-2">
                <RoadmapExport items={ghas as any} titulo="Roadmap_GHAS" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/roadmap/ghas')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visão Exclusiva
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setGhasExpanded(!ghasExpanded)}
                >
                  {ghasExpanded ? <ChevronUp /> : <ChevronDown />}
                </Button>
              </div>
            </div>
          </CardHeader>
          {ghasExpanded && (
            <CardContent className="pt-6">
              <RoadmapTable items={ghas} />
            </CardContent>
          )}
        </Card>

        {/* Inovemed Section */}
        <Card className="border-orange-200">
          <CardHeader className="bg-orange-50">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  🟧 Projetos Inovemed
                  <span className="text-sm text-muted-foreground ml-4">
                    ({kpisInovemed.total} KRs • {kpisInovemed.percentualConcluido}% concluídos)
                  </span>
                </CardTitle>
              </div>
              <div className="flex gap-2">
                <RoadmapExport items={inovemed as any} titulo="Roadmap_Inovemed" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/roadmap/inovemed')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visão Exclusiva
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInnovemedExpanded(!innovemedExpanded)}
                >
                  {innovemedExpanded ? <ChevronUp /> : <ChevronDown />}
                </Button>
              </div>
            </div>
          </CardHeader>
          {innovemedExpanded && (
            <CardContent className="pt-6">
              <RoadmapTable items={inovemed} />
            </CardContent>
          )}
        </Card>
      </div>
    </Layout>
  );
}
