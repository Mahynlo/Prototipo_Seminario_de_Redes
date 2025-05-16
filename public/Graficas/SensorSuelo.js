export function crearGraficaSoil() {
  const ctx = document.getElementById('graficaSoil').getContext('2d');

  soilChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: '🪴 Nivel de humedad en el suelo',
          data: soilData,
          borderColor: 'brown',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: 'brown',
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