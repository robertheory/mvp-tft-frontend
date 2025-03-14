const loadMeals = () => {
  fetch('http://192.168.1.17:5000/meals')
    .then(response => response.json())
    .then(data => {
      const meals = data.meals;

      const mealsTable = document.getElementById('meals-table');

      // clear table before adding new rows
      mealsTable.innerHTML = "";

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

    });
}

const handleDeleteMeal = (mealId) => {
  fetch(`http://192.168.1.17:5000/meals/${mealId}`, {
    method: 'DELETE'
  }).finally(() => loadMeals());
};

document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll("#nav-links .nav-link");

  const routes = {
    home: {
      hash: "#",
      element: document.getElementById('welcome')
    },
    dashboard: {
      hash: "#/dashboard",
      element: document.getElementById('dashboard')
    },
    diet: {
      hash: "#/dieta",
      element: document.getElementById('diet')
    }
  };

  routes.dashboard.element.style.display = "none";
  routes.diet.element.style.display = "none";

  navLinks.forEach(link => {
    link.addEventListener("click", (event) => {
      event.preventDefault();

      const hash = link.getAttribute("href");

      navLinks.forEach(link => {
        const isActive = link.getAttribute("href") === hash;
        link.classList.toggle("active", isActive);
        link.classList.toggle("text-white", !isActive);
      });

      const route = Object.values(routes).find(route => route.hash === hash);

      if (route) {
        Object.values(routes).forEach(route => {
          route.element.style.display = "none";
        });

        route.element.style.display = "block";
      }

    });
  });

  loadMeals();

});
