const handleDeleteSelectedFood = (foodId, isEdit = false) => {
  const tableBodyId = isEdit ? 'edit-selected-foods-table-body' : 'selected-foods-table-body';
  const containerId = isEdit ? 'edit-foods-data-container' : 'foods-data-container';

  const selectedFoodsTableBody = document.getElementById(tableBodyId);
  const foodsDataContainer = document.getElementById(containerId);

  if (!selectedFoodsTableBody || !foodsDataContainer) return;

  // Remove the table row
  selectedFoodsTableBody.removeChild(selectedFoodsTableBody.querySelector(`tr[data-food-id="${foodId}"]`));

  // Remove the hidden input from the container
  const foodInput = foodsDataContainer.querySelector(`input[name="foods[${foodId}]"]`);
  if (foodInput) {
    foodsDataContainer.removeChild(foodInput);
  }

  // Save form data after removing food
  if (!isEdit) {
    saveFormData();
  }
}

const saveFormData = () => {
  const form = document.getElementById('new-meal-form');
  const formData = new FormData(form);
  const selectedFoodsTableBody = document.getElementById('selected-foods-table-body');

  if (!selectedFoodsTableBody) return;

  const foods = [];
  const rows = selectedFoodsTableBody.querySelectorAll('tr');

  rows.forEach(row => {
    const foodId = row.getAttribute('data-food-id');
    const quantityInput = row.querySelector(`input[name="quantity[${foodId}]"]`);
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
    foods.push({ id: foodId, quantity });
  });

  const data = {
    title: formData.get('title') || '',
    date: formData.get('date') || new Date().toISOString().slice(0, 16),
    foods
  };

  localStorage.setItem('tft:new-meal-form', JSON.stringify(data));
}

const addFoodToSelectedTable = (foodId, isEdit = false) => {
  const foods = JSON.parse(localStorage.getItem('foods')) || [];
  const containerId = isEdit ? 'edit-foods-data-container' : 'foods-data-container';
  const tableBodyId = isEdit ? 'edit-selected-foods-table-body' : 'selected-foods-table-body';

  const foodsDataContainer = document.getElementById(containerId);
  const selectedFoodsTableBody = document.getElementById(tableBodyId);

  if (!foodsDataContainer || !selectedFoodsTableBody) return;

  // Check if food is already in the table
  const existingFood = selectedFoodsTableBody.querySelector(`tr[data-food-id="${foodId}"]`);
  if (existingFood) {
    return; // Food already exists, do nothing
  }

  const food = foods.find(food => food.id === foodId);

  if (!food) {
    return;
  }

  // Create hidden input for food data
  const foodDataInput = document.createElement('input');
  foodDataInput.type = 'hidden';
  foodDataInput.name = `foods[${food.id}]`;
  foodDataInput.value = food.id;
  foodsDataContainer.appendChild(foodDataInput);

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
      <input type="number" name="quantity[${food.id}]" class="form-control" min="0" required value="0">
    </td>
  `;

  selectedFoodElement.appendChild(deleteFoodButtonCell);
  selectedFoodsTableBody.appendChild(selectedFoodElement);

  // Save form data after adding food
  if (!isEdit) {
    saveFormData();
  }
}

const getSelectedFoods = (isEdit = false) => {
  const tableBodyId = isEdit ? 'edit-selected-foods-table-body' : 'selected-foods-table-body';
  const selectedFoodsTableBody = document.getElementById(tableBodyId);

  if (!selectedFoodsTableBody) return [];

  const foods = [];
  const rows = selectedFoodsTableBody.querySelectorAll('tr');

  rows.forEach(row => {
    const foodId = row.getAttribute('data-food-id');
    const quantityInput = row.querySelector(`input[name="quantity[${foodId}]"]`);
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
    foods.push({ id: foodId, quantity });
  });

  return foods;
}

const populateEditForm = (meal) => {
  const form = document.getElementById('edit-meal-form');
  if (!form) return;

  // Set basic form fields
  form.elements['id'].value = meal.id;
  form.elements['title'].value = meal.title;
  form.elements['date'].value = new Date(meal.date).toISOString().slice(0, 16);

  // Clear existing foods
  const selectedFoodsTableBody = document.getElementById('edit-selected-foods-table-body');
  const foodsDataContainer = document.getElementById('edit-foods-data-container');

  if (selectedFoodsTableBody && foodsDataContainer) {
    selectedFoodsTableBody.innerHTML = '';
    foodsDataContainer.innerHTML = '';

    // Add each food from the meal
    meal.foods.forEach(food => {
      addFoodToSelectedTable(food.id, true);
      const row = selectedFoodsTableBody.querySelector(`tr[data-food-id="${food.id}"]`);
      if (row) {
        const quantityInput = row.querySelector(`input[name="quantity[${food.id}]"]`);
        if (quantityInput) {
          quantityInput.value = food.quantity;
        }
      }
    });
  }
}

const handleEditMeal = async (mealId) => {
  try {
    const response = await fetch(`http://192.168.1.17:5000/meals/${mealId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch meal');
    }
    const meal = await response.json();
    populateEditForm(meal);
    editMealModal.show();
  } catch (error) {
    console.error('Error fetching meal:', error);
    showToast('Erro ao carregar refeição. Por favor, tente novamente.', 'danger');
  }
};

