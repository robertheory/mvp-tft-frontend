/**
 * @typedef {Object} HistoryItem
 * @property {number} value - Caloric value
 * @property {string} date - Date in MM/DD format
 */

/**
 * @typedef {Object} Rates
 * @property {number} bmr - BMR
 * @property {number} tdee - TDEE
 */

/**
 * @typedef {Object} Stats
 * @property {number} bmr - BMR
 * @property {number} tdee - TDEE
 * @property {HistoryItem[]} history - Calories history
 */

/**
 * Loads BMR and TDEE rates from the API
 * @returns {Promise<Rates>}
 */
const loadRates = async () => {
  const response = await fetch('http://192.168.1.17:5000/stats/rates');
  return await response.json();
}

/**
 * Loads calories history from the API
 * @returns {Promise<HistoryItem[]>}
 */
const loadHistory = async () => {
  const response = await fetch('http://192.168.1.17:5000/stats/history');
  return await response.json();
}

/**
 * Loads all stats data from the API
 * @returns {Promise<Stats>}
 */
const loadStats = async () => {
  const [rates, history] = await Promise.all([
    loadRates(),
    loadHistory()
  ]);

  return {
    bmr: rates.bmr,
    tdee: rates.tdee,
    history: history
  };
}

function getWeekDayName(dateStr) {
  const weekDays = [
    "DOM", // Domingo
    "SEG", // Segunda
    "TER", // Terça
    "QUA", // Quarta
    "QUI", // Quinta
    "SEX", // Sexta
    "SAB"  // Sábado
  ];

  // Parse the full date string to a Date object
  const date = new Date(dateStr);

  // Format the date as dd/mm
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');

  return `${weekDays[date.getDay()]} ${day}/${month}`;
}

async function initCaloriesChart() {
  const stats = await loadStats();
  const calorieLimit = stats.tdee;

  const sortedHistory = [...stats.history].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA - dateB;
  });

  const filteredData = {
    labels: [],
    calories: [],
    limit: []
  };

  sortedHistory.forEach(item => {
    filteredData.labels.push(getWeekDayName(item.date));
    filteredData.calories.push(item.value);
    filteredData.limit.push(calorieLimit);
  });

  const ctx = document.getElementById("caloriesChart");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: filteredData.labels,
      datasets: [
        {
          label: "Consumo Calórico",
          data: filteredData.calories,
          borderColor: "rgb(75, 192, 192)",
          tension: 0.1,
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: "Limite Calórico",
          data: filteredData.limit,
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
