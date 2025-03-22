/**
 * @typedef {Object} HistoryItem
 * @property {number} value
 * @property {number} weekday
 */

/**
 * @typedef {Object} Stats
 * @property {number} bmr - BMR
 * @property {number} tdee - TDEE
 * @property {HistoryItem[]} history - Calories history
 * @returns {Promise<Stats>}
 */
const loadStats = async () => {
  const response = await fetch('http://192.168.1.17:5000/stats');
  const stats = await response.json();
  return stats;
}

function getWeekDayName(date) {
  const weekDays = [
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
    "Domingo",
  ];
  return weekDays[date.getDay()];
}

async function initCaloriesChart() {
  const stats = await loadStats();

  const today = new Date();
  const labels = [];
  const caloriesData = Array(7).fill(null);

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    labels.push(getWeekDayName(date));
  }

  stats.history.forEach(item => {
    caloriesData[item.weekday] = item.value;
  });

  const calorieLimit = stats.tdee;

  const ctx = document.getElementById("caloriesChart");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Consumo Calórico",
          data: caloriesData,
          borderColor: "rgb(75, 192, 192)",
          tension: 0.1,
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: "Limite Calórico",
          data: Array(labels.length).fill(calorieLimit),
          borderColor: "rgb(255, 99, 132)",
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Calorias",
          },
        },
        x: {
          title: {
            display: true,
            text: "Dia da Semana",
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45,
          },
        },
      },
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "Consumo Calórico dos Últimos 7 Dias",
        },
        tooltip: {
          callbacks: {
            title: function (tooltipItems) {
              return tooltipItems[0].label;
            },
            label: function (context) {
              return `${context.dataset.label}: ${context.parsed.y} kcal`;
            },
          },
        },
      },
    },
  });
}

document.addEventListener("DOMContentLoaded", initCaloriesChart);
