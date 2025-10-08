import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSprints, getDailiesBySprint, addDaily, initializeData } from '@/lib/storage';
import { Sprint, Daily } from '@/types/scrum';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const DailyPage = () => {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<string>('');
  const [dailies, setDailies] = useState<Daily[]>([]);
  const [formData, setFormData] = useState({
    usuario: '',
    ontem: '',
    hoje: '',
    impedimentos: ''
  });

  useEffect(() => {
    initializeData();
    const loadedSprints = getSprints();
    setSprints(loadedSprints);
    
    const activeSprint = loadedSprints.find(s => s.status === 'ativo');
    if (activeSprint) {
      setSelectedSprint(activeSprint.id);
      loadDailies(activeSprint.id);
    }
  }, []);

  useEffect(() => {
    if (selectedSprint) {
      loadDailies(selectedSprint);
    }
  }, [selectedSprint]);

  const loadDailies = (sprintId: string) => {
    const loaded = getDailiesBySprint(sprintId);
    setDailies(loaded.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSprint) {
      toast.error('Selecione uma sprint');
      return;
    }

    if (!formData.usuario.trim() || !formData.ontem.trim() || !formData.hoje.trim()) {
      toast.error('Preencha Usuário, Ontem e Hoje');
      return;
    }

    const daily: Daily = {
      id: `daily-${Date.now()}`,
      sprint_id: selectedSprint,
      usuario: formData.usuario,
      data: new Date().toISOString(),
      ontem: formData.ontem,
      hoje: formData.hoje,
      impedimentos: formData.impedimentos
    };

    addDaily(daily);
    setFormData({ usuario: '', ontem: '', hoje: '', impedimentos: '' });
    loadDailies(selectedSprint);
    toast.success('Daily registrada com sucesso');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Daily</h2>
          <p className="text-muted-foreground mt-1">Registre o acompanhamento diário do time</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Registrar Daily</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
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

                <div>
                  <label className="text-sm font-medium">Usuário *</label>
                  <Input
                    placeholder="Seu nome"
                    value={formData.usuario}
                    onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">O que foi feito ontem? *</label>
                  <Textarea
                    placeholder="Descreva as atividades realizadas"
                    value={formData.ontem}
                    onChange={(e) => setFormData({ ...formData, ontem: e.target.value })}
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">O que será feito hoje? *</label>
                  <Textarea
                    placeholder="Descreva o que será trabalhado hoje"
                    value={formData.hoje}
                    onChange={(e) => setFormData({ ...formData, hoje: e.target.value })}
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Impedimentos</label>
                  <Textarea
                    placeholder="Descreva impedimentos ou bloqueios (opcional)"
                    value={formData.impedimentos}
                    onChange={(e) => setFormData({ ...formData, impedimentos: e.target.value })}
                    rows={2}
                  />
                </div>

                <Button type="submit" className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Registrar Daily
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Dailies</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedSprint ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Selecione uma sprint para ver o histórico
                </p>
              ) : dailies.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma daily registrada nesta sprint
                </p>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {dailies.map((daily) => (
                    <div key={daily.id} className="p-4 border rounded-lg space-y-3 bg-card">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{daily.usuario}</h4>
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(daily.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Ontem</p>
                          <p className="text-sm">{daily.ontem}</p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Hoje</p>
                          <p className="text-sm">{daily.hoje}</p>
                        </div>

                        {daily.impedimentos && (
                          <div>
                            <p className="text-xs font-medium text-destructive">Impedimentos</p>
                            <p className="text-sm text-destructive">{daily.impedimentos}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default DailyPage;
