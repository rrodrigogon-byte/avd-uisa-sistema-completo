/**
 * Gerador de HTML para PDI (Plano de Desenvolvimento Individual)
 * Cria HTML formatado baseado nos dados do banco de dados
 */

export interface PDIData {
  // Perfil do colaborador
  employeeName: string;
  position: string;
  developmentFocus: string;
  sponsorName: string;
  
  // KPIs
  kpis: {
    currentPosition: string;
    reframing: string;
    newPosition: string;
    planDuration: string;
  };
  
  // Gaps de competências
  competencyGaps: Array<{
    title: string;
    description: string;
  }>;
  
  // Dados do gráfico
  competencyChart: {
    labels: string[];
    currentProfile: number[];
    targetProfile: number[];
  };
  
  // Trilha de remuneração
  compensationTrack: Array<{
    level: string;
    timeline: string;
    trigger: string;
    projectedSalary: string;
    positionInRange: string;
  }>;
  
  // Plano de ação 70-20-10
  actionPlan: {
    onTheJob: string[];
    social: string[];
    formal: string[];
  };
  
  // Pacto de responsabilidades
  responsibilityPact: {
    employee: string[];
    leadership: string[];
    dho: string[];
  };
}

/**
 * Gera HTML completo do PDI
 */
export function generatePDIHtml(data: PDIData): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Plano de Performance e Desenvolvimento - ${data.employeeName} | UISA</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&display=swap" rel="stylesheet">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'uisa-blue': '#002D62',
                        'uisa-green': '#65B32E',
                        'uisa-light-blue': '#00A6ED',
                        'uisa-orange': '#F58220',
                    }
                }
            }
        }
    </script>
    <style>
        body { font-family: 'Poppins', sans-serif; background-color: #F8F9FA; }
        .kpi-card { background-color: white; border-radius: 0.5rem; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
        .section-card { background-color: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); }
    </style>
</head>
<body class="p-6 md:p-8 lg:p-12">
    <div class="max-w-7xl mx-auto">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
                <h1 class="text-3xl lg:text-4xl font-bold text-uisa-blue">Plano de Performance e Desenvolvimento</h1>
                <p class="text-xl text-gray-600">${data.employeeName}</p>
            </div>
            <div class="flex items-center mt-4 md:mt-0">
                <img src="https://www.uisa.com.br/wp-content/uploads/2023/02/Logo-UISA.png" alt="Logo UISA" class="h-12">
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-6">
                <!-- CARD DE PERFIL E KPIs -->
                <div class="section-card">
                    <div class="flex flex-col sm:flex-row items-center space-x-0 sm:space-x-6">
                        <div class="text-center sm:text-left">
                            <h2 class="text-2xl font-bold text-uisa-blue">${data.employeeName}</h2>
                            <p class="text-md text-uisa-orange font-semibold">${data.position}</p>
                            <p class="text-sm text-gray-500 mt-1"><strong>Foco do Desenvolvimento:</strong> ${data.developmentFocus}</p>
                            <p class="text-sm text-gray-500"><strong>Diretor Sponsor:</strong> ${data.sponsorName}</p>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-center">
                        <div class="kpi-card">
                            <p class="text-sm font-semibold text-gray-500">Posição Atual</p>
                            <p class="text-lg font-bold text-uisa-blue mt-2">${data.kpis.currentPosition}</p>
                        </div>
                        <div class="kpi-card">
                            <p class="text-sm font-semibold text-gray-500">Reenquadramento</p>
                            <p class="text-lg font-bold text-uisa-green mt-2">${data.kpis.reframing}</p>
                        </div>
                        <div class="kpi-card">
                            <p class="text-sm font-semibold text-gray-500">Nova Posição</p>
                            <p class="text-xl font-bold text-uisa-blue mt-2">${data.kpis.newPosition}</p>
                        </div>
                        <div class="kpi-card">
                            <p class="text-sm font-semibold text-gray-500">Plano de Performance</p>
                            <p class="text-xl font-bold text-uisa-orange mt-2">${data.kpis.planDuration}</p>
                        </div>
                    </div>
                </div>
                
                <!-- DIAGNÓSTICO DE COMPETÊNCIAS -->
                <div class="section-card">
                    <h3 class="text-xl font-bold text-uisa-blue mb-4">Análise de Gaps de Competências</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p class="font-semibold text-gray-700 mb-2">Gaps Prioritários a Desenvolver:</p>
                            <ul class="space-y-2 text-sm text-gray-600">
                                ${data.competencyGaps.map(gap => `
                                <li><strong>${gap.title}:</strong> ${gap.description}</li>
                                `).join('')}
                            </ul>
                        </div>
                        <div class="relative h-64 md:h-auto">
                            <canvas id="competency-chart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- TRILHA DE REMUNERAÇÃO -->
                ${data.compensationTrack.length > 0 ? `
                <div class="section-card">
                    <h3 class="text-xl font-bold text-uisa-blue mb-4">Trilha de Remuneração por Performance</h3>
                    <div class="overflow-x-auto">
                        <table class="min-w-full bg-white text-sm">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="py-2 px-3 text-left text-xs font-semibold text-gray-500 uppercase">Nível</th>
                                    <th class="py-2 px-3 text-left text-xs font-semibold text-gray-500 uppercase">Prazo</th>
                                    <th class="py-2 px-3 text-left text-xs font-semibold text-gray-500 uppercase">Gatilho / Meta</th>
                                    <th class="py-2 px-3 text-left text-xs font-semibold text-gray-500 uppercase">Salário Projetado</th>
                                    ${data.compensationTrack[0].positionInRange ? '<th class="py-2 px-3 text-left text-xs font-semibold text-gray-500 uppercase">Posição na Faixa</th>' : ''}
                                </tr>
                            </thead>
                            <tbody>
                                ${data.compensationTrack.map(track => `
                                <tr class="border-b">
                                    <td class="py-3 px-3 font-bold">${track.level}</td>
                                    <td class="py-3 px-3">${track.timeline}</td>
                                    <td class="py-3 px-3">${track.trigger}</td>
                                    <td class="py-3 px-3 font-semibold text-gray-800">${track.projectedSalary}</td>
                                    ${track.positionInRange ? `<td class="py-3 px-3 font-bold text-uisa-blue">${track.positionInRange}</td>` : ''}
                                </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                ` : ''}
                
                <!-- PLANO DE AÇÃO -->
                <div class="section-card">
                    <h3 class="text-xl font-bold text-uisa-blue mb-4">Plano de Ação Detalhado (70-20-10)</h3>
                    <div class="space-y-4">
                        ${data.actionPlan.onTheJob.length > 0 ? `
                        <div>
                            <p class="font-bold text-uisa-orange">70% - Aprendizado na Prática (On-the-Job)</p>
                            <ul class="list-disc list-inside text-sm text-gray-600 mt-1">
                                ${data.actionPlan.onTheJob.map(action => `<li>${action}</li>`).join('')}
                            </ul>
                        </div>
                        ` : ''}
                        ${data.actionPlan.social.length > 0 ? `
                        <div>
                            <p class="font-bold text-uisa-light-blue">20% - Aprendizado com Outros (Social)</p>
                            <ul class="list-disc list-inside text-sm text-gray-600 mt-1">
                                ${data.actionPlan.social.map(action => `<li>${action}</li>`).join('')}
                            </ul>
                        </div>
                        ` : ''}
                        ${data.actionPlan.formal.length > 0 ? `
                        <div>
                            <p class="font-bold text-uisa-blue">10% - Aprendizado Formal</p>
                            <ul class="list-disc list-inside text-sm text-gray-600 mt-1">
                                ${data.actionPlan.formal.map(action => `<li>${action}</li>`).join('')}
                            </ul>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <!-- PACTO DE RESPONSABILIDADES -->
                <div class="section-card">
                    <h3 class="text-xl font-bold text-uisa-blue mb-4">Pacto de Performance e Responsabilidades</h3>
                    <div class="space-y-6">
                        ${data.responsibilityPact.employee.length > 0 ? `
                        <div>
                            <p class="font-bold text-uisa-orange">Responsabilidades do Colaborador (O Protagonista)</p>
                            <ul class="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                                ${data.responsibilityPact.employee.map(resp => `<li>${resp}</li>`).join('')}
                            </ul>
                        </div>
                        ` : ''}
                        ${data.responsibilityPact.leadership.length > 0 ? `
                        <div>
                            <p class="font-bold text-uisa-blue">Responsabilidades da Liderança (Sponsor e Mentor)</p>
                            <ul class="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                                ${data.responsibilityPact.leadership.map(resp => `<li>${resp}</li>`).join('')}
                            </ul>
                        </div>
                        ` : ''}
                        ${data.responsibilityPact.dho.length > 0 ? `
                        <div>
                            <p class="font-bold text-uisa-green">Responsabilidades do DHO (O Guardião)</p>
                            <ul class="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                                ${data.responsibilityPact.dho.map(resp => `<li>${resp}</li>`).join('')}
                            </ul>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>

            <!-- SIDEBAR -->
            <div class="space-y-6">
                <div class="section-card">
                    <h3 class="text-xl font-bold text-uisa-blue mb-4">Cronograma de Acompanhamento</h3>
                    <p class="text-sm text-gray-600 mb-4">Registre aqui as avaliações trimestrais de progresso do PDI.</p>
                    <div class="space-y-4">
                        <div><label for="review-date" class="block text-sm font-medium text-gray-700">Data da Avaliação</label><input type="date" id="review-date" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></div>
                        <div><label for="performance-level" class="block text-sm font-medium text-gray-700">Índice de Performance (IP - 1 a 5)</label><input type="number" id="performance-level" min="1" max="5" step="0.1" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></div>
                        <div><label for="review-feedback" class="block text-sm font-medium text-gray-700">Feedback e Próximos Passos</label><textarea id="review-feedback" rows="4" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea></div>
                        <button id="add-review-btn" class="w-full bg-uisa-green text-white font-bold py-2 px-4 rounded-md hover:bg-uisa-blue transition">Adicionar Registro</button>
                    </div>
                </div>
                <div class="section-card">
                    <h3 class="text-xl font-bold text-uisa-blue mb-4">Histórico de Acompanhamentos</h3>
                    <div id="history-container" class="space-y-4 max-h-96 overflow-y-auto">
                        <p class="text-sm text-gray-500">Nenhum registro adicionado ainda.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const competencyCtx = document.getElementById('competency-chart').getContext('2d');
            new Chart(competencyCtx, {
                type: 'radar',
                data: {
                    labels: ${JSON.stringify(data.competencyChart.labels)},
                    datasets: [{
                        label: 'Perfil Alvo (Performance Topo)',
                        data: ${JSON.stringify(data.competencyChart.targetProfile)},
                        backgroundColor: 'rgba(101, 179, 46, 0.2)',
                        borderColor: '#65B32E',
                        borderWidth: 2,
                        pointBackgroundColor: '#65B32E'
                    }, {
                        label: 'Perfil Atual',
                        data: ${JSON.stringify(data.competencyChart.currentProfile)},
                        backgroundColor: 'rgba(0, 45, 98, 0.2)',
                        borderColor: '#002D62',
                        borderWidth: 2,
                        pointBackgroundColor: '#002D62'
                    }]
                },
                options: {
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            angleLines: { color: 'rgba(0, 0, 0, 0.1)' },
                            grid: { color: 'rgba(0, 0, 0, 0.1)' },
                            pointLabels: { font: { size: 10 } },
                            suggestedMin: 0,
                            suggestedMax: 10
                        }
                    },
                    plugins: { legend: { position: 'top' } }
                }
            });

            // Sistema de acompanhamento interativo
            document.getElementById('add-review-btn').addEventListener('click', () => {
                const dateInput = document.getElementById('review-date');
                const levelInput = document.getElementById('performance-level');
                const feedbackInput = document.getElementById('review-feedback');
                const historyContainer = document.getElementById('history-container');

                const date = dateInput.value;
                const level = levelInput.value;
                const feedback = feedbackInput.value;

                if (!date || !level || !feedback) {
                    alert('Por favor, preencha todos os campos do registro.');
                    return;
                }

                const [year, month, day] = date.split('-');
                const formattedDate = \`\${day}/\${month}/\${year}\`;

                if (historyContainer.querySelector('.text-sm')) {
                    historyContainer.innerHTML = '';
                }

                const reviewCard = document.createElement('div');
                reviewCard.className = 'border-t border-gray-200 pt-4';
                reviewCard.innerHTML = \`
                    <div class="flex justify-between items-center">
                        <p class="font-bold text-gray-700">\${formattedDate}</p>
                        <p class="font-bold text-uisa-green">IP: \${level}</p>
                    </div>
                    <p class="mt-2 text-sm text-gray-600">\${feedback}</p>
                \`;
                historyContainer.prepend(reviewCard);

                dateInput.value = '';
                levelInput.value = '';
                feedbackInput.value = '';
            });
        });
    </script>
</body>
</html>`;
}
