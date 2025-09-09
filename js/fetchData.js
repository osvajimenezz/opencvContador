document.getElementById("guardarDatos").addEventListener("click", () => {
  let data = {
    ojos: document.getElementById("contadorOjos").textContent,
    cejas: document.getElementById("contadorCejas").textContent,
    boca: document.getElementById("contadorBoca").textContent
  };

  fetch("https://tu-api-o-endpoint.com/guardar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(response => {
      alert("Datos guardados con éxito: " + JSON.stringify(response));
    })
    .catch(err => console.error("Error en fetch:", err));
});
