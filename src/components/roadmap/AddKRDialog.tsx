import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useRoadmap } from '@/hooks/useRoadmap';
import { toast } from 'sonner';

export function AddKRDialog() {
  const { addRoadmapItem } = useRoadmap();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    kr: '',
    descricao: '',
    atores: '',
    tipo_produto: 'Produto' as 'Produto' | 'Projeto GHAS' | 'Projeto Inovemed',
    data_inicio_prevista: '',
    data_fim_prevista: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.kr.trim()) {
      toast.error('O campo KR é obrigatório');
      return;
    }

    setLoading(true);
    try {
      await addRoadmapItem({
        kr: formData.kr,
        descricao: formData.descricao || null,
        atores: formData.atores || null,
        tipo_produto: formData.tipo_produto,
        data_inicio_prevista: formData.data_inicio_prevista || null,
        data_fim_prevista: formData.data_fim_prevista || null,
        data_inicio_real: null,
        data_fim_real: null,
        status: 'NAO_INICIADO',
        backlog_ids: [],
        sprint_tarefa_ids: [],
      });

      toast.success('KR adicionado ao roadmap');
      setOpen(false);
      setFormData({
        kr: '',
        descricao: '',
        atores: '',
        tipo_produto: 'Produto',
        data_inicio_prevista: '',
        data_fim_prevista: '',
      });
    } catch (error) {
      console.error('Erro ao adicionar KR:', error);
      toast.error('Erro ao adicionar KR ao roadmap');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar KR
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar KR ao Roadmap</DialogTitle>
          <DialogDescription>
            Crie um novo Key Result (KR) para o roadmap
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kr">KR (Key Result) *</Label>
            <Input
              id="kr"
              value={formData.kr}
              onChange={(e) => setFormData({ ...formData, kr: e.target.value })}
              placeholder="Ex: Implementar módulo de relatórios"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva os detalhes do KR"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_produto">Tipo de Produto *</Label>
              <Select
                value={formData.tipo_produto}
                onValueChange={(value: any) => setFormData({ ...formData, tipo_produto: value })}
              >
                <SelectTrigger id="tipo_produto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Produto">Produto</SelectItem>
                  <SelectItem value="Projeto GHAS">Projeto GHAS</SelectItem>
                  <SelectItem value="Projeto Inovemed">Projeto Inovemed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="atores">Atores</Label>
              <Input
                id="atores"
                value={formData.atores}
                onChange={(e) => setFormData({ ...formData, atores: e.target.value })}
                placeholder="Ex: João, Maria"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_inicio_prevista">Data Início Prevista</Label>
              <Input
                id="data_inicio_prevista"
                type="date"
                value={formData.data_inicio_prevista}
                onChange={(e) => setFormData({ ...formData, data_inicio_prevista: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_fim_prevista">Data Fim Prevista</Label>
              <Input
                id="data_fim_prevista"
                type="date"
                value={formData.data_fim_prevista}
                onChange={(e) => setFormData({ ...formData, data_fim_prevista: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar KR'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}