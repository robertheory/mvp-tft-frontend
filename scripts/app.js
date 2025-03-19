const handleDeleteSelectedFood = (foodId) => {
  const selectedFoodsTableBody = document.getElementById('selected-foods-table-body');
  const foodsDataContainer = document.getElementById('foods-data-container');

  if (!selectedFoodsTableBody || !foodsDataContainer) return;

  // Remove the table row
  selectedFoodsTableBody.removeChild(selectedFoodsTableBody.querySelector(`tr[data-food-id="${foodId}"]`));

  // Remove the hidden input from the container
  const foodInput = foodsDataContainer.querySelector(`input[name="foods[${foodId}]"]`);
  if (foodInput) {
    foodsDataContainer.removeChild(foodInput);
  }

  // Save form data after removing food
  saveFormData();
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

const addFoodToSelectedTable = (foodId) => {
  const foods = JSON.parse(localStorage.getItem('foods')) || [];
  const foodsDataContainer = document.getElementById('foods-data-container');
  const selectedFoodsTableBody = document.getElementById('selected-foods-table-body');

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
      <input type="number" name="quantity[${food.id}]" class="form-control" min="0" required value="0">
    </td>
  `;

  selectedFoodElement.appendChild(deleteFoodButtonCell);
  selectedFoodsTableBody.appendChild(selectedFoodElement);

  // Save form data after adding food
  saveFormData();
}

const getSelectedFoods = () => {
  const selectedFoodsTableBody = document.getElementById('selected-foods-table-body');

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

    await fetch('http://localhost:5000/meals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    await loadMeals();
    e.target.reset();

  } catch (error) {
    console.log('error', error)
  }
}

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
    deleteMealButton.innerText = 'Excluir';
    deleteMealButton.addEventListener('click', () => handleDeleteMeal(meal.id));

    mealElement.innerHTML = `
      <td>${meal.title}</td>
      <td>${totalCalories} kcal</td>
      <td>${mealDate}</td>
      <td id="${meal.id}-actions">

        <button type="button" class="btn btn-primary">
          Editar
        </button>

      </td>
      `;
    mealsTable.appendChild(mealElement);

    const mealActions = document.getElementById(`${meal.id}-actions`);
    mealActions.appendChild(deleteMealButton);
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

const handleDeleteMeal = (mealId) => {
  fetch(`http://192.168.1.17:5000/meals/${mealId}`, {
    method: 'DELETE'
  }).finally(() => loadMeals());
};

document.addEventListener("DOMContentLoaded", async () => {
  const foods = await loadFoods();

  loadMeals();

  initAutocomplete(foods);

  setupForm();
});
