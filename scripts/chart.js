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
    // Parse the date string and adjust for timezone
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    const dayStr = date.getDate().toString().padStart(2, '0');
    const monthStr = (date.getMonth() + 1).toString().padStart(2, '0');

    return `${ChartConfig.weekDays[date.getDay()]} ${dayStr}/${monthStr}`;
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
   * Shows a message when there's no data
   */
  showNoDataMessage() {
    const chartContainer = document.getElementById("calories-chart-container");
    if (!chartContainer) return;

    chartContainer.innerHTML = `
      <div class="card mb-4">
        <div class="card-body">
          <div class="text-center p-4">
            <p class="text-muted mb-0">
              <i class="bi bi-info-circle me-2"></i>
              Sem refeições recentes - adicione refeições para visualizar mais dados
            </p>
          </div>
        </div>
      </div>
    `;
  }
};

window.updateCaloriesChart = async () => {
  setTimeout(async () => {
    try {
      const stats = await StatsService.loadStats();

      if (!stats.history || stats.history.length === 0) {
        CaloriesChart.showNoDataMessage();
      } else {
        const chartContainer = document.getElementById("calories-chart-container");
        if (!chartContainer) return;

        let canvas = document.getElementById('caloriesChart');
        if (!canvas) {
          canvas = document.createElement('canvas');
          canvas.id = 'caloriesChart';
          chartContainer.innerHTML = '';
          chartContainer.appendChild(canvas);
        }

        const data = CaloriesChart.prepareChartData(stats);
        if (CaloriesChart.instance) {
          CaloriesChart.instance.data.labels = data.labels;
          CaloriesChart.instance.data.datasets[0].data = data.calories;
          CaloriesChart.instance.data.datasets[1].data = data.limit;
          CaloriesChart.instance.update();
        } else {
          CaloriesChart.instance = new Chart(canvas, CaloriesChart.createChartConfig(data));
        }
      }

      RatesDisplay.update(stats);
    } catch (error) {
      console.error('Error updating chart and rates:', error);
      RatesDisplay.update({ bmr: 0, tdee: 0 });
      CaloriesChart.showNoDataMessage();
    }
  }, 500);
};

window.initCaloriesChart = async () => {
  try {
    const stats = await StatsService.loadStats();

    if (!stats.history || stats.history.length === 0) {
      CaloriesChart.showNoDataMessage();
    } else {
      const chartContainer = document.getElementById("calories-chart-container");
      if (!chartContainer) return;

      const canvas = document.createElement('canvas');
      canvas.id = 'caloriesChart';
      chartContainer.innerHTML = '';
      chartContainer.appendChild(canvas);

      const data = CaloriesChart.prepareChartData(stats);
      CaloriesChart.instance = new Chart(canvas, CaloriesChart.createChartConfig(data));
    }

    RatesDisplay.update(stats);
  } catch (error) {
    console.error('Error initializing chart and rates:', error);
    RatesDisplay.update({ bmr: 0, tdee: 0 });
    CaloriesChart.showNoDataMessage();
  }
};
