const controls = {
  heat: document.querySelector("#heat"),
  acid: document.querySelector("#acid"),
  base: document.querySelector("#base"),
};

const output = {
  heatValue: document.querySelector("#heatValue"),
  acidValue: document.querySelector("#acidValue"),
  baseValue: document.querySelector("#baseValue"),
  temperature: document.querySelector("#temperature"),
  tempMeter: document.querySelector("#tempMeter"),
  ph: document.querySelector("#ph"),
  phMarker: document.querySelector("#phMarker"),
  phLabel: document.querySelector("#phLabel"),
  energy: document.querySelector("#energy"),
  energyMeter: document.querySelector("#energyMeter"),
  rate: document.querySelector("#rate"),
  reactionText: document.querySelector("#reactionText"),
  liquid: document.querySelector("#liquid"),
  phase: document.querySelector("#phase"),
  observation: document.querySelector("#observation"),
};

let running = false;
let elapsed = 0;
let timerId;
let mode = "physics";

function getValues() {
  const heat = mode === "physics" ? Number(controls.heat.value) : 0;
  const acid = mode === "chemistry" ? Number(controls.acid.value) : 0;
  const base = mode === "chemistry" ? Number(controls.base.value) : 0;
  const ph = Math.max(0, Math.min(14, 7 - acid * 0.31 + base * 0.31));
  const temperature = 22 + (heat * 0.75 * (1 - Math.exp(-elapsed / 13)));
  const energy = Math.max(0, (temperature - 22) * 1.34);
  const balance = Math.max(0, 1 - Math.abs(acid - base) / 20);
  const rate = mode === "physics" ? Math.min(100, energy * 1.1) : Math.min(100, (acid + base) * 3 + balance * 30);
  return { heat, acid, base, ph, temperature, energy, rate };
}

function liquidColor(ph) {
  if (ph < 4) return "#e76f51";
  if (ph < 6.5) return "#f4be46";
  if (ph < 8.5) return "#75c6b5";
  return "#5372af";
}

function update() {
  const values = getValues();
  output.heatValue.textContent = `${values.heat} %`;
  output.acidValue.textContent = `${values.acid} ml`;
  output.baseValue.textContent = `${values.base} ml`;
  output.temperature.innerHTML = `${values.temperature.toFixed(1)} <small>°C</small>`;
  output.tempMeter.style.width = `${Math.min(100, (values.temperature - 22) / 0.75)}%`;
  output.ph.textContent = values.ph.toFixed(1);
  output.phMarker.style.left = `${(values.ph / 14) * 100}%`;
  output.phLabel.textContent = values.ph < 6.5 ? "sauer" : values.ph > 7.5 ? "basisch" : "neutral";
  output.energy.innerHTML = `${values.energy.toFixed(1)} <small>kJ</small>`;
  output.energyMeter.style.width = `${Math.min(100, values.energy / 1.01)}%`;
  output.rate.textContent = `${values.rate.toFixed(1)} %`;
  output.liquid.style.background = liquidColor(values.ph);

  if (!running) {
    output.rate.textContent = "0.0 %";
    return;
  }
  const isPhysics = mode === "physics";
  output.phase.textContent = isPhysics ? (values.rate > 65 ? "Starke Bewegung" : "Erwärmung") : (values.rate > 65 ? "Reaktion läuft" : "Mischung entsteht");
  output.reactionText.textContent = isPhysics ? "Teilchen bewegen sich schneller" : "Säure und Lauge reagieren";
  output.observation.textContent = isPhysics
    ? `Bei ${values.temperature.toFixed(1)} °C besitzen die Teilchen ${values.energy.toFixed(1)} kJ Energie.`
    : `Die Lösung ist ${output.phLabel.textContent} (pH ${values.ph.toFixed(1)}). Die Stoffe reagieren miteinander.`;
}

function startExperiment() {
  if (running) return;
  running = true;
  document.body.classList.add("running");
  document.querySelector("#startButton").textContent = "Versuch läuft";
  timerId = window.setInterval(() => {
    elapsed += 0.5;
    update();
  }, 500);
  update();
}

function resetExperiment() {
  window.clearInterval(timerId);
  running = false;
  elapsed = 0;
  controls.heat.value = 55;
  controls.acid.value = 0;
  controls.base.value = 0;
  document.body.classList.remove("running");
  document.querySelector("#startButton").textContent = "Experiment starten";
  output.phase.textContent = "Bereit";
  output.reactionText.textContent = "Noch keine Aktivität";
  output.observation.textContent = "Stelle die Bedingungen ein und starte den Versuch.";
  update();
}

function selectMode(selectedMode) {
  if (selectedMode === "physics") {
    window.openPhysicsPlatform();
    return;
  }
  if (selectedMode === "chemistry") {
    window.openChemistryPlatform();
    return;
  }
  resetExperiment();
  mode = selectedMode;
  document.body.dataset.mode = mode;
  document.querySelector("#homeScreen").hidden = true;
  document.querySelector("#labScreen").hidden = false;
  const isPhysics = mode === "physics";
  document.querySelectorAll(".physics-only").forEach((element) => { element.hidden = !isPhysics; });
  document.querySelectorAll(".chemistry-only").forEach((element) => { element.hidden = isPhysics; });
  document.querySelector("#experimentNumber").textContent = isPhysics ? "Physik Experiment 01" : "Chemie Experiment 01";
  document.querySelector("#labTitle").innerHTML = isPhysics ? "Energie <span>&</span> Bewegung" : "Säure <span>&</span> Lauge";
  document.querySelector("#modeNote").textContent = isPhysics
    ? "Erhitze die Probe und beobachte, wie Temperatur und Teilchenenergie zusammenhängen."
    : "Mische Säure und Lauge und beobachte den pH-Wert sowie die Reaktionsaktivität.";
  document.querySelector("#resultLabel").textContent = isPhysics ? "Bewegungsenergie" : "Reaktionsrate";
  update();
}

Object.values(controls).forEach((control) => control.addEventListener("input", update));
document.querySelector("#startButton").addEventListener("click", startExperiment);
document.querySelector("#resetButton").addEventListener("click", resetExperiment);
document.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => selectMode(button.dataset.mode)));
document.querySelector("#homeButton").addEventListener("click", () => {
  resetExperiment();
  document.querySelector("#labScreen").hidden = true;
  document.querySelector("#homeScreen").hidden = false;
});

for (let index = 0; index < 16; index += 1) {
  const bubble = document.createElement("i");
  bubble.style.left = `${8 + (index * 23) % 78}%`;
  bubble.style.animationDelay = `${(index % 6) * 0.23}s`;
  bubble.style.animationDuration = `${1 + (index % 4) * 0.22}s`;
  document.querySelector("#bubbles").append(bubble);
}

update();