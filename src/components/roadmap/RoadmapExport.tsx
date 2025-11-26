import { Button } from '@/components/ui/button';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { getStatusLabel } from '@/lib/roadmapStatus';

type Roadmap = Tables<'roadmap'>;

interface RoadmapExportProps {
  items: Roadmap[];
  titulo: string;
}

export const RoadmapExport = ({ items, titulo }: RoadmapExportProps) => {
  const exportToExcel = () => {
    try {
      const headers = ['KR', 'Atores', 'Data Início Prevista', 'Data Fim Prevista', 'Data Início Real', 'Data Fim Real', 'Status'];
      
      const rows = items.map(item => [
        item.kr,
        item.atores || '-',
        item.data_inicio_prevista ? format(new Date(item.data_inicio_prevista), 'dd/MM/yyyy') : '-',
        item.data_fim_prevista ? format(new Date(item.data_fim_prevista), 'dd/MM/yyyy') : '-',
        item.data_inicio_real ? format(new Date(item.data_inicio_real), 'dd/MM/yyyy') : '-',
        item.data_fim_real ? format(new Date(item.data_fim_real), 'dd/MM/yyyy') : '-',
        getStatusLabel(item.status as any),
      ]);

      let csv = headers.join(',') + '\n';
      rows.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${titulo.replace(/\s/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();

      toast.success('Exportado para CSV com sucesso');
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast.error('Erro ao exportar CSV');
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF('landscape');
      
      doc.setFontSize(16);
      doc.text(titulo, 14, 15);
      
      const tableData = items.map(item => [
        item.kr,
        item.atores || '-',
        item.data_inicio_prevista ? format(new Date(item.data_inicio_prevista), 'dd/MM/yyyy') : '-',
        item.data_fim_prevista ? format(new Date(item.data_fim_prevista), 'dd/MM/yyyy') : '-',
        item.data_inicio_real ? format(new Date(item.data_inicio_real), 'dd/MM/yyyy') : '-',
        item.data_fim_real ? format(new Date(item.data_fim_real), 'dd/MM/yyyy') : '-',
        getStatusLabel(item.status as any),
      ]);

      autoTable(doc, {
        head: [['KR', 'Atores', 'Início Previsto', 'Fim Previsto', 'Início Real', 'Fim Real', 'Status']],
        body: tableData,
        startY: 25,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
      });

      doc.save(`${titulo.replace(/\s/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Exportado para PDF com sucesso');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF');
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={exportToExcel}>
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Exportar Excel
      </Button>
      <Button variant="outline" onClick={exportToPDF}>
        <FileDown className="h-4 w-4 mr-2" />
        Exportar PDF
      </Button>
    </div>
  );
};
