export function crearGraficaLuz() {
  const ctx = document.getElementById('graficaLuz').getContext('2d');
  luzChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: '💡 Intensidad de Luz',
          data: luzData,
          borderColor: 'gold',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: 'gold',
          tension: 0.3,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Intensidad',
            font: { size: 16 }
          }
        },
        x: {
          title: {
            display: true,
            text: 'Hora',
            font: { size: 16 }
          }
        }
      },
      plugins: {
        legend: {
          position: 'top'
        }
      }
    }
  });
}