let foodList = [];

const addFoodToSelectedTable = (foodId) => {

  const foods = JSON.parse(localStorage.getItem('foods')) || [];

  const food = foods.find(food => food.id === foodId);

  if (!food) {
    return;
  }

  const selectedFoodElement = document.createElement('tr');

  // add a hidden input with the food id
  const foodIdInput = document.createElement('input');
  foodIdInput.type = 'hidden';
  foodIdInput.name = 'foods[]';
  foodIdInput.value = food.id;

  selectedFoodElement.innerHTML = `
    <td>${food.name}</td>
    <td>${food.unit}</td>
    <td>${food.calories} kcal</td>
    <td>
      <input type="number" name="quantities[]" class="form-control" min="1" required>
    </td>
    <td>
      <button type="button" class="btn btn-danger">
        Excluir
      </button>
    </td>
  `;

  selectedFoodsTableBody.appendChild(selectedFoodElement);
  selectedFoodElement.appendChild(foodIdInput);

}

const createFoodOption = (food) => {

  const foodOption = document.createElement('option');

  const foodLabel = `${food.name} (${food.unit}) - ${food.calories} kcal`;

  foodOption.value = food.id;
  foodOption.innerText = foodLabel;

  return foodOption;

}


const autocompleteInput = document.getElementById('autocomplete-input')

if (autocompleteInput) {
  autocompleteInput.addEventListener('input', function () {
    const input = this.value.toLowerCase();
    const results = document.getElementById('autocomplete-results');

    if (input.length > 0) {
      const foods = JSON.parse(localStorage.getItem('foods')) || [];
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

  autocompleteInput.addEventListener('onchange', function (e) {

    const foodId = e.target.value;
    console.log('foodId', foodId)

    addFoodToSelectedTable(foodId);
    autocompleteInput.value = '';
    const results = document.getElementById('autocomplete-results');
    results.classList.add('d-none');


  });
}


let selectedFoods = [];

const selectedFoodsTableBody = document.getElementById('selected-foods-table-body');

const loadFoods = () => {
  const localFoods = localStorage.getItem('foods');

  if (!localFoods) {

    fetch('http://192.168.1.17:5000/foods')
      .then(response => response.json())
      .then(data => {
        localStorage.setItem('foods', JSON.stringify(data.foods));

        fetchFoods();
      }
      );

  }

  foodList = JSON.parse(localStorage.getItem('foods'));

  // foods.forEach(food => {
  //   const foodOption = document.createElement('option');

  //   const foodLabel = `${food.name} (${food.unit}) - ${food.calories} kcal`;

  //   foodOption.value = food.id;
  //   foodOption.innerText = foodLabel;

  //   foodOption.addEventListener('select', () => {
  //     const selectedFoodElement = document.createElement('tr');

  //     // add a hidden input with the food id
  //     const foodIdInput = document.createElement('input');
  //     foodIdInput.type = 'hidden';
  //     foodIdInput.name = 'foods[]';
  //     foodIdInput.value = food.id;

  //     selectedFoodElement.innerHTML = `
  //       <td>${food.name}</td>
  //       <td>${food.unit}</td>
  //       <td>${food.calories} kcal</td>
  //       <td>
  //         <input type="number" name="quantities[]" class="form-control" min="1" required>
  //       </td>
  //       <td>
  //         <button type="button" class="btn btn-danger">
  //           Excluir
  //         </button>
  //       </td>
  //     `;
  //     selectedFoodsTableBody.appendChild(selectedFoodElement);
  //     selectedFoodElement.appendChild(foodIdInput);


  //   });

  // });
}

const renderMeals = (meals) => {
  const mealsTable = document.getElementById('meals-table-body');

  if (!mealsTable) return;

  // clear table before adding new rows
  mealsTable.innerHTML = '';

  meals.forEach(meal => {
    const mealElement = document.createElement('tr');

    const mealDate = new Date(meal.date).toLocaleString('pt-BR');

    const totalCalories = meal.meal_foods.reduce((acc, food) => acc + food.food.calories * food.quantity, 0);

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

document.addEventListener("DOMContentLoaded", () => {

  loadMeals();

  loadFoods();

});
