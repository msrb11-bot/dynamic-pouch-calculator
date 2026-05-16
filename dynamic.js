const calcBtn = document.getElementById("calcBtn");

function validateInputs() {
  const width = document.getElementById("pouchWidth").value;
  const height = document.getElementById("pouchHeight").value;
  const gusset = document.getElementById("gusset").value;

  const resultBox = document.getElementById("result");

  if (!width || !height || !gusset) {
    calcBtn.disabled = true;
    calcBtn.style.opacity = "0.5";

    resultBox.innerHTML = `
      <div style="color:red; font-weight:bold; text-align:center;">
        Please enter Width, Height and Gusset before calculating.
      </div>
    `;
    return false;
  }

  calcBtn.disabled = false;
  calcBtn.style.opacity = "1";
  return true;
}


document.addEventListener("click", async (e) => {
  if (e.target.id === "copySummaryBtn") {

    const card = document.getElementById("finalSummaryCard");
    if (!card) return;

    // Clone so we don't affect UI
    const clone = card.cloneNode(true);

    // Remove header (Final Summary + button)
    const header = clone.querySelector("div");
    if (header) header.remove();

    // Build clean formatted text
    let text = "===== FINAL QUOTATION =====\n\n";

    clone.querySelectorAll(".result-row").forEach(row => {
      const label = row.querySelector(".result-label")?.innerText || "";
      const value = row.querySelector(".result-value")?.innerText || "";
      text += `${label}: ${value}\n`;
    });

    text += "\n===========================";

    try {
      await navigator.clipboard.writeText(text);

      e.target.textContent = "Copied!";
      setTimeout(() => {
        e.target.textContent = "Copy";
      }, 1500);

    } catch (err) {
      console.error("Copy failed:", err);
      alert("Copy failed");
    }
  }
});


// ---------------- INDIGO ----------------
function calculateIndigoCost({
  printFrames,
  totalFrames,
  meters,
  totalMeters,
  inkData,
  whiteData,
  primerRate,
  overhead
}) {
  const safeMeters = Number(meters || 0);

  // Primer uses TOTAL meters including setup
  const primer =
  Number(totalMeters || 0) *
  Number(primerRate || 0);

  // Absorption uses total frames
  const absorptioncost =
  Number(overhead || 0) *
  totalFrames;

  const clickCost = Number(inkData?.price || 0) * printFrames + (0.5202 * 250);
  const whiteCost = Number(whiteData?.price || 0) * safeMeters;

  return {
    printFrames,
    totalFrames,
    meters: safeMeters,
    primer,
    clickCost,
    whiteCost,
    absorptioncost,
    total: primer + clickCost + whiteCost + absorptioncost
  };
}


// ---------------- LAMINATION ----------------
function calculateLaminationCost({
  meters,
  setupMeters,
  adhesiveCostPerMeter,
  maintenanceCostPerMeter
}) {
  const laminationMeters =
    Number(meters || 0) + Number(setupMeters || 0);

  return {
    laminationMeters,
    adhesiveCost:
      laminationMeters * Number(adhesiveCostPerMeter || 0),
    maintenanceCost:
      laminationMeters * Number(maintenanceCostPerMeter || 0),
    total:
      laminationMeters *
      (Number(adhesiveCostPerMeter || 0) +
        Number(maintenanceCostPerMeter || 0))
  };
}


// ---------------- SLITTING ----------------
function calculateSlittingCost({
  meters,
  setupFrames,
  metersPerFrame,
  maintenanceCostPerMeter
}) {

  const setupMeters =
    Number(setupFrames || 0) *
    Number(metersPerFrame || 0);

  const slittingMeters =
    Number(meters || 0) + setupMeters;

  const roundedSlittingMeters = Math.ceil(slittingMeters);

  const maintenanceCost =
    roundedSlittingMeters * Number(maintenanceCostPerMeter || 0);

  return {
    slittingMeters: roundedSlittingMeters,
    maintenanceCost,
    total: maintenanceCost
  };
}

// ---------------- POUCHING ----------------
function calculatePouchingCost({
  meters,
  setupFrames,
  metersPerFrame,
  maintenanceCostPerMeter,
  zipperCostPerMeter,
  printLayerCostPerMeter,
  lam1CostPerMeter,
  lam2CostPerMeter
}) {

  const setupMeters =
    Number(setupFrames || 0) *
    Number(metersPerFrame || 0);

  const pouchMeters =
    Number(meters || 0) + setupMeters;

  const roundedPouchMeters = Math.ceil(pouchMeters);

  const zipperCost =
    roundedPouchMeters * Number(zipperCostPerMeter || 0);

  const maintenanceCost =
    roundedPouchMeters * Number(maintenanceCostPerMeter || 0);

  const pouchingMaterialCost =
    roundedPouchMeters *
    (
      Number(printLayerCostPerMeter || 0) +
      Number(lam1CostPerMeter || 0) +
      Number(lam2CostPerMeter || 0)
    );

  return {
    pouchMeters: roundedPouchMeters,
    zipperCost,
    maintenanceCost,
    pouchingMaterialCost,
    total: zipperCost + maintenanceCost + pouchingMaterialCost
  };
}