const submitEditMeal = async (e) => {
  try {
    e.preventDefault();

    const formData = new FormData(e.target);
    const mealId = formData.get('id');
    const formattedDate = new Date(formData.get('date')).toISOString();

    // Get all food IDs and their quantities
    const foods = getSelectedFoods(true);

    const requestBody = {
      title: formData.get('title'),
      date: formattedDate,
      foods,
    };

    const response = await fetch(`http://192.168.1.17:5000/meals/${mealId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      showToast('Refeição atualizada com sucesso!', 'success');
      await loadMeals();
      editMealModal.hide();
    } else {
      showToast('Erro ao atualizar refeição. Por favor, tente novamente.', 'danger');
    }
  } catch (error) {
    console.error('Error updating meal:', error);
    showToast('Erro ao atualizar refeição. Por favor, tente novamente.', 'danger');
  }
};

const submitNewMeal = async (e) => {
  try {
    e.preventDefault();

    const formData = new FormData(e.target);
    const formattedDate = new Date().toISOString();

    // Get all food IDs and their quantities
    const foods = getSelectedFoods();

    const requestBody = {
      title: formData.get('title'),
      date: formattedDate,
      foods,
    };

    const response = await fetch('http://localhost:5000/meals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      showToast('Refeição criada com sucesso!', 'success');
      await loadMeals();
      e.target.reset();
    } else {
      showToast('Erro ao criar refeição. Por favor, tente novamente.', 'danger');
    }
  } catch (error) {
    console.log('error', error);
    showToast('Erro ao criar refeição. Por favor, tente novamente.', 'danger');
  }
};

const setupForm = () => {
  const newMealForm = document.getElementById('new-meal-form');

  if (!newMealForm) return;

  newMealForm.addEventListener('submit', submitNewMeal);

  newMealForm.addEventListener('input', saveFormData);

  newMealForm.addEventListener('reset', () => {
    localStorage.removeItem('tft:new-meal-form');
    // Clear the foods data container and selected foods table
    const foodsDataContainer = document.getElementById('foods-data-container');
    const selectedFoodsTableBody = document.getElementById('selected-foods-table-body');

    if (foodsDataContainer) {
      foodsDataContainer.innerHTML = '';
    }
    if (selectedFoodsTableBody) {
      selectedFoodsTableBody.innerHTML = '';
    }
  });

  const localFormData = localStorage.getItem('tft:new-meal-form');

  if (!localFormData) {
    saveFormData();
  } else {
    const data = JSON.parse(localFormData);

    // Restore basic form fields
    newMealForm.elements['title'].value = data.title || '';
    newMealForm.elements['date'].value = data.date || new Date().toISOString().slice(0, 16);

    // Restore selected foods
    const foods = JSON.parse(localStorage.getItem('foods')) || [];
    const selectedFoodsTableBody = document.getElementById('selected-foods-table-body');
    const foodsDataContainer = document.getElementById('foods-data-container');

    if (selectedFoodsTableBody && foodsDataContainer) {
      // Clear existing content
      selectedFoodsTableBody.innerHTML = '';
      foodsDataContainer.innerHTML = '';

      // Restore each food
      data.foods.forEach(foodData => {
        const food = foods.find(f => f.id === foodData.id);
        if (food) {
          // Create hidden input
          const foodDataInput = document.createElement('input');
          foodDataInput.type = 'hidden';
          foodDataInput.name = `foods[${food.id}]`;
          foodDataInput.value = food.id;
          foodsDataContainer.appendChild(foodDataInput);

          // Create table row
          const selectedFoodElement = document.createElement('tr');
          selectedFoodElement.setAttribute('data-food-id', food.id);

          const deleteFoodButton = document.createElement('button');
          deleteFoodButton.type = 'button';
          deleteFoodButton.className = 'btn btn-danger';
          deleteFoodButton.addEventListener('click', () => handleDeleteSelectedFood(food.id));

          const deleteIcon = document.createElement('i');
          deleteIcon.className = 'bi bi-x';

          deleteFoodButton.appendChild(deleteIcon);

          const deleteFoodButtonCell = document.createElement('td');
          deleteFoodButtonCell.appendChild(deleteFoodButton);

          selectedFoodElement.innerHTML = `
            <td>${food.name} (${food.unit})</td>
            <td>${food.calories} kcal</td>
            <td>
              <input type="number" name="quantity[${food.id}]" class="form-control" min="0" required value="${foodData.quantity || 0}">
            </td>
          `;

          selectedFoodElement.appendChild(deleteFoodButtonCell);
          selectedFoodsTableBody.appendChild(selectedFoodElement);
        }
      });
    }
  }
}

const createFoodOption = (food) => {

  const foodOption = document.createElement('option');

  const foodLabel = `${food.name} (${food.unit}) - ${food.calories} kcal`;

  foodOption.value = food.id;
  foodOption.innerText = foodLabel;

  return foodOption;

}

const initAutocomplete = (foods) => {
  const autocompleteInput = document.getElementById('autocomplete-input')
  const addFoodButton = document.getElementById('add-food-button')

  if (!autocompleteInput) return;

  if (addFoodButton) {
    addFoodButton.addEventListener('click', () => {
      const results = document.getElementById('autocomplete-results');
      const selectedOption = results.options[results.selectedIndex];

      if (selectedOption && selectedOption.value) {
        addFoodToSelectedTable(selectedOption.value);
        autocompleteInput.value = '';
        results.classList.add('d-none');
      }
    });
  }

  autocompleteInput.addEventListener('input', function () {
    const input = this.value.toLowerCase();
    const results = document.getElementById('autocomplete-results');

    if (input.length > 0) {
      const filteredFoods = foods.filter(food => food.name.toLowerCase().includes(input));

      if (filteredFoods.length > 0) {

        results.innerHTML = '';

        filteredFoods.forEach(food => {
          const foodOption = createFoodOption(food);
          results.appendChild(foodOption);
        });

        results.classList.remove('d-none');
      } else {
        results.innerHTML = '<option>Nenhum alimento encontrado</option>';
        results.classList.remove('d-none');
      }
    } else {
      results.classList.add('d-none');
    }
  });


}

const loadFoods = async () => {
  const localFoods = localStorage.getItem('foods');

  if (!localFoods) {

    const response = await fetch('http://192.168.1.17:5000/foods')

    const { foods } = await response.json();

    localStorage.setItem('foods', JSON.stringify(foods));

    return foods;

  }

  return JSON.parse(localFoods);

}

const renderMeals = (meals) => {
  const mealsTable = document.getElementById('meals-table-body');

  if (!mealsTable) return;

  // clear table before adding new rows
  mealsTable.innerHTML = '';

  const sortedMeals = meals.sort((a, b) => new Date(b.date) - new Date(a.date));

  sortedMeals.forEach(meal => {
    const mealElement = document.createElement('tr');

    const mealDate = new Date(meal.date).toLocaleString('pt-BR');

    const totalCalories = meal.foods.reduce((acc, food) => acc + food.calories * food.quantity, 0);

    const deleteMealButton = document.createElement('button');
    deleteMealButton.type = 'button';
    deleteMealButton.className = 'btn btn-danger';
    deleteMealButton.addEventListener('click', () => handleDeleteMeal(meal.id));

    const deleteMealIcon = document.createElement('i');
    deleteMealIcon.className = 'bi bi-trash';
    deleteMealButton.appendChild(deleteMealIcon);

    const editMealButton = document.createElement('button');
    editMealButton.type = 'button';
    editMealButton.className = 'btn btn-primary';
    editMealButton.addEventListener('click', () => handleEditMeal(meal.id));

    const editMealIcon = document.createElement('i');
    editMealIcon.className = 'bi bi-pencil';
    editMealButton.appendChild(editMealIcon);

    const actionsCell = document.createElement('td');
    actionsCell.setAttribute('id', `${meal.id}-actions`);

    actionsCell.appendChild(editMealButton);
    actionsCell.appendChild(deleteMealButton);

    // styles must be display flex row align-items: center justify-content: center gap 1rem
    actionsCell.style.display = 'flex';
    actionsCell.style.justifyContent = 'center';
    actionsCell.style.alignItems = 'center';
    actionsCell.style.gap = '1rem';
    actionsCell.style.width = '100px';

    mealElement.innerHTML = `
      <td>${meal.title}</td>
      <td>${totalCalories} kcal</td>
      <td>${mealDate}</td>
    `;

    mealElement.appendChild(actionsCell);

    mealsTable.appendChild(mealElement);

  });
}

const loadMeals = async () => {

  try {

    const response = await fetch('http://192.168.1.17:5000/meals')

    const { meals } = await response.json();

    renderMeals(meals);

  } catch (error) {

    renderMeals([]);

  }


}

const handleDeleteMeal = async (mealId) => {
  try {
    const response = await fetch(`http://192.168.1.17:5000/meals/${mealId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      showToast('Refeição excluída com sucesso!', 'success');
      await loadMeals();
    } else {
      showToast('Erro ao excluir refeição. Por favor, tente novamente.', 'danger');
    }
  } catch (error) {
    console.error('Error deleting meal:', error);
    showToast('Erro ao excluir refeição. Por favor, tente novamente.', 'danger');
  }
};

