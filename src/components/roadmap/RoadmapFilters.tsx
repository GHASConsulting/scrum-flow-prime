import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface RoadmapFiltersProps {
  searchKR: string;
  onSearchKRChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  atorFilter: string;
  onAtorFilterChange: (value: string) => void;
  tipoFilter: string;
  onTipoFilterChange: (value: string) => void;
  onClearFilters: () => void;
  atoresUnicos: string[];
  showTipoFilter?: boolean;
}

export const RoadmapFilters = ({
  searchKR,
  onSearchKRChange,
  statusFilter,
  onStatusFilterChange,
  atorFilter,
  onAtorFilterChange,
  tipoFilter,
  onTipoFilterChange,
  onClearFilters,
  atoresUnicos,
  showTipoFilter = true,
}: RoadmapFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="flex-1 min-w-[200px]">
        <Input
          placeholder="Buscar KR..."
          value={searchKR}
          onChange={(e) => onSearchKRChange(e.target.value)}
        />
      </div>

      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os status</SelectItem>
          <SelectItem value="NAO_INICIADO">Não iniciado</SelectItem>
          <SelectItem value="EM_DESENVOLVIMENTO">Em desenvolvimento</SelectItem>
          <SelectItem value="TESTES">Testes</SelectItem>
          <SelectItem value="DESENVOLVIDO">Desenvolvido</SelectItem>
          <SelectItem value="CANCELADO">Cancelado</SelectItem>
        </SelectContent>
      </Select>

      <Select value={atorFilter} onValueChange={onAtorFilterChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Ator" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os atores</SelectItem>
          {atoresUnicos.map((ator) => (
            <SelectItem key={ator} value={ator}>
              {ator}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showTipoFilter && (
        <Select value={tipoFilter} onValueChange={onTipoFilterChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tipo de Produto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="Produto">Produto</SelectItem>
            <SelectItem value="Projeto GHAS">Projeto GHAS</SelectItem>
            <SelectItem value="Projeto Inovemed">Projeto Inovemed</SelectItem>
          </SelectContent>
        </Select>
      )}

      <Button variant="outline" onClick={onClearFilters}>
        <X className="h-4 w-4 mr-2" />
        Limpar Filtros
      </Button>
    </div>
  );
};
