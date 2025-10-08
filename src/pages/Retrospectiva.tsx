import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  getSprints, 
  getRetrospectivaBySprint,
  addRetrospectiva,
  initializeData 
} from '@/lib/storage';
import { Sprint, Retrospectiva } from '@/types/scrum';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, AlertTriangle, Rocket, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

const RetrospectivaPage = () => {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<string>('');
  const [retrospectiva, setRetrospectiva] = useState<Retrospectiva | null>(null);
  const [formData, setFormData] = useState({
    bom: [''],
    melhorar: [''],
    acoes: ['']
  });

  useEffect(() => {
    initializeData();
    const loadedSprints = getSprints();
    setSprints(loadedSprints);
    
    const activeSprint = loadedSprints.find(s => s.status === 'ativo');
    if (activeSprint) {
      setSelectedSprint(activeSprint.id);
      loadRetrospectiva(activeSprint.id);
    }
  }, []);

  useEffect(() => {
    if (selectedSprint) {
      loadRetrospectiva(selectedSprint);
    }
  }, [selectedSprint]);

  const loadRetrospectiva = (sprintId: string) => {
    const existing = getRetrospectivaBySprint(sprintId);
    if (existing) {
      setRetrospectiva(existing);
      setFormData({
        bom: existing.bom.length > 0 ? existing.bom : [''],
        melhorar: existing.melhorar.length > 0 ? existing.melhorar : [''],
        acoes: existing.acoes.length > 0 ? existing.acoes : ['']
      });
    } else {
      setRetrospectiva(null);
      setFormData({ bom: [''], melhorar: [''], acoes: [''] });
    }
  };

  const handleAddItem = (type: 'bom' | 'melhorar' | 'acoes') => {
    setFormData({
      ...formData,
      [type]: [...formData[type], '']
    });
  };

  const handleRemoveItem = (type: 'bom' | 'melhorar' | 'acoes', index: number) => {
    const updated = formData[type].filter((_, i) => i !== index);
    setFormData({
      ...formData,
      [type]: updated.length > 0 ? updated : ['']
    });
  };

  const handleUpdateItem = (type: 'bom' | 'melhorar' | 'acoes', index: number, value: string) => {
    const updated = [...formData[type]];
    updated[index] = value;
    setFormData({
      ...formData,
      [type]: updated
    });
  };

  const handleSave = () => {
    if (!selectedSprint) {
      toast.error('Selecione uma sprint');
      return;
    }

    const bomFiltrado = formData.bom.filter(item => item.trim() !== '');
    const melhorarFiltrado = formData.melhorar.filter(item => item.trim() !== '');
    const acoesFiltrado = formData.acoes.filter(item => item.trim() !== '');

    if (bomFiltrado.length === 0 && melhorarFiltrado.length === 0 && acoesFiltrado.length === 0) {
      toast.error('Adicione pelo menos um item em alguma categoria');
      return;
    }

    const newRetrospectiva: Retrospectiva = {
      id: `retro-${Date.now()}`,
      sprint_id: selectedSprint,
      bom: bomFiltrado,
      melhorar: melhorarFiltrado,
      acoes: acoesFiltrado,
      data: new Date().toISOString()
    };

    addRetrospectiva(newRetrospectiva);
    setRetrospectiva(newRetrospectiva);
    toast.success('Retrospectiva salva com sucesso');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Retrospectiva</h2>
          <p className="text-muted-foreground mt-1">Reflita sobre a sprint e identifique melhorias</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Retrospectiva da Sprint</CardTitle>
              {retrospectiva && (
                <span className="text-xs text-muted-foreground">
                  Última atualização: {format(parseISO(retrospectiva.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Sprint</label>
              <Select value={selectedSprint} onValueChange={setSelectedSprint}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a sprint" />
                </SelectTrigger>
                <SelectContent>
                  {sprints.map(sprint => (
                    <SelectItem key={sprint.id} value={sprint.id}>
                      {sprint.nome} ({sprint.status === 'ativo' ? 'Ativa' : sprint.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* O que foi bom */}
          <Card>
            <CardHeader className="bg-success/10">
              <CardTitle className="flex items-center gap-2 text-success">
                <CheckCircle className="h-5 w-5" />
                O que foi bom ✅
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {formData.bom.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    placeholder="Adicione um ponto positivo"
                    value={item}
                    onChange={(e) => handleUpdateItem('bom', index, e.target.value)}
                    rows={2}
                    className="flex-1"
                  />
                  {formData.bom.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem('bom', index)}
                      className="h-auto"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddItem('bom')}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar item
              </Button>
            </CardContent>
          </Card>

          {/* O que pode melhorar */}
          <Card>
            <CardHeader className="bg-warning/10">
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
                O que pode melhorar ⚠️
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {formData.melhorar.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    placeholder="Adicione um ponto de melhoria"
                    value={item}
                    onChange={(e) => handleUpdateItem('melhorar', index, e.target.value)}
                    rows={2}
                    className="flex-1"
                  />
                  {formData.melhorar.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem('melhorar', index)}
                      className="h-auto"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddItem('melhorar')}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar item
              </Button>
            </CardContent>
          </Card>

          {/* Ações */}
          <Card>
            <CardHeader className="bg-primary/10">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Rocket className="h-5 w-5" />
                Ações 🚀
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {formData.acoes.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    placeholder="Adicione uma ação"
                    value={item}
                    onChange={(e) => handleUpdateItem('acoes', index, e.target.value)}
                    rows={2}
                    className="flex-1"
                  />
                  {formData.acoes.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem('acoes', index)}
                      className="h-auto"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddItem('acoes')}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar item
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button onClick={handleSave} size="lg" className="px-8">
            Salvar Retrospectiva
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default RetrospectivaPage;