const loadActivityLevels = async () => {
  try {
    const response = await fetch('http://192.168.1.17:5000/activity-levels');
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error loading activity levels:', error);
    return [];
  }
};

const loadGoals = async () => {
  try {
    const response = await fetch('http://192.168.1.17:5000/goals');
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error loading goals:', error);
    return [];
  }
};

const loadCurrentPersonalInfo = async () => {
  try {
    const response = await fetch('http://192.168.1.17:5000/personal-info/current');
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading current personal info:', error);
    return null;
  }
};

const populateActivityLevels = async () => {
  const select = document.getElementById('activity_level_id');
  if (!select) return;

  const activityLevels = await loadActivityLevels();

  activityLevels.forEach((level) => {
    const option = document.createElement('option');
    option.value = level.id;
    option.textContent = `${level.name} - ${level.description}`;
    select.appendChild(option);
  });
};

const populateGoals = async () => {
  const select = document.getElementById('goal_id');
  if (!select) return;

  const goals = await loadGoals();

  goals.forEach((goal) => {
    const option = document.createElement('option');
    option.value = goal.id;
    option.textContent = goal.name;
    select.appendChild(option);
  });
};

const showToast = (message, type = 'success') => {
  const toastElement = document.getElementById('toast');
  const toastBody = toastElement.querySelector('.toast-body');

  // Set toast background color based on type
  toastElement.className = `toast bg-${type}`;

  // Set message
  toastBody.textContent = message;

  // Show toast
  toast = new bootstrap.Toast(toastElement);
  toast.show();
};

