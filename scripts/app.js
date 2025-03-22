// Application state
const state = {
  foods: [],
  modals: {
    profile: null,
    meal: null,
    editMeal: null
  },
  toast: null
};

// UI manipulation functions
const UI = {
  showToast(message, type = 'success') {
    const toastElement = document.getElementById('toast');
    const toastBody = toastElement.querySelector('.toast-body');

    toastElement.className = `toast bg-${type}`;
    toastBody.textContent = message;

    state.toast = new bootstrap.Toast(toastElement);
    state.toast.show();
  },

  createFoodOption(food) {
    const foodOption = document.createElement('option');
    const foodLabel = `${food.name} (${food.unit}) - ${food.calories} kcal`;
    foodOption.value = food.id;
    foodOption.innerText = foodLabel;
    return foodOption;
  },

  createFoodTableRow(food, isEdit = false) {
    const selectedFoodElement = document.createElement('tr');
    selectedFoodElement.setAttribute('data-food-id', food.id);

    const deleteFoodButton = document.createElement('button');
    deleteFoodButton.type = 'button';
    deleteFoodButton.className = 'btn btn-danger';
    deleteFoodButton.addEventListener('click', () => handleDeleteSelectedFood(food.id, isEdit));

    const deleteIcon = document.createElement('i');
    deleteIcon.className = 'bi bi-x';
    deleteFoodButton.appendChild(deleteIcon);

    const deleteFoodButtonCell = document.createElement('td');
    deleteFoodButtonCell.appendChild(deleteFoodButton);

    selectedFoodElement.innerHTML = `
      <td>${food.name} (${food.unit})</td>
      <td>${food.calories} kcal</td>
      <td>
        <input type="number" name="quantity[${food.id}]" class="form-control" min="0" required value="${food.quantity || 0}">
      </td>
    `;

    selectedFoodElement.appendChild(deleteFoodButtonCell);
    return selectedFoodElement;
  }
};

// Data manipulation functions
const DataService = {
  async loadFoods() {
    const localFoods = localStorage.getItem('foods');
    if (!localFoods) {
      const response = await fetch('http://192.168.1.17:5000/foods');
      const foods = await response.json();
      localStorage.setItem('foods', JSON.stringify(foods));
      state.foods = foods;
      return foods;
    }
    state.foods = JSON.parse(localFoods);
    return state.foods;
  },

  async loadMeals() {
    try {
      const response = await fetch('http://192.168.1.17:5000/meals');
      return await response.json();
    } catch (error) {
      return [];
    }
  },

  async loadActivityLevels() {
    try {
      const response = await fetch('http://192.168.1.17:5000/activity-levels');
      return await response.json() || [];
    } catch (error) {
      return [];
    }
  },

  async loadGoals() {
    try {
      const response = await fetch('http://192.168.1.17:5000/goals');
      return await response.json() || [];
    } catch (error) {
      return [];
    }
  },

  async loadCurrentPersonalInfo() {
    try {
      const response = await fetch('http://192.168.1.17:5000/personal-info');
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      return null;
    }
  }
};

