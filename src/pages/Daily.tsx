import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useSprints } from '@/hooks/useSprints';
import { useDailies } from '@/hooks/useDailies';
import { useProfiles } from '@/hooks/useProfiles';

const DailyPage = () => {
  const { user, userRole } = useAuth();
  const { sprints } = useSprints();
  const { dailies, addDaily: addDailyDB } = useDailies();
  const { profiles } = useProfiles();
  
  const [selectedSprint, setSelectedSprint] = useState<string>('');
  const [formData, setFormData] = useState({
    usuario: '',
    ontem: '',
    hoje: '',
    impedimentos: ''
  });

  // Preencher automaticamente a sprint ativa
  useEffect(() => {
    const activeSprint = sprints.find(s => s.status === 'ativo');
    if (activeSprint) {
      setSelectedSprint(activeSprint.id);
    }
  }, [sprints]);

  // Preencher automaticamente o usuário para operadores
  useEffect(() => {
    if (userRole === 'operador' && user && profiles.length > 0) {
      const userProfile = profiles.find(p => p.user_id === user.id);
      if (userProfile) {
        setFormData(prev => ({ ...prev, usuario: userProfile.nome }));
      }
    }
  }, [userRole, user, profiles]);

  // Filtrar dailies pela sprint selecionada
  const filteredDailies = selectedSprint 
    ? dailies.filter(d => d.sprint_id === selectedSprint).sort((a, b) => 
        new Date(b.data).getTime() - new Date(a.data).getTime()
      )
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSprint) {
      toast.error('Selecione uma sprint');
      return;
    }

    if (!formData.usuario.trim() || !formData.ontem.trim() || !formData.hoje.trim()) {
      toast.error('Preencha Usuário, Ontem e Hoje');
      return;
    }

    const { error } = await addDailyDB({
      sprint_id: selectedSprint,
      usuario: formData.usuario,
      data: new Date().toISOString(),
      ontem: formData.ontem,
      hoje: formData.hoje,
      impedimentos: formData.impedimentos || null
    });

    if (error) {
      toast.error('Erro ao registrar daily');
      return;
    }

    // Limpar campos, mas manter usuário para operadores
    if (userRole === 'operador') {
      setFormData(prev => ({ ...prev, ontem: '', hoje: '', impedimentos: '' }));
    } else {
      setFormData({ usuario: '', ontem: '', hoje: '', impedimentos: '' });
    }
    
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
                  <label className="text-sm font-medium">Sprint *</label>
                  <Input
                    value={sprints.find(s => s.id === selectedSprint)?.nome || ''}
                    disabled
                    placeholder="Sprint ativa será selecionada automaticamente"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Usuário *</label>
                  {userRole === 'administrador' ? (
                    <Select 
                      value={formData.usuario} 
                      onValueChange={(value) => setFormData({ ...formData, usuario: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles.map(profile => (
                          <SelectItem key={profile.id} value={profile.nome}>
                            {profile.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={formData.usuario}
                      disabled
                      placeholder="Seu nome será preenchido automaticamente"
                    />
                  )}
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
                  Aguardando sprint ativa
                </p>
              ) : filteredDailies.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma daily registrada nesta sprint
                </p>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {filteredDailies.map((daily) => (
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
