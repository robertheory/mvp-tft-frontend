/**
 * @typedef {Object} HistoryItem
 * @property {number} value - Caloric value
 * @property {string} date - Full date string
 */

/**
 * @typedef {Object} Rates
 * @property {number} bmr - Basal Metabolic Rate
 * @property {number} tdee - Total Daily Energy Expenditure
 */

/**
 * @typedef {Object} Stats
 * @property {number} bmr - Basal Metabolic Rate
 * @property {number} tdee - Total Daily Energy Expenditure
 * @property {HistoryItem[]} history - Caloric history
 */


const ChartConfig = {
  colors: {
    consumption: 'rgb(75, 192, 192)',
    limit: 'rgb(255, 99, 132)'
  },
  weekDays: ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"]
};

const StatsService = {
  /**
   * @returns {Promise<Rates>}
   */
  async loadRates() {
    const response = await fetch('http://192.168.1.17:5000/stats/rates');
    return await response.json();
  },

  /**
   * @returns {Promise<HistoryItem[]>}
   */
  async loadHistory() {
    const response = await fetch('http://192.168.1.17:5000/stats/history');
    return await response.json();
  },

  /**
   * @returns {Promise<Stats>}
   */
  async loadStats() {
    const [rates, history] = await Promise.all([
      this.loadRates(),
      this.loadHistory()
    ]);

    return {
      bmr: rates.bmr,
      tdee: rates.tdee,
      history: history
    };
  }
};

const DateFormatter = {
  /**
   * Formats a date string with weekday
   * @param {string} dateStr - Input date string
   * @returns {string} Formatted date (e.g., "DOM 07/04")
   */
  formatDateWithWeekDay(dateStr) {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    return `${ChartConfig.weekDays[date.getDay()]} ${day}/${month}`;
  }
};

const RatesDisplay = {
  /**
   * Updates the metabolic rates display
   * @param {Stats} stats
   */
  update(stats) {
    const container = document.getElementById('rates-container');
    if (!container) return;

    container.className = 'card mb-4';
    container.innerHTML = `
      <div class="card-body">
        <div class="d-flex justify-content-around">
          <div class="text-center">
            <h6 class="text-muted mb-2">Taxa Basal Metabólica (TBM)</h6>
            <p class="h3 mb-0">${Math.round(stats.bmr)} kcal</p>
          </div>
          <div class="text-center">
            <h6 class="text-muted mb-2">Gasto Energético Total (GET)</h6>
            <p class="h3 mb-0">${Math.round(stats.tdee)} kcal</p>
          </div>
        </div>
      </div>
    `;
  }
};

const CaloriesChart = {
  instance: null,

  /**
   * @param {Stats} stats
   * @returns {Object} Formatted chart data
   */
  prepareChartData(stats) {
    const sortedHistory = [...stats.history].sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });

    return {
      labels: sortedHistory.map(item => DateFormatter.formatDateWithWeekDay(item.date)),
      calories: sortedHistory.map(item => item.value),
      limit: sortedHistory.map(() => stats.tdee)
    };
  },

  /**
   * @param {Object} data
   * @returns {Object} Chart.js configuration
   */
  createChartConfig(data) {
    return {
      type: "line",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "Consumo Calórico",
            data: data.calories,
            borderColor: ChartConfig.colors.consumption,
            tension: 0.1,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: "Limite Calórico",
            data: data.limit,
            borderColor: ChartConfig.colors.limit,
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
    };
  },

  /**
   * Updates chart data and display
   */
  async update() {
    const stats = await StatsService.loadStats();
    const data = this.prepareChartData(stats);

    RatesDisplay.update(stats);

    if (this.instance) {
      this.instance.data.labels = data.labels;
      this.instance.data.datasets[0].data = data.calories;
      this.instance.data.datasets[1].data = data.limit;
      this.instance.update();
    }
  },

  /**
   * Initializes the chart
   */
  async init() {
    const stats = await StatsService.loadStats();
    const data = this.prepareChartData(stats);

    RatesDisplay.update(stats);

    const ctx = document.getElementById("caloriesChart");
    if (!ctx) return;

    this.instance = new Chart(ctx, this.createChartConfig(data));
  }
};

window.updateCaloriesChart = () => {
  setTimeout(() => CaloriesChart.update(), 500);
};

window.updateRates = async () => {
  const stats = await StatsService.loadStats();
  RatesDisplay.update(stats);
};

document.addEventListener("DOMContentLoaded", () => CaloriesChart.init());