// Form manipulation functions
const FormHandler = {
  saveFormData() {
    const form = document.getElementById('new-meal-form');
    const formData = new FormData(form);
    const selectedFoodsTableBody = document.getElementById('selected-foods-table-body');

    if (!selectedFoodsTableBody) return;

    const foods = Array.from(selectedFoodsTableBody.querySelectorAll('tr')).map(row => {
      const foodId = row.getAttribute('data-food-id');
      const quantityInput = row.querySelector(`input[name="quantity[${foodId}]"]`);
      const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
      return { id: foodId, quantity };
    });

    const data = {
      title: formData.get('title') || '',
      date: formData.get('date') || new Date().toISOString().slice(0, 16),
      foods
    };

    localStorage.setItem('tft:new-meal-form', JSON.stringify(data));
  },

  getSelectedFoods(isEdit = false) {
    const tableBodyId = isEdit ? 'edit-selected-foods-table-body' : 'selected-foods-table-body';
    const selectedFoodsTableBody = document.getElementById(tableBodyId);

    if (!selectedFoodsTableBody) return [];

    return Array.from(selectedFoodsTableBody.querySelectorAll('tr')).map(row => {
      const foodId = row.getAttribute('data-food-id');
      const quantityInput = row.querySelector(`input[name="quantity[${foodId}]"]`);
      const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
      return { id: foodId, quantity };
    });
  },

  addFoodToSelectedTable(foodId, isEdit = false) {
    const containerId = isEdit ? 'edit-foods-data-container' : 'foods-data-container';
    const tableBodyId = isEdit ? 'edit-selected-foods-table-body' : 'selected-foods-table-body';

    const foodsDataContainer = document.getElementById(containerId);
    const selectedFoodsTableBody = document.getElementById(tableBodyId);

    if (!foodsDataContainer || !selectedFoodsTableBody) return;

    const existingFood = selectedFoodsTableBody.querySelector(`tr[data-food-id="${foodId}"]`);
    if (existingFood) return;

    const food = state.foods.find(food => food.id === foodId);
    if (!food) return;

    const foodDataInput = document.createElement('input');
    foodDataInput.type = 'hidden';
    foodDataInput.name = `foods[${food.id}]`;
    foodDataInput.value = food.id;
    foodsDataContainer.appendChild(foodDataInput);

    const selectedFoodElement = UI.createFoodTableRow(food, isEdit);
    selectedFoodsTableBody.appendChild(selectedFoodElement);

    if (!isEdit) {
      FormHandler.saveFormData();
    }
  },

  handleDeleteSelectedFood(foodId, isEdit = false) {
    const tableBodyId = isEdit ? 'edit-selected-foods-table-body' : 'selected-foods-table-body';
    const containerId = isEdit ? 'edit-foods-data-container' : 'foods-data-container';

    const selectedFoodsTableBody = document.getElementById(tableBodyId);
    const foodsDataContainer = document.getElementById(containerId);

    if (!selectedFoodsTableBody || !foodsDataContainer) return;

    selectedFoodsTableBody.removeChild(selectedFoodsTableBody.querySelector(`tr[data-food-id="${foodId}"]`));

    const foodInput = foodsDataContainer.querySelector(`input[name="foods[${foodId}]"]`);
    if (foodInput) {
      foodsDataContainer.removeChild(foodInput);
    }

    if (!isEdit) {
      FormHandler.saveFormData();
    }
  }
};

