import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { useRoadmap } from '@/hooks/useRoadmap';
import { RoadmapKPIs } from '@/components/roadmap/RoadmapKPIs';
import { RoadmapFilters } from '@/components/roadmap/RoadmapFilters';
import { RoadmapTable } from '@/components/roadmap/RoadmapTable';
import { RoadmapExport } from '@/components/roadmap/RoadmapExport';
import { calculateKPIs } from '@/lib/roadmapStatus';

export default function RoadmapProdutos() {
  const { roadmapItems, loading } = useRoadmap();
  
  const [searchKR, setSearchKR] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [atorFilter, setAtorFilter] = useState('todos');

  const produtos = useMemo(() => 
    roadmapItems.filter(i => i.tipo_produto === 'Produto'), 
    [roadmapItems]
  );

  const filteredItems = useMemo(() => {
    return produtos.filter(item => {
      const matchKR = item.kr.toLowerCase().includes(searchKR.toLowerCase());
      const matchStatus = statusFilter === 'todos' || item.status === statusFilter;
      const matchAtor = atorFilter === 'todos' || item.atores?.includes(atorFilter);
      
      return matchKR && matchStatus && matchAtor;
    });
  }, [produtos, searchKR, statusFilter, atorFilter]);

  const kpis = calculateKPIs(filteredItems);

  const atoresUnicos = useMemo(() => {
    const atores = new Set<string>();
    produtos.forEach(item => {
      if (item.atores) {
        item.atores.split(',').forEach(ator => atores.add(ator.trim()));
      }
    });
    return Array.from(atores).sort();
  }, [produtos]);

  const handleClearFilters = () => {
    setSearchKR('');
    setStatusFilter('todos');
    setAtorFilter('todos');
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
            <h1 className="text-3xl font-bold">🟩 Roadmap de Produtos</h1>
            <p className="text-muted-foreground">Acompanhamento detalhado dos produtos</p>
          </div>
          <RoadmapExport items={filteredItems} titulo="Roadmap_Produtos" />
        </div>

        <RoadmapKPIs {...kpis} />

        <RoadmapFilters
          searchKR={searchKR}
          onSearchKRChange={setSearchKR}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          atorFilter={atorFilter}
          onAtorFilterChange={setAtorFilter}
          tipoFilter="todos"
          onTipoFilterChange={() => {}}
          onClearFilters={handleClearFilters}
          atoresUnicos={atoresUnicos}
          showTipoFilter={false}
        />

        <RoadmapTable items={filteredItems} />
      </div>
    </Layout>
  );
}
