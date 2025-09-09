const videoElement = document.getElementById("videoInput");
const canvasElement = document.getElementById("canvasOutput");
const canvasCtx = canvasElement.getContext("2d");

// Contadores
let contadorOjos = 0, contadorBoca = 0, contadorCejas = 0;

// Estados previos
let ojosCerrados = false;
let bocaAbierta = false;
let cejasArriba = false;

function detectarGestos(landmarks) {
  if (!landmarks) return;

  // ===============================
  // 👀 OJOS (usamos ojo izquierdo)
  // ===============================
  let ojoSup = landmarks[159].y; // párpado superior
  let ojoInf = landmarks[145].y; // párpado inferior
  let aperturaOjo = ojoInf - ojoSup;

  if (aperturaOjo < 0.025 && !ojosCerrados) {
    ojosCerrados = true; // detectamos cierre
  } else if (aperturaOjo > 0.04 && ojosCerrados) {
    ojosCerrados = false; // detectamos apertura -> parpadeo completo
    contadorOjos++;
    document.getElementById("contadorOjos").textContent = contadorOjos;
  }

  // ===============================
  // 👄 BOCA
  // ===============================
  let bocaSup = landmarks[13].y;
  let bocaInf = landmarks[14].y;
  let aperturaBoca = bocaInf - bocaSup;

  if (aperturaBoca > 0.06 && !bocaAbierta) {
    bocaAbierta = true; // detectamos apertura
  } else if (aperturaBoca < 0.03 && bocaAbierta) {
    bocaAbierta = false; // detectamos cierre -> evento completo
    contadorBoca++;
    document.getElementById("contadorBoca").textContent = contadorBoca;
  }

  // ===============================
  // 👁️ CEJAS
  // ===============================
  let ceja = landmarks[70].y;   // ceja izq
  let ojo = landmarks[159].y;   // ojo izq
  let distanciaCejaOjo = ojo - ceja;

  if (distanciaCejaOjo > 0.09 && !cejasArriba) {
    cejasArriba = true; // ceja levantada
  } else if (distanciaCejaOjo < 0.06 && cejasArriba) {
    cejasArriba = false; // ceja bajada -> evento completo
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
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6
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
