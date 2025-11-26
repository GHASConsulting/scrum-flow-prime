import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, ChevronRight, ChevronLeft, FileDown } from 'lucide-react';
import { useScheduleTasks } from '@/hooks/useScheduleTasks';
import { useResources } from '@/hooks/useResources';
import type { Tables } from '@/integrations/supabase/types';
import { formatDateTimeForInput, parseDateTimeFromInput, addWorkingDays, calculateWorkingDays, adjustToWorkingTime } from '@/lib/workingDays';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ScheduleTask = Tables<'schedule_task'>;

interface TaskWithChildren extends ScheduleTask {
  children: TaskWithChildren[];
}

interface CronogramaTreeGridProps {
  projectId: string;
}

export function CronogramaTreeGrid({ projectId }: CronogramaTreeGridProps) {
  const { tasks, loading, addTask, updateTask, deleteTask } = useScheduleTasks(projectId);
  const { resources } = useResources();
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const toggleExpand = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const handleAddTask = async () => {
    try {
      await addTask({
        project_id: projectId,
        name: 'Nova Tarefa',
        order_index: tasks.length,
        is_summary: false,
        duration_days: 1,
        duration_is_estimate: false,
        start_at: new Date().toISOString(),
        end_at: addWorkingDays(new Date(), 1).toISOString(),
        predecessors: null,
        parent_id: null,
        notes: null,
        responsavel: null,
        tipo_produto: null,
      });
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      
      // Adicionar título
      doc.setFontSize(16);
      doc.text('Cronograma do Projeto', 14, 15);
      
      // Preparar dados para a tabela
      const tableData = tasks.map(task => {
        const indent = task.parent_id ? '  ' : '';
        return [
          indent + task.name,
          task.duration_days ? task.duration_days.toString() : '',
          task.start_at ? new Date(task.start_at).toLocaleString('pt-BR') : '',
          task.end_at ? new Date(task.end_at).toLocaleString('pt-BR') : '',
          task.predecessors || '',
          task.responsavel || ''
        ];
      });

      // Gerar tabela
      autoTable(doc, {
        head: [['Nome', 'Duração (dias)', 'Início', 'Fim', 'Antecessores', 'Responsável']],
        body: tableData,
        startY: 25,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [66, 66, 66],
          textColor: 255,
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 30, halign: 'right' },
          2: { cellWidth: 40 },
          3: { cellWidth: 40 },
          4: { cellWidth: 40 },
          5: { cellWidth: 50 },
        },
        didParseCell: (data) => {
          // Negrito para linhas de resumo
          const task = tasks[data.row.index];
          if (task?.is_summary && data.section === 'body') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [240, 240, 240];
          }
        },
      });

      // Salvar PDF
      doc.save(`cronograma-${new Date().toLocaleDateString('pt-BR')}.pdf`);
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF');
    }
  };

  const handleIndent = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const taskIndex = tasks.findIndex(t => t.id === taskId);
    const previousTask = tasks[taskIndex - 1];
    
    if (!previousTask) {
      toast.error('Não há tarefa anterior para indentar');
      return;
    }

    await updateTask(taskId, { parent_id: previousTask.id });
  };

  const handleOutdent = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.parent_id) return;

    await updateTask(taskId, { parent_id: null });
  };

  const handleUpdateField = async (taskId: string, field: keyof ScheduleTask, value: any) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updates: Partial<ScheduleTask> = { [field]: value };

    // Recalcular datas se necessário
    if (field === 'start_at' && task.duration_days && value) {
      const startDate = parseDateTimeFromInput(value);
      const adjustedStart = adjustToWorkingTime(startDate);
      const endDate = addWorkingDays(adjustedStart, Number(task.duration_days));
      updates.start_at = adjustedStart.toISOString();
      updates.end_at = endDate.toISOString();
    } else if (field === 'duration_days' && task.start_at && value) {
      const startDate = new Date(task.start_at);
      const endDate = addWorkingDays(startDate, Number(value));
      updates.end_at = endDate.toISOString();
    } else if (field === 'end_at' && task.start_at && value) {
      const startDate = new Date(task.start_at);
      const endDate = parseDateTimeFromInput(value);
      const duration = calculateWorkingDays(startDate, endDate);
      updates.duration_days = duration;
    }

    await updateTask(taskId, updates);
  };

  const buildTree = (): TaskWithChildren[] => {
    const taskMap = new Map<string, TaskWithChildren>();
    
    tasks.forEach(task => {
      taskMap.set(task.id, { ...task, children: [] });
    });

    const roots: TaskWithChildren[] = [];

    tasks.forEach(task => {
      const taskWithChildren = taskMap.get(task.id)!;
      if (task.parent_id) {
        const parent = taskMap.get(task.parent_id);
        if (parent) {
          parent.children.push(taskWithChildren);
        } else {
          roots.push(taskWithChildren);
        }
      } else {
        roots.push(taskWithChildren);
      }
    });

    return roots;
  };

  const renderTaskRow = (task: TaskWithChildren, level: number = 0) => {
    const isExpanded = expandedTasks.has(task.id);
    const hasChildren = task.children.length > 0;

    return (
      <>
        <TableRow key={task.id} className={task.is_summary ? 'font-bold bg-muted/50' : ''}>
          <TableCell style={{ paddingLeft: `${level * 24 + 16}px` }}>
            <div className="flex items-center gap-2">
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpand(task.id)}
                  className="h-6 w-6 p-0"
                >
                  {isExpanded ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
              )}
              <Input
                value={task.name}
                onChange={(e) => handleUpdateField(task.id, 'name', e.target.value)}
                onBlur={() => {}}
                className="h-8"
              />
            </div>
          </TableCell>
          <TableCell>
            <Input
              type="number"
              step="0.5"
              value={task.duration_days || ''}
              onChange={(e) => handleUpdateField(task.id, 'duration_days', e.target.value)}
              className="h-8 w-24"
              disabled={task.is_summary}
            />
          </TableCell>
          <TableCell>
            <Input
              type="datetime-local"
              value={task.start_at ? formatDateTimeForInput(new Date(task.start_at)) : ''}
              onChange={(e) => handleUpdateField(task.id, 'start_at', e.target.value)}
              className="h-8"
              disabled={task.is_summary}
            />
          </TableCell>
          <TableCell>
            <Input
              type="datetime-local"
              value={task.end_at ? formatDateTimeForInput(new Date(task.end_at)) : ''}
              onChange={(e) => handleUpdateField(task.id, 'end_at', e.target.value)}
              className="h-8"
              disabled={task.is_summary}
            />
          </TableCell>
          <TableCell>
            <Input
              value={task.predecessors || ''}
              onChange={(e) => handleUpdateField(task.id, 'predecessors', e.target.value)}
              className="h-8"
              placeholder="IDs separados por vírgula"
            />
          </TableCell>
          <TableCell>
            <Input
              value={task.responsavel || ''}
              onChange={(e) => handleUpdateField(task.id, 'responsavel', e.target.value)}
              className="h-8"
              placeholder="Nome do responsável"
            />
          </TableCell>
          <TableCell>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleIndent(task.id)}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOutdent(task.id)}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteTask(task.id)}
                className="h-8 w-8 p-0 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        {isExpanded && hasChildren && task.children.map(child => renderTaskRow(child, level + 1))}
      </>
    );
  };

  if (loading) {
    return <Card className="p-8 text-center">Carregando cronograma...</Card>;
  }

  const tree = buildTree();

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Cronograma do Projeto</h3>
          <div className="flex gap-2">
            <Button onClick={handleAddTask}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Tarefa
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <FileDown className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </div>

        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Nome</TableHead>
                <TableHead className="w-[120px]">Duração (dias)</TableHead>
                <TableHead className="w-[200px]">Início</TableHead>
                <TableHead className="w-[200px]">Fim</TableHead>
                <TableHead className="w-[200px]">Antecessores</TableHead>
                <TableHead className="w-[180px]">Responsável</TableHead>
                <TableHead className="w-[150px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tree.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhuma tarefa encontrada. Adicione uma nova tarefa para começar.
                  </TableCell>
                </TableRow>
              ) : (
                tree.map(task => renderTaskRow(task))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
}
