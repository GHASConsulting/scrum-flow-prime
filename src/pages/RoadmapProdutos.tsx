import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { useRoadmapTarefas } from '@/hooks/useRoadmapTarefas';
import { RoadmapKPIs } from '@/components/roadmap/RoadmapKPIs';
import { RoadmapFilters } from '@/components/roadmap/RoadmapFilters';
import { RoadmapTable } from '@/components/roadmap/RoadmapTable';
import { RoadmapExport } from '@/components/roadmap/RoadmapExport';
import { calculateTaskStatus, calculateKPIs } from '@/lib/roadmapStatus';

export default function RoadmapProdutos() {
  const { tarefas, loading } = useRoadmapTarefas();
  
  const [searchTarefa, setSearchTarefa] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [responsavelFilter, setResponsavelFilter] = useState('todos');

  const produtos = useMemo(() => 
    tarefas.filter(t => t.tipo_produto === 'Produto'), 
    [tarefas]
  );

  const filteredItems = useMemo(() => {
    return produtos.filter(item => {
      const matchTarefa = item.titulo.toLowerCase().includes(searchTarefa.toLowerCase());
      const itemStatus = calculateTaskStatus(item);
      const matchStatus = statusFilter === 'todos' || itemStatus === statusFilter;
      const matchResponsavel = responsavelFilter === 'todos' || item.responsavel === responsavelFilter;
      
      return matchTarefa && matchStatus && matchResponsavel;
    });
  }, [produtos, searchTarefa, statusFilter, responsavelFilter]);

  const kpis = useMemo(() => calculateKPIs(filteredItems), [filteredItems]);

  const responsaveisUnicos = useMemo(() => {
    const responsaveis = new Set<string>();
    produtos.forEach(item => {
      if (item.responsavel) responsaveis.add(item.responsavel);
      item.subtarefas.forEach(sub => {
        if (sub.responsavel) responsaveis.add(sub.responsavel);
      });
    });
    return Array.from(responsaveis).sort();
  }, [produtos]);

  const handleClearFilters = () => {
    setSearchTarefa('');
    setStatusFilter('todos');
    setResponsavelFilter('todos');
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
            <p className="text-muted-foreground">Tarefas e subtarefas de produtos</p>
          </div>
          <RoadmapExport items={filteredItems as any} titulo="Roadmap_Produtos" />
        </div>

        <RoadmapKPIs {...kpis} />

        <RoadmapFilters
          searchKR={searchTarefa}
          onSearchKRChange={setSearchTarefa}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          atorFilter={responsavelFilter}
          onAtorFilterChange={setResponsavelFilter}
          tipoFilter="todos"
          onTipoFilterChange={() => {}}
          onClearFilters={handleClearFilters}
          atoresUnicos={responsaveisUnicos}
          showTipoFilter={false}
        />

        <RoadmapTable items={filteredItems} />
      </div>
    </Layout>
  );
}