// Meal manipulation functions
const MealHandler = {
  async handleEditMeal(mealId) {
    try {
      const response = await fetch(`http://192.168.1.17:5000/meals/${mealId}`);
      if (!response.ok) throw new Error('Failed to fetch meal');
      const meal = await response.json();
      this.populateEditForm(meal);
      state.modals.editMeal.show();
    } catch (error) {
      UI.showToast('Error loading meal. Please try again.', 'danger');
    }
  },

  populateEditForm(meal) {
    const form = document.getElementById('edit-meal-form');
    if (!form) return;

    form.elements['id'].value = meal.id;
    form.elements['title'].value = meal.title;

    const mealDate = new Date(meal.date);
    mealDate.setHours(mealDate.getHours() - 3);
    form.elements['date'].value = mealDate.toISOString().slice(0, 16);

    const selectedFoodsTableBody = document.getElementById('edit-selected-foods-table-body');
    const foodsDataContainer = document.getElementById('edit-foods-data-container');

    if (selectedFoodsTableBody && foodsDataContainer) {
      selectedFoodsTableBody.innerHTML = '';
      foodsDataContainer.innerHTML = '';

      meal.foods.forEach(food => {
        const foodDataInput = document.createElement('input');
        foodDataInput.type = 'hidden';
        foodDataInput.name = `foods[${food.id}]`;
        foodDataInput.value = food.id;
        foodsDataContainer.appendChild(foodDataInput);

        const selectedFoodElement = UI.createFoodTableRow(food, true);
        selectedFoodsTableBody.appendChild(selectedFoodElement);
      });
    }
  },

  async submitEditMeal(e) {
    try {
      e.preventDefault();
      const formData = new FormData(e.target);
      const mealId = formData.get('id');
      const formattedDate = new Date(formData.get('date')).toISOString();
      const foods = FormHandler.getSelectedFoods(true);

      const response = await fetch(`http://192.168.1.17:5000/meals/${mealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.get('title'),
          date: formattedDate,
          foods,
        }),
      });

      if (response.ok) {
        UI.showToast('Meal updated successfully!', 'success');
        await this.loadAndRenderMeals();
        state.modals.editMeal.hide();
        window.updateCaloriesChart();
      } else {
        UI.showToast('Error updating meal. Please try again.', 'danger');
      }
    } catch (error) {
      UI.showToast('Error updating meal. Please try again.', 'danger');
    }
  },

  async submitNewMeal(e) {
    try {
      e.preventDefault();
      const formData = new FormData(e.target);
      const formattedDate = new Date(formData.get('date')).toISOString();
      const foods = FormHandler.getSelectedFoods();

      const response = await fetch('http://localhost:5000/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.get('title'),
          date: formattedDate,
          foods,
        }),
      });

      if (response.ok) {
        UI.showToast('Meal created successfully!', 'success');
        await this.loadAndRenderMeals();
        e.target.reset();
        window.updateCaloriesChart();
      } else {
        UI.showToast('Error creating meal. Please try again.', 'danger');
      }
    } catch (error) {
      UI.showToast('Error creating meal. Please try again.', 'danger');
    }
  },

  async handleDeleteMeal(mealId) {
    try {
      const response = await fetch(`http://192.168.1.17:5000/meals/${mealId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        UI.showToast('Meal deleted successfully!', 'success');
        await this.loadAndRenderMeals();
        window.updateCaloriesChart();
      } else {
        UI.showToast('Error deleting meal. Please try again.', 'danger');
      }
    } catch (error) {
      UI.showToast('Error deleting meal. Please try again.', 'danger');
    }
  },

  renderMeals(meals) {
    const mealsTable = document.getElementById('meals-table-body');
    if (!mealsTable) return;

    mealsTable.innerHTML = '';
    const sortedMeals = meals.sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedMeals.forEach(meal => {
      const mealElement = document.createElement('tr');
      const mealDate = new Date(meal.date).toLocaleString('pt-BR');
      const totalCalories = meal.foods.reduce((acc, food) => acc + food.calories * food.quantity, 0);

      const actionsContainer = document.createElement('div');
      actionsContainer.style.display = 'flex';
      actionsContainer.style.justifyContent = 'center';
      actionsContainer.style.alignItems = 'center';
      actionsContainer.style.gap = '0.5rem';

      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'btn btn-primary';
      editButton.title = 'Edit meal';
      editButton.innerHTML = '<i class="bi bi-pencil"></i>';
      editButton.addEventListener('click', () => this.handleEditMeal(meal.id));

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'btn btn-danger';
      deleteButton.title = 'Delete meal';
      deleteButton.innerHTML = '<i class="bi bi-trash"></i>';
      deleteButton.addEventListener('click', () => this.handleDeleteMeal(meal.id));

      actionsContainer.appendChild(editButton);
      actionsContainer.appendChild(deleteButton);

      mealElement.innerHTML = `
        <td>${meal.title}</td>
        <td>${totalCalories} kcal</td>
        <td>${mealDate}</td>
      `;

      const actionsCell = document.createElement('td');
      actionsCell.className = 'meals-table__actions-column';
      actionsCell.appendChild(actionsContainer);
      mealElement.appendChild(actionsCell);

      mealsTable.appendChild(mealElement);
    });
  },

  async loadAndRenderMeals() {
    const meals = await DataService.loadMeals();
    this.renderMeals(meals);
  }
};

// Autocomplete manipulation functions
const AutocompleteHandler = {
  handleAutocompleteInput(input, isEdit = false) {
    const inputValue = input.value.toLowerCase();
    const resultsId = isEdit ? 'edit-autocomplete-results' : 'autocomplete-results';
    const results = document.getElementById(resultsId);

    if (inputValue.length > 0) {
      const filteredFoods = state.foods.filter(food =>
        food.name.toLowerCase().includes(inputValue)
      );

      if (filteredFoods.length > 0) {
        results.innerHTML = '';
        filteredFoods.forEach(food => {
          const foodOption = UI.createFoodOption(food);
          results.appendChild(foodOption);
        });
        results.classList.remove('d-none');
      } else {
        results.innerHTML = '<option>No food found</option>';
        results.classList.remove('d-none');
      }
    } else {
      results.classList.add('d-none');
    }
  },

  initAutocomplete() {
    const autocompleteInput = document.getElementById('autocomplete-input');
    const addFoodButton = document.getElementById('add-food-button');

    if (autocompleteInput && addFoodButton) {
      addFoodButton.addEventListener('click', () => {
        const results = document.getElementById('autocomplete-results');
        const selectedOption = results.options[results.selectedIndex];

        if (selectedOption?.value) {
          FormHandler.addFoodToSelectedTable(selectedOption.value);
          autocompleteInput.value = '';
          results.classList.add('d-none');
        }
      });

      autocompleteInput.addEventListener('input', () =>
        this.handleAutocompleteInput(autocompleteInput)
      );
    }

    const editAutocompleteInput = document.getElementById('edit-autocomplete-input');
    const editAddFoodButton = document.getElementById('edit-add-food-button');

    if (editAutocompleteInput && editAddFoodButton) {
      editAddFoodButton.addEventListener('click', () => {
        const results = document.getElementById('edit-autocomplete-results');
        const selectedOption = results.options[results.selectedIndex];

        if (selectedOption?.value) {
          FormHandler.addFoodToSelectedTable(selectedOption.value, true);
          editAutocompleteInput.value = '';
          results.classList.add('d-none');
        }
      });

      editAutocompleteInput.addEventListener('input', () =>
        this.handleAutocompleteInput(editAutocompleteInput, true)
      );
    }
  }
};

