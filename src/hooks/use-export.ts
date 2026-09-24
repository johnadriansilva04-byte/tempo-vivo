import { useProfile } from "./use-profile";
import { useDailyLogs } from "./use-daily-logs";
import { useCareerChapters } from "./use-career-chapters";
import { useMilestones } from "./use-milestones";
import { useProjects } from "./use-projects";
import { useWeeklyFocus } from "./use-weekly-focus";

export type ExportData = {
  profile: any;
  dailyLogs: any[];
  careerChapters: any[];
  milestones: any[];
  projects: any[];
  weeklyFocus: any[];
  exportDate: string;
  version: string;
};

export function useExport() {
  const { profile } = useProfile();
  const { logs } = useDailyLogs();
  const { chapters } = useCareerChapters();
  const { milestones } = useMilestones();
  const { projects } = useProjects();
  const { weeklyFocus } = useWeeklyFocus();

  const exportToJSON = () => {
    const data: ExportData = {
      profile,
      dailyLogs: logs,
      careerChapters: chapters,
      milestones,
      projects,
      weeklyFocus,
      exportDate: new Date().toISOString(),
      version: "1.0.0",
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `perfil-vivo-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToPDF = async () => {
    // This would typically use a library like jsPDF or react-pdf
    // For now, we'll create a simple HTML-based PDF export
    const data: ExportData = {
      profile,
      dailyLogs: logs,
      careerChapters: chapters,
      milestones,
      projects,
      weeklyFocus,
      exportDate: new Date().toISOString(),
      version: "1.0.0",
    };

    // Create HTML content
    const htmlContent = generateHTMLReport(data);

    // Create a new window and print
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const exportToCSV = () => {
    // Export daily logs to CSV
    const headers = ["Data", "Planejado", "Executado", "Resumo", "Status"];
    const rows = logs.map(log => [
      log.log_date,
      `"${log.planned_text.replace(/"/g, '""')}"`,
      `"${log.executed_text.replace(/"/g, '""')}"`,
      `"${log.summary_text.replace(/"/g, '""')}"`,
      log.status,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `agenda-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    exportToJSON,
    exportToPDF,
    exportToCSV,
    hasData: logs.length > 0 || chapters.length > 0 || milestones.length > 0,
  };
}

function generateHTMLReport(data: ExportData): string {
  const { profile, dailyLogs, careerChapters, milestones, projects, weeklyFocus } = data;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Perfil Vivo - ${profile?.name || "Exportação"}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      color: #6366f1;
      border-bottom: 2px solid #6366f1;
      padding-bottom: 10px;
    }
    h2 {
      color: #4f46e5;
      margin-top: 30px;
    }
    .profile-section {
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .log-entry {
      border-left: 3px solid #6366f1;
      padding-left: 15px;
      margin-bottom: 15px;
    }
    .log-date {
      font-weight: bold;
      color: #6366f1;
    }
    .milestone {
      background: #fef3c7;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    .project {
      background: #dbeafe;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
    @media print {
      body {
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <h1>Perfil Vivo</h1>
  
  <div class="profile-section">
    <h2>Perfil</h2>
    <p><strong>Nome:</strong> ${profile?.name || "Não definido"}</p>
    <p><strong>Cargo:</strong> ${profile?.role || "Não definido"}</p>
    <p><strong>Localização:</strong> ${profile?.location || "Não definido"}</p>
    <p><strong>Bio:</strong> ${profile?.bio || "Não definido"}</p>
  </div>

  <h2>Registro Diário (${dailyLogs.length} dias)</h2>
  ${dailyLogs.map(log => `
    <div class="log-entry">
      <div class="log-date">${log.log_date}</div>
      <p><strong>Planejado:</strong> ${log.planned_text || "Nada planejado"}</p>
      <p><strong>Executado:</strong> ${log.executed_text || "Nada executado"}</p>
      <p><strong>Resumo:</strong> ${log.summary_text || "Sem resumo"}</p>
      <p><strong>Status:</strong> ${log.status}</p>
    </div>
  `).join("")}

  <h2>Capítulos de Carreira (${careerChapters.length})</h2>
  ${careerChapters.map(chapter => `
    <div class="log-entry">
      <h3>${chapter.title}</h3>
      <p><strong>Período:</strong> ${chapter.period}</p>
      <p><strong>Tipo:</strong> ${chapter.document_type}</p>
      <p>${chapter.content}</p>
    </div>
  `).join("")}

  <h2>Marcos (${milestones.length})</h2>
  ${milestones.map(milestone => `
    <div class="milestone">
      <h3>${milestone.title} (${milestone.year})</h3>
      <p><strong>Categoria:</strong> ${milestone.category}</p>
      <p>${milestone.description}</p>
    </div>
  `).join("")}

  <h2>Projetos (${projects.length})</h2>
  ${projects.map(project => `
    <div class="project">
      <h3>${project.name}</h3>
      <p><strong>Status:</strong> ${project.status}</p>
      <p><strong>Progresso:</strong> ${project.progress}%</p>
      <p>${project.description}</p>
    </div>
  `).join("")}

  <h2>Foco Semanal (${weeklyFocus.length})</h2>
  ${weeklyFocus.map(focus => `
    <div class="log-entry">
      <h3>${focus.title}</h3>
      <p><strong>Semana:</strong> ${focus.week_number}/${focus.year}</p>
      <p><strong>Progresso:</strong> ${focus.progress_pct}%</p>
      <p>${focus.description}</p>
    </div>
  `).join("")}

  <div class="footer">
    <p>Gerado em ${new Date(data.exportDate).toLocaleString('pt-BR')}</p>
    <p>Perfil Vivo v${data.version}</p>
  </div>
</body>
</html>
  `;
}