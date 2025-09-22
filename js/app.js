const videoElement = document.getElementById("videoInput");
const canvasElement = document.getElementById("canvasOutput");
const canvasCtx = canvasElement.getContext("2d");

// ===============================
// Contadores y estados
// ===============================
let contadorOjos = 0, contadorBoca = 0, contadorCejas = 0;
let ojosCerrados = false, bocaAbierta = false, cejasArriba = false;

// Tiempos mínimos (ms) para evitar falsos positivos
let ultimoParpadeo = 0, ultimoBoca = 0, ultimoCeja = 0;
const MIN_TIEMPO = 300; // 300ms entre eventos

// ===============================
// Función de detección de gestos
// ===============================
function detectarGestos(landmarks) {
  if (!landmarks) return;

  // ===============================
  // 📏 Normalización
  // ===============================
  // Usamos el ancho de la cara (distancia entre mejillas)
  let anchoCara = Math.abs(landmarks[234].x - landmarks[454].x);
  if (anchoCara === 0) return;

  // ===============================
  // 👀 OJOS (promedio de ambos ojos)
  // ===============================
  let aperturaOjoIzq = (landmarks[145].y - landmarks[159].y) / anchoCara; // ojo izq
  let aperturaOjoDer = (landmarks[374].y - landmarks[386].y) / anchoCara; // ojo der
  let aperturaOjo = (aperturaOjoIzq + aperturaOjoDer) / 2;

  if (aperturaOjo < 0.045 && !ojosCerrados && Date.now() - ultimoParpadeo > MIN_TIEMPO) {
    ojosCerrados = true;
    ultimoParpadeo = Date.now();
  } else if (aperturaOjo > 0.065 && ojosCerrados) {
    ojosCerrados = false;
    contadorOjos++;
    document.getElementById("contadorOjos").textContent = contadorOjos;
  }

  // ===============================
  // 👄 BOCA (normalizada al ancho de cara)
  // ===============================
  let aperturaBoca = (landmarks[14].y - landmarks[13].y) / anchoCara;

  if (aperturaBoca > 0.18 && !bocaAbierta && Date.now() - ultimoBoca > MIN_TIEMPO) {
    bocaAbierta = true;
    ultimoBoca = Date.now();
  } else if (aperturaBoca < 0.10 && bocaAbierta) {
    bocaAbierta = false;
    contadorBoca++;
    document.getElementById("contadorBoca").textContent = contadorBoca;
  }

  // ===============================
  // 🤨 CEJAS (promedio izq + der)
  // ===============================
  let distanciaCejaOjoIzq = (landmarks[159].y - landmarks[70].y) / anchoCara;
  let distanciaCejaOjoDer = (landmarks[386].y - landmarks[300].y) / anchoCara;
  let distanciaCejaOjo = (distanciaCejaOjoIzq + distanciaCejaOjoDer) / 2;

  if (distanciaCejaOjo > 0.20 && !cejasArriba && Date.now() - ultimoCeja > MIN_TIEMPO) {
    cejasArriba = true;
    ultimoCeja = Date.now();
  } else if (distanciaCejaOjo < 0.13 && cejasArriba) {
    cejasArriba = false;
    contadorCejas++;
    document.getElementById("contadorCejas").textContent = contadorCejas;
  }
}

// ===============================
// Configuración FaceMesh
// ===============================
const faceMesh = new FaceMesh({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
});

faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.7, // más estricto
  minTrackingConfidence: 0.7
});

faceMesh.onResults(results => {
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiFaceLandmarks) {
    for (const landmarks of results.multiFaceLandmarks) {
      detectarGestos(landmarks);
    }
  }
});

// ===============================
// Cámara
// ===============================
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await faceMesh.send({ image: videoElement });
  },
  width: 640,
  height: 480
});
camera.start();

// ===============================
// Guardar datos en API
// ===============================
document.getElementById("guardarDatos").addEventListener("click", () => {
  let data = {
    ojos: contadorOjos,
    cejas: contadorCejas,
    boca: contadorBoca
  };

  fetch("https://tu-api-o-endpoint.com/guardar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
    .then(res => {
      if (!res.ok) throw new Error("Error en la respuesta del servidor");
      return res.json();
    })
    .then(response => {
      alert("✅ Datos guardados con éxito: " + JSON.stringify(response));
    })
    .catch(err => {
      alert("❌ Error al guardar datos: " + err.message);
      console.error("Error en fetch:", err);
    });
});