// Personal information manipulation functions
const PersonalInfoHandler = {
  async populateActivityLevels() {
    const select = document.getElementById('activity_level_id');
    if (!select) return;

    const activityLevels = await DataService.loadActivityLevels();
    activityLevels.forEach(level => {
      const option = document.createElement('option');
      option.value = level.id;
      option.textContent = `${level.name} - ${level.description}`;
      select.appendChild(option);
    });
  },

  async populateGoals() {
    const select = document.getElementById('goal_id');
    if (!select) return;

    const goals = await DataService.loadGoals();
    goals.forEach(goal => {
      const option = document.createElement('option');
      option.value = goal.id;
      option.textContent = goal.name;
      select.appendChild(option);
    });
  },

  async setupPersonalInfoForm() {
    const form = document.getElementById('personal-info-form');
    if (!form) return;

    await Promise.all([
      this.populateActivityLevels(),
      this.populateGoals()
    ]);

    const currentInfo = await DataService.loadCurrentPersonalInfo();
    if (currentInfo) {
      form.elements['age'].value = currentInfo.age;
      form.elements['gender'].value = currentInfo.gender;
      form.elements['weight'].value = currentInfo.weight;
      form.elements['height'].value = currentInfo.height;
      form.elements['activity_level_id'].value = currentInfo.activity_level_id;
      form.elements['goal_id'].value = currentInfo.goal_id;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = {
        age: parseInt(formData.get('age')),
        gender: formData.get('gender'),
        weight: parseFloat(formData.get('weight')),
        height: parseInt(formData.get('height')),
        activity_level_id: parseInt(formData.get('activity_level_id')),
        goal_id: parseInt(formData.get('goal_id'))
      };

      try {
        const response = await fetch('http://192.168.1.17:5000/personal-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (response.ok) {
          UI.showToast('Personal information updated successfully!', 'success');
        } else {
          UI.showToast('Error updating personal information. Please try again.', 'danger');
        }
      } catch (error) {
        UI.showToast('Error updating personal information. Please try again.', 'danger');
      }
    });
  }
};

// Application initialization
const initApp = async () => {
  // Load initial data
  await DataService.loadFoods();
  await MealHandler.loadAndRenderMeals();
  await PersonalInfoHandler.setupPersonalInfoForm();

  // Initialize modals
  state.modals = {
    profile: new bootstrap.Modal(document.getElementById("profileModal")),
    meal: new bootstrap.Modal(document.getElementById("mealModal")),
    editMeal: new bootstrap.Modal(document.getElementById("editMealModal"))
  };

  // Setup forms
  const newMealForm = document.getElementById('new-meal-form');
  if (newMealForm) {
    newMealForm.addEventListener('submit', (e) => {
      MealHandler.submitNewMeal(e);
      state.modals.meal.hide();
    });
    newMealForm.addEventListener('input', FormHandler.saveFormData);
    newMealForm.addEventListener('reset', () => {
      localStorage.removeItem('tft:new-meal-form');
      document.getElementById('foods-data-container').innerHTML = '';
      document.getElementById('selected-foods-table-body').innerHTML = '';
    });
  }

  const editMealForm = document.getElementById('edit-meal-form');
  if (editMealForm) {
    editMealForm.addEventListener('submit', (e) => {
      MealHandler.submitEditMeal(e);
      state.modals.editMeal.hide();
    });
  }

  const personalInfoForm = document.getElementById('personal-info-form');
  if (personalInfoForm) {
    personalInfoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      state.modals.profile.hide();
    });
  }

  // Initialize autocomplete
  AutocompleteHandler.initAutocomplete();
};

// Start the application when the DOM is ready
document.addEventListener("DOMContentLoaded", initApp);
