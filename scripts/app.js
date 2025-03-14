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
});
