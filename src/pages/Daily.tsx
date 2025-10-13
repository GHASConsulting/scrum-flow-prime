import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageSquare, CalendarIcon, Filter, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useSprints } from '@/hooks/useSprints';
import { useDailies } from '@/hooks/useDailies';
import { useProfiles } from '@/hooks/useProfiles';
import { cn } from '@/lib/utils';

const DailyPage = () => {
  const { user, userRole } = useAuth();
  const { sprints } = useSprints();
  const { dailies, addDaily: addDailyDB, deleteDaily } = useDailies();
  const { profiles } = useProfiles();
  
  const [selectedSprint, setSelectedSprint] = useState<string>('');
  const [dataRegistro, setDataRegistro] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    usuario: '',
    ontem: '',
    hoje: '',
    impedimentos: ''
  });

  // Filtros do histórico
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>('all');
  const [filtroData, setFiltroData] = useState<Date | undefined>();

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

  // Filtrar dailies pela sprint selecionada e pelos filtros
  const filteredDailies = selectedSprint 
    ? dailies.filter(d => {
        if (d.sprint_id !== selectedSprint) return false;
        
        // Para operadores, mostrar apenas seus próprios registros
        if (userRole === 'operador' && user && profiles.length > 0) {
          const userProfile = profiles.find(p => p.user_id === user.id);
          if (userProfile && d.usuario !== userProfile.nome) return false;
        }
        
        // Filtro por responsável (apenas para administradores)
        if (userRole === 'administrador' && filtroResponsavel !== 'all' && d.usuario !== filtroResponsavel) return false;
        
        // Filtro por data
        if (filtroData) {
          const dailyDate = format(parseISO(d.data), 'yyyy-MM-dd');
          const filterDate = format(filtroData, 'yyyy-MM-dd');
          if (dailyDate !== filterDate) return false;
        }
        
        return true;
      }).sort((a, b) => 
        new Date(b.data).getTime() - new Date(a.data).getTime()
      )
    : [];

  // Lista única de responsáveis para o filtro (apenas administradores)
  const responsaveisUnicos = userRole === 'administrador' 
    ? Array.from(new Set(
        dailies.filter(d => d.sprint_id === selectedSprint).map(d => d.usuario)
      ))
    : [];

  const handleDeleteDaily = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro de daily?')) {
      return;
    }

    const { error } = await deleteDaily(id);

    if (error) {
      toast.error('Erro ao excluir daily');
      return;
    }

    toast.success('Daily excluída com sucesso');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSprint) {
      toast.error('Selecione uma sprint');
      return;
    }

    if (!dataRegistro) {
      toast.error('Selecione a data do registro');
      return;
    }

    if (!formData.usuario.trim() || !formData.ontem.trim() || !formData.hoje.trim()) {
      toast.error('Preencha Usuário, Ontem e Hoje');
      return;
    }

    // Usar a data selecionada pelo usuário
    const dataRegistroISO = new Date(dataRegistro.setHours(new Date().getHours(), new Date().getMinutes())).toISOString();

    const { error } = await addDailyDB({
      sprint_id: selectedSprint,
      usuario: formData.usuario,
      data: dataRegistroISO,
      ontem: formData.ontem,
      hoje: formData.hoje,
      impedimentos: formData.impedimentos || null
    });

    if (error) {
      toast.error('Erro ao registrar daily');
      return;
    }

    // Limpar campos, mas manter usuário para operadores e resetar data para hoje
    setDataRegistro(new Date());
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
                  <label className="text-sm font-medium">Data do Registro *</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dataRegistro && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataRegistro ? format(dataRegistro, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione a data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dataRegistro}
                        onSelect={(date) => date && setDataRegistro(date)}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle>Histórico de Dailies</CardTitle>
                {userRole === 'administrador' && (
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Filtros</span>
                  </div>
                )}
              </div>
              {userRole === 'administrador' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-sm font-medium">Responsável</label>
                  <Select value={filtroResponsavel} onValueChange={setFiltroResponsavel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {responsaveisUnicos.map(resp => (
                        <SelectItem key={resp} value={resp}>
                          {resp}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Data do Registro</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filtroData && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filtroData ? format(filtroData, "dd/MM/yyyy", { locale: ptBR }) : <span>Todas as datas</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filtroData}
                        onSelect={setFiltroData}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  {filtroData && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFiltroData(undefined)}
                      className="mt-2 w-full"
                    >
                      Limpar filtro de data
                    </Button>
                  )}
                </div>
              </div>
              )}
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
                        <div>
                          <h4 className="font-semibold">{daily.usuario}</h4>
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(daily.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteDaily(daily.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