// ================= DATA =================
let data = {};


// ================= LOAD JSON =================
document.addEventListener("DOMContentLoaded", () => {
 // 1. Load JSON
  fetch("data.json")
    .then(res => res.json())
    .then(json => {
      data = json;
      populateDropdowns();
    })
    .catch(err => console.error("JSON load error:", err));


  // 2. Input validation listeners
document.querySelectorAll(
  "#pouchWidth, #pouchHeight, #gusset, #quantity, #inkSet, #whiteInk, #markup, #printLayer, #lam1, #lam2, #zipper"
).forEach(el => {
  el.addEventListener("input", validateInputs);
  el.addEventListener("change", validateInputs);
});

  validateInputs();

  // 3. Run initial validation
  validateInputs();

});


// ================= POPULATE DROPDOWNS =================
function populateDropdowns() {
  fill("quantity", data.quantity);
  fill("inkSet", data.inkSet);
  fill("whiteInk", data.whiteInk);
  fill("markup", data.markup);
  fill("printLayer", data.printLayer);
  fill("lam1", data.lamLayer1);
  fill("lam2", data.lamLayer2);
}

function fill(id, arr) {
  const el = document.getElementById(id);
  if (!el || !Array.isArray(arr)) return;

  el.innerHTML = "";

  // 👉 placeholder option (important)
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select...";
  placeholder.disabled = true;
  placeholder.selected = true;
  el.appendChild(placeholder);

  arr.forEach(item => {
    const opt = document.createElement("option");
    const value = item.value ?? item.name ?? "";
    opt.value = value;
    opt.textContent = value;
    el.appendChild(opt);
  });
}


// ================= HELPERS =================
const clean = v => Number(v || 0);

// ================= VALIDATION =================
function validateInputs() {
  const requiredIds = [
    "pouchWidth",
    "pouchHeight",
    "gusset",
    "quantity",
    "inkSet",
    "whiteInk",
    "markup",
    "printLayer",
    "lam1",
    "lam2",
    "zipper"
  ];

  const calcBtn = document.getElementById("calcBtn");

  const invalid = requiredIds.some(id => {
    const el = document.getElementById(id);
    return !el || !el.value || el.value === "";
  });

  calcBtn.disabled = invalid;
  calcBtn.style.opacity = invalid ? "0.5" : "1";

  return !invalid;
}

