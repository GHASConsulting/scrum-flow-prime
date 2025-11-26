import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { useRoadmap } from '@/hooks/useRoadmap';
import { RoadmapKPIs } from '@/components/roadmap/RoadmapKPIs';
import { RoadmapFilters } from '@/components/roadmap/RoadmapFilters';
import { RoadmapTable } from '@/components/roadmap/RoadmapTable';
import { RoadmapExport } from '@/components/roadmap/RoadmapExport';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { calculateKPIs } from '@/lib/roadmapStatus';
import { useNavigate } from 'react-router-dom';

export default function RoadmapGeral() {
  const { roadmapItems, loading } = useRoadmap();
  const navigate = useNavigate();
  
  const [searchKR, setSearchKR] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [atorFilter, setAtorFilter] = useState('todos');
  const [tipoFilter, setTipoFilter] = useState('todos');
  
  const [produtosExpanded, setProdutosExpanded] = useState(true);
  const [ghasExpanded, setGhasExpanded] = useState(true);
  const [innovemedExpanded, setInnovemedExpanded] = useState(true);

  const filteredItems = useMemo(() => {
    return roadmapItems.filter(item => {
      const matchKR = item.kr.toLowerCase().includes(searchKR.toLowerCase());
      const matchStatus = statusFilter === 'todos' || item.status === statusFilter;
      const matchAtor = atorFilter === 'todos' || item.atores?.includes(atorFilter);
      const matchTipo = tipoFilter === 'todos' || item.tipo_produto === tipoFilter;
      
      return matchKR && matchStatus && matchAtor && matchTipo;
    });
  }, [roadmapItems, searchKR, statusFilter, atorFilter, tipoFilter]);

  const produtos = useMemo(() => filteredItems.filter(i => i.tipo_produto === 'Produto'), [filteredItems]);
  const ghas = useMemo(() => filteredItems.filter(i => i.tipo_produto === 'Projeto GHAS'), [filteredItems]);
  const inovemed = useMemo(() => filteredItems.filter(i => i.tipo_produto === 'Projeto Inovemed'), [filteredItems]);

  const kpisProdutos = calculateKPIs(produtos);
  const kpisGhas = calculateKPIs(ghas);
  const kpisInovemed = calculateKPIs(inovemed);
  const kpisGeral = calculateKPIs(filteredItems);

  const atoresUnicos = useMemo(() => {
    const atores = new Set<string>();
    roadmapItems.forEach(item => {
      if (item.atores) {
        item.atores.split(',').forEach(ator => atores.add(ator.trim()));
      }
    });
    return Array.from(atores).sort();
  }, [roadmapItems]);

  const handleClearFilters = () => {
    setSearchKR('');
    setStatusFilter('todos');
    setAtorFilter('todos');
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
            <p className="text-muted-foreground">Visão completa de todos os produtos e projetos</p>
          </div>
        </div>

        <RoadmapKPIs {...kpisGeral} />

        <RoadmapFilters
          searchKR={searchKR}
          onSearchKRChange={setSearchKR}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          atorFilter={atorFilter}
          onAtorFilterChange={setAtorFilter}
          tipoFilter={tipoFilter}
          onTipoFilterChange={setTipoFilter}
          onClearFilters={handleClearFilters}
          atoresUnicos={atoresUnicos}
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
                <RoadmapExport items={produtos} titulo="Roadmap_Produtos" />
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
                <RoadmapExport items={ghas} titulo="Roadmap_GHAS" />
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
                <RoadmapExport items={inovemed} titulo="Roadmap_Inovemed" />
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
