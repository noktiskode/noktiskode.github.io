// Switch de tema — Barberena Mi Municipio
// Alterna entre el tema por defecto y el tema naranja,
// cambia el logo, y recuerda la elección del visitante en este navegador.

(function () {
  var STORAGE_KEY = "bmm-theme";
  var root = document.documentElement;
  var LOGO_DEFAULT = "/images/logo1.webp";
  var LOGO_NARANJA = "/images/logo.png";

  function actualizarLogo(tema) {
    var logo = document.getElementById("navLogo");
    if (!logo) return;
    logo.src = tema === "naranja" ? LOGO_NARANJA : LOGO_DEFAULT;
  }

  function aplicarTema(tema) {
    if (tema === "naranja") {
      root.setAttribute("data-theme", "naranja");
    } else {
      root.removeAttribute("data-theme");
    }
    actualizarLogo(tema);
  }

  function temaGuardado() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function guardarTema(tema) {
    try {
      localStorage.setItem(STORAGE_KEY, tema);
    } catch (e) {
      /* si el navegador bloquea localStorage, simplemente no persiste */
    }
  }

  // Aplica el tema guardado apenas carga la página
  var guardado = temaGuardado();
  if (guardado === "naranja") {
    aplicarTema("naranja");
  }

  // Conecta el botón con clase .theme-switch (agregalo en tu navbar)
  document.addEventListener("DOMContentLoaded", function () {
    actualizarLogo(guardado === "naranja" ? "naranja" : "default");

    var boton = document.querySelector(".theme-switch");
    if (!boton) return;

    function actualizarTexto() {
      var activo = root.getAttribute("data-theme") === "naranja";
      boton.textContent = activo ? "Volver al tema clásico" : "Tema naranja";
    }

    actualizarTexto();

    boton.addEventListener("click", function () {
      var activo = root.getAttribute("data-theme") === "naranja";
      var nuevoTema = activo ? "default" : "naranja";
      aplicarTema(nuevoTema);
      guardarTema(nuevoTema);
      actualizarTexto();
    });
  });
})();