// ================= MAIN CALC =================
function calculateDynamic() {

  if (!validateInputs()) {
    alert("Please fill in all fields before calculating.");
    return;
  }

  try {
    

    const printLayer = document.getElementById("printLayer").value;

    const printLayerData = data.printLayer.find(p => p.name === printLayer);

    const width = clean(document.getElementById("pouchWidth").value);
    const height = clean(document.getElementById("pouchHeight").value);
    const gusset = clean(document.getElementById("gusset").value);

    const quantity = clean(document.getElementById("quantity").value);
    const inkSet = document.getElementById("inkSet").value;
    const whiteInk = document.getElementById("whiteInk").value;
    const markup = document.getElementById("markup").value;

    const lam1 = document.getElementById("lam1").value;
    const lam2 = document.getElementById("lam2").value;

    const zipper = document.getElementById("zipper").value === "yes" ? 1 : 0;

    const inkData = data.inkSet.find(i => i.name === inkSet);
    const whiteData = data.whiteInk.find(w => w.name === whiteInk);
    const markupData = data.markup.find(m => m.name === markup);

    const lam1Data = data.lamLayer1.find(l => l.name === lam1);
    const lam2Data = data.lamLayer2.find(l => l.name === lam2);

    if (!markupData) {
      alert("Missing markup data");
      return;
    }

// ================= IMPOSITION =================

// Prevent divide-by-zero
const safeWidth = width || 1;
const safeHeight = (2 * height + gusset) || 1;

// Across & Down (ROUNDDOWN = Math.floor)
const across = Math.floor(1120 / safeWidth);
const down = Math.floor(746 / safeHeight);

// PPF
const ppf = Math.max(1, across * down);

// MPF (meters per frame)
const mpf = (across * safeWidth) / 1000;

// Setup / waste frames
const setupFrames = 250;

// Production print frames
const printFrames = Math.ceil(quantity / ppf);

// Total frames including setup
const totalFrames = printFrames + setupFrames;

// Meters per frame
const metersPerFrame = mpf;

// Production meters only
const baseMeters = printFrames * metersPerFrame;

// Total meters including setup
const totalMeters = totalFrames * metersPerFrame;


// ================= INDIGO =================
const indigo = calculateIndigoCost({
      printFrames,
      totalFrames,
      meters: baseMeters,
      totalMeters,
      inkData,
      whiteData,
      primerRate: data.primercost,
      overhead: data.absorption
});

// ================= LAMINATION =================
const lamCostPerMeter = data.laminationadhesiveprice || 0;

const lamination = calculateLaminationCost({
      meters: indigo.meters,
      setupMeters: data.laminationsetup,
      adhesiveCostPerMeter: lamCostPerMeter,
      maintenanceCostPerMeter: data.laminationmaintainance
});

const slitting = calculateSlittingCost({
  meters: lamination.laminationMeters,
  setupFrames: data.slittersetup,
  metersPerFrame,
  maintenanceCostPerMeter: data.slittermaintainance
});

// ================= POUCHING =================
const pouching = calculatePouchingCost({
  meters: slitting.slittingMeters,
  setupFrames: data.pouchsetup,
  metersPerFrame,
  maintenanceCostPerMeter: data.pouchmaintainance,
  zipperCostPerMeter: data.pouchzipperprice * zipper,
  printLayerCostPerMeter: printLayerData?.price || 0,
  lam1CostPerMeter: lam1Data?.price || 0,
  lam2CostPerMeter: lam2Data?.price || 0
});

// ================= FINAL =================
// ================= TOTAL PRODUCTION COST =================
const baseCost =
  indigo.total +
  lamination.total +
  slitting.total +
  pouching.total-
  indigo.absorptioncost+1000;

// Absorption (never marked up)
const absorptionCost = indigo.absorptioncost;

// Underproduction insurance (also NOT marked up)
const underproductionInsurance = baseCost * 0.10;

// ================= MARKUP BASE =================
// ONLY pure production cost
const markupBase = baseCost;

// Markup value
const mu = markupBase * markupData.percent;

// Cost after markup
const costAfterMarkup = markupBase + mu + absorptionCost + underproductionInsurance;

// ================= BEFORE VAT =================
// Add non-markup costs AFTER markup
const costBeforeVAT = costAfterMarkup
const pouchpricebeforeVAT = costBeforeVAT / quantity;
// VAT
const vat = costBeforeVAT * 0.15;

// Final selling price
const sellingprice = costBeforeVAT + vat;

// Per unit price
const ppp = quantity ? sellingprice / quantity : 0;

const materialBreakdown = {
  printLayer: printLayerData ?? { name: "None", price: 0 },
  lam1: lam1Data ?? { name: "None", price: 0 },
  lam2: lam2Data ?? { name: "None", price: 0 },

  totalPerMeter:
    (printLayerData?.price ?? 0) +
    (lam1Data?.price ?? 0) +
    (lam2Data?.price ?? 0)
};

// ================= OUTPUT=================

document.getElementById("result").innerHTML = `
<div class="result-grid">

  <div class="card">
    <h3>Indigo</h3>

    <div class="result-row">
      <span class="result-label">Pouches per frame</span>
      <span class="result-value">${ppf}</span>
    </div>

    <div class="result-row">
      <span class="result-label">Frames to print</span>
      <span class="result-value">${indigo.totalFrames}</span>
    </div>

    <div class="result-row">
      <span class="result-label">Meters to print</span>
      <span class="result-value">${indigo.meters.toFixed(2)} m</span>
    </div>

    <div class="result-row">
      <span class="result-label">Print layer cost per meter</span>
      <span class="result-value">${(materialBreakdown.printLayer.price ?? 0).toFixed(2)} m</span>
    </div>

    <div class="result-row">
      <span class="result-label">Primer cost</span>
      <span class="result-value">R${indigo.primer.toFixed(2)}</span>
    </div>

    <div class="result-row">
      <span class="result-label">Click cost</span>
      <span class="result-value">R${indigo.clickCost.toFixed(2)}</span>
    </div>

    <div class="result-row">
      <span class="result-label">White ink cost</span>
      <span class="result-value">R${indigo.whiteCost.toFixed(2)}</span>
    </div>

    <div class="result-row">
      <span class="result-label">Absorption cost</span>
      <span class="result-value">R${indigo.absorptioncost.toFixed(2)}</span>
    </div>

    <div class="result-row highlight">
      <span class="result-label">Total</span>
      <span class="result-value">R${indigo.total.toFixed(2)}</span>
    </div>

  </div>

  <div class="card">
    <h3>Lamination</h3>

    <div class="result-row">
      <span class="result-label">Meters</span>
      <span class="result-value">${lamination.laminationMeters.toFixed(2)} m</span>
    </div>

    <div class="result-row">
      <span class="result-label">Adhesive</span>
      <span class="result-value">R${lamination.adhesiveCost.toFixed(2)}</span>
    </div>

    <div class="result-row">
      <span class="result-label">Maintenance</span>
      <span class="result-value">R${lamination.maintenanceCost.toFixed(2)}</span>
    </div>

    <div class="result-row">
      <span class="result-label">Lam layer 1 cost per meter</span>
      <span class="result-value">R${(materialBreakdown.lam1.price ?? 0).toFixed(2)}</span>
    </div>

    <div class="result-row">
      <span class="result-label">Lam layer 2 cost per meter</span>
      <span class="result-value">R${(materialBreakdown.lam2.price ?? 0).toFixed(2)}</span>
    </div>

    <div class="result-row highlight">
      <span class="result-label">Total</span>
      <span class="result-value">R${lamination.total.toFixed(2)}</span>
    </div>

  </div>

  <div class="card">
    <h3>Slitting</h3>

    <div class="result-row">
      <span class="result-label">Meters</span>
      <span class="result-value">${slitting.slittingMeters.toFixed(2)} m</span>
    </div>

    <div class="result-row">
      <span class="result-label">Maintenance</span>
      <span class="result-value">R${slitting.maintenanceCost.toFixed(2)}</span>
    </div>

    <div class="result-row highlight">
      <span class="result-label">Total</span>
      <span class="result-value">R${slitting.total.toFixed(2)}</span>
    </div>

  </div>

  <div class="card">
    <h3>Pouching</h3>

    <div class="result-row">
      <span class="result-label">Meters</span>
      <span class="result-value">${pouching.pouchMeters.toFixed(2)} m</span>
    </div>

    <div class="result-row">
      <span class="result-label">Zipper</span>
      <span class="result-value">R${pouching.zipperCost.toFixed(2)}</span>
    </div>

    <div class="result-row">
      <span class="result-label">Material cost</span>
      <span class="result-value">R${pouching.pouchingMaterialCost.toFixed(2)}</span>
    </div>

    <div class="result-row">
      <span class="result-label">Material cost per meter</span>
      <span class="result-value">R${materialBreakdown.totalPerMeter.toFixed(2)}</span>
    </div>

    <div class="result-row">
      <span class="result-label">Maintenance</span>
      <span class="result-value">R${pouching.maintenanceCost.toFixed(2)}</span>
    </div>

    <div class="result-row highlight">
      <span class="result-label">Total</span>
      <span class="result-value">R${pouching.total.toFixed(2)}</span>
    </div>

  </div>

</div>

<div class="totals" id="finalSummaryCard">
  <div style="display:flex; justify-content:space-between; align-items:center;">
  <h3>Final Summary</h3>

  <button id="copySummaryBtn"
    style="padding:6px 10px; font-size:12px; cursor:pointer;">
    Copy
  </button>
</div>

  <div class="result-row">
    <span class="result-label">Print layer</span>
    <span class="result-value">${printLayer || "None"}</span>
  </div>

  <div class="result-row">
    <span class="result-label">Lamination layer 1</span>
    <span class="result-value">${lam1 || "None"}</span>
  </div>

  <div class="result-row">
    <span class="result-label">Lamination layer 2</span>
    <span class="result-value">${lam2 || "None"}</span>
  </div>

  <div class="divider"></div>

  <div class="result-row">
    <span class="result-label">Total production costs (excl. absorption cost)</span>
    <span class="result-value">R${baseCost.toFixed(2)}</span>
  </div>

  <div class="result-row">
    <span class="result-label">Underproduction Insurance (10%)</span>
    <span class="result-value">R${underproductionInsurance.toFixed(2)}</span>
  </div>

  <div class="divider"></div>

  <div class="result-row">
    <span class="result-label">Markup</span>
    <span class="result-value">R${mu.toFixed(2)}</span>
  </div>


  <div class="result-row">
    <span class="result-label">Total cost after markup (incl. absorption + insurance)</span>
    <span class="result-value">R${costAfterMarkup.toFixed(2)}</span>
  </div>

  <div class="result-row">
    <span class="result-label">Price per pouch before VAT</span>
    <span class="result-value">R${pouchpricebeforeVAT.toFixed(2)}</span>
  </div>

  <div class="divider"></div>

  <div class="result-row">
    <span class="result-label">VAT</span>
    <span class="result-value">R${vat.toFixed(2)}</span>
  </div>

  <div class="divider"></div>

  <div class="result-row">
    <span class="result-label">Selling Price</span>
    <span class="result-value">R${sellingprice.toFixed(2)}</span>
  </div>

  <div class="result-row">
    <span class="result-label">Quantity</span>
    <span class="result-value">${quantity}</span>
  </div>

  <div class="result-row">
    <span class="result-label">Price per Pouch after VAT</span>
    <span class="result-value">R${ppp.toFixed(2)}</span>
  </div>

</div>
`;

} catch (err) {
  console.error(err);
  alert("Calculation error — check console");
}
}