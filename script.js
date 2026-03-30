const DURATIONS = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

const timerEl = document.getElementById("timer");
const sessionEl = document.getElementById("session-label");
const cycleEl = document.getElementById("cycle");
const startPauseBtn = document.getElementById("start-pause");
const resetBtn = document.getElementById("reset");

let mode = "focus";
let cycle = 1;
let secondsLeft = DURATIONS.focus;
let isRunning = false;
let intervalId;
let audioContext;

function formatTime(seconds) {
  const min = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const sec = (seconds % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}

function paint() {
  timerEl.textContent = formatTime(secondsLeft);
  sessionEl.textContent =
    mode === "focus"
      ? "Sesión de enfoque"
      : mode === "shortBreak"
        ? "Descanso corto"
        : "Descanso largo";

  sessionEl.classList.toggle("rest", mode !== "focus");
  cycleEl.textContent = `Ciclo: ${cycle} / 4`;
  document.title = `${timerEl.textContent} · ${sessionEl.textContent}`;
}

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

function playEndSound() {
  const ctx = getAudioContext();
  if (!ctx) {
    return;
  }

  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, now);

  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(now);
  oscillator.stop(now + 0.24);
}

function nextSession() {
  if (mode === "focus") {
    if (cycle % 4 === 0) {
      mode = "longBreak";
      secondsLeft = DURATIONS.longBreak;
    } else {
      mode = "shortBreak";
      secondsLeft = DURATIONS.shortBreak;
    }
  } else {
    mode = "focus";
    secondsLeft = DURATIONS.focus;

    if (cycle === 4) {
      cycle = 1;
    } else {
      cycle += 1;
    }
  }

  paint();
}

function tick() {
  if (secondsLeft > 0) {
    secondsLeft -= 1;
    paint();
    return;
  }

  playEndSound();
  nextSession();
}

function toggleStartPause() {
  isRunning = !isRunning;
  startPauseBtn.textContent = isRunning ? "Pausar" : "Iniciar";

  if (isRunning) {
    intervalId = setInterval(tick, 1000);
  } else {
    clearInterval(intervalId);
  }
}

function reset() {
  clearInterval(intervalId);
  isRunning = false;
  mode = "focus";
  cycle = 1;
  secondsLeft = DURATIONS.focus;
  startPauseBtn.textContent = "Iniciar";
  paint();
}

startPauseBtn.addEventListener("click", toggleStartPause);
resetBtn.addEventListener("click", reset);

paint();