const setupPersonalInfoForm = async () => {
  const form = document.getElementById('personal-info-form');
  if (!form) return;

  // Load and populate activity levels and goals
  await Promise.all([
    populateActivityLevels(),
    populateGoals()
  ]);

  // Load current personal info
  const currentInfo = await loadCurrentPersonalInfo();
  if (currentInfo) {
    form.elements['age'].value = currentInfo.age;
    form.elements['gender'].value = currentInfo.gender;
    form.elements['weight'].value = currentInfo.weight;
    form.elements['height'].value = currentInfo.height;
    form.elements['activity_level_id'].value = currentInfo.activity_level_id;
    form.elements['goal_id'].value = currentInfo.goal_id;
  }

  // Handle form submission
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        showToast('Informações pessoais atualizadas com sucesso!', 'success');
      } else {
        showToast('Erro ao atualizar informações pessoais. Por favor, tente novamente.', 'danger');
      }
    } catch (error) {
      console.error('Error submitting personal info:', error);
      showToast('Erro ao atualizar informações pessoais. Por favor, tente novamente.', 'danger');
    }
  });
};

// Modal instances
let profileModal;
let mealModal;
let editMealModal;
let toast;

const setupModals = () => {
  // Get modal instances
  profileModal = new bootstrap.Modal(document.getElementById("profileModal"));
  mealModal = new bootstrap.Modal(document.getElementById("mealModal"));
  editMealModal = new bootstrap.Modal(document.getElementById("editMealModal"));

  // Handle personal info form submission
  const personalInfoForm = document.getElementById("personal-info-form");
  if (personalInfoForm) {
    personalInfoForm.addEventListener("submit", function (e) {
      e.preventDefault();
      // The form submission logic is already handled in setupPersonalInfoForm
      profileModal.hide();
    });
  }

  // Handle meal form submission
  const mealForm = document.getElementById("new-meal-form");
  if (mealForm) {
    mealForm.addEventListener("submit", function (e) {
      e.preventDefault();
      // The form submission logic is already handled in submitNewMeal
      mealModal.hide();
    });
  }

  // Handle edit meal form submission
  const editMealForm = document.getElementById("edit-meal-form");
  if (editMealForm) {
    editMealForm.addEventListener("submit", submitEditMeal);
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  const foods = await loadFoods();

  await Promise.all([
    loadMeals(),
    setupPersonalInfoForm()
  ]);

  initAutocomplete(foods);
  setupForm();
  setupModals();
});
