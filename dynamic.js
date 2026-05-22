const calcBtn = document.getElementById("calcBtn");

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

    // ================= EXTRA VOLUME BENEFIT =================
const volumeBoxes =
  clone.querySelectorAll(".volume-box");

if (volumeBoxes.length > 0) {

  text += "\n===== EXTRA VOLUME BENEFIT =====\n\n";

  volumeBoxes.forEach(box => {

    const qty =
      box.querySelector(".volume-qty")
        ?.innerText
        ?.trim();

    const price =
      box.querySelector(".volume-price")
        ?.innerText
        ?.trim();

    if (qty && price) {
      text += `${qty}: ${price} per pouch\n`;
    }
  });
}

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
  "#pouchWidth, #pouchHeight, #gusset, #quantity, #inkSet, #whiteInk, #printLayer, #lam1, #lam2, #zipper"
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
  fill("printLayer", data.printLayer);
  fill("lam1", data.lamLayer1);
  fill("lam2", data.lamLayer2);
  fill("pouchType", data.pouchType);
}

function fill(id, arr) {
  const el = document.getElementById(id);
  if (!el || !Array.isArray(arr)) return;

  el.innerHTML = "";

  // Placeholder
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select...";
  placeholder.disabled = true;
  placeholder.selected = true;
  el.appendChild(placeholder);

  arr.forEach(item => {
    const opt = document.createElement("option");

    // Handles strings OR objects
    const value =
      typeof item === "string"
        ? item
        : (item.value ?? item.name ?? "");

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
    "printLayer",
    "lam1",
    "lam2",
    "zipper",
    "pouchType"
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

    const lam1 = document.getElementById("lam1").value;
    const lam2 = document.getElementById("lam2").value;

    const zipper = document.getElementById("zipper").value === "yes" ? 1 : 0;

    const inkData = data.inkSet.find(i => i.name === inkSet);
    const whiteData = data.whiteInk.find(w => w.name === whiteInk);
  

    const lam1Data = data.lamLayer1.find(l => l.name === lam1);
    const lam2Data = data.lamLayer2.find(l => l.name === lam2);

   // MAIN CURRENT QUANTITY CALC
  const currentCalc =
  calculateDynamicSellingPriceForQuantity({
    quantity,
    width,
    height,
    gusset,
    printLayerData,
    lam1Data,
    lam2Data,
    inkData,
    whiteData,
    zipper,
    data
});

const {
  ppf,
  around,
  across,
  indigo,
  lamination,
  slitting,
  pouching,
  vat,
  sellingprice,
  pricePerPouch,
  pouchpricebeforeVAT,
  materialBreakdown
} = currentCalc;

const ppp = pricePerPouch;

// ================= IMPOSITION =================

// ================= EXTRA VOLUME BENEFIT =================

function calculateDynamicSellingPriceForQuantity({
  quantity,
  width,
  height,
  gusset,
  printLayerData,
  lam1Data,
  lam2Data,
  inkData,
  whiteData,
  zipper,
  data
}) {

  // ================= IMPOSITION =================
  const safeWidth = width || 1;
  const safeHeight = (2 * height + gusset) || 1;

  const around = Math.floor(1120 / safeWidth);
  const across = Math.floor(746 / safeHeight);

  const ppf = Math.max(1, across * around);

  const mpf = (around * safeWidth) / 1000;

  const setupFrames = 250;

  const printFrames = Math.ceil(quantity / ppf);

  const totalFrames = printFrames + setupFrames;

  const metersPerFrame = mpf;

  const baseMeters = printFrames * metersPerFrame;

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
  const lamination = calculateLaminationCost({
    meters: indigo.meters,
    setupMeters: data.laminationsetup,
    adhesiveCostPerMeter: data.laminationadhesiveprice,
    maintenanceCostPerMeter: data.laminationmaintainance
  });

  // ================= SLITTING =================
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
  const baseCost =
    indigo.total +
    lamination.total +
    slitting.total +
    pouching.total -
    indigo.absorptioncost +
    1000;

  const absorptionCost = indigo.absorptioncost;

  const underproductionInsurance = baseCost * 0.10;

  const markupBase = baseCost + underproductionInsurance;

  const mu = markupBase * 1;

  const costAfterMarkup =
    baseCost + mu + absorptionCost;

  const costBeforeVAT = costAfterMarkup;

  const vat = costBeforeVAT * 0.15;

  const sellingprice =
    costBeforeVAT + vat;

  const pricePerPouch =
    quantity ? sellingprice / quantity : 0;

 return {
  quantity,
  ppf,
  across,
  around,
  indigo,
  lamination,
  slitting,
  pouching,
  vat,
  sellingprice,
  pricePerPouch,
  pouchpricebeforeVAT: costBeforeVAT / quantity,

  materialBreakdown: {
    printLayer: printLayerData ?? { name: "None", price: 0 },
    lam1: lam1Data ?? { name: "None", price: 0 },
    lam2: lam2Data ?? { name: "None", price: 0 },

    totalPerMeter:
      (printLayerData?.price ?? 0) +
      (lam1Data?.price ?? 0) +
      (lam2Data?.price ?? 0)
  }
};
}


// ================= VOLUME OPTIONS =================

const volume1 = currentCalc;

const volume2 = calculateDynamicSellingPriceForQuantity({
  quantity: quantity * 2,
  width,
  height,
  gusset,
  printLayerData,
  lam1Data,
  lam2Data,
  inkData,
  whiteData,
  zipper,
  data
});

const volume3 = calculateDynamicSellingPriceForQuantity({
  quantity: quantity * 4,
  width,
  height,
  gusset,
  printLayerData,
  lam1Data,
  lam2Data,
  inkData,
  whiteData,
  zipper,
  data
});

const volume4 = calculateDynamicSellingPriceForQuantity({
  quantity: quantity * 8,
  width,
  height,
  gusset,
  printLayerData,
  lam1Data,
  lam2Data,
  inkData,
  whiteData,
  zipper,
  data
});

const volume5 = calculateDynamicSellingPriceForQuantity({
  quantity: quantity * 16,
  width,
  height,
  gusset,
  printLayerData,
  lam1Data,
  lam2Data,
  inkData,
  whiteData,
  zipper,
  data
});

const volume2Qty = volume2.quantity;
const volume3Qty = volume3.quantity;
const volume4Qty = volume4.quantity;
const volume5Qty = volume5.quantity;

const volume2Price = volume2.pricePerPouch;
const volume3Price = volume3.pricePerPouch;
const volume4Price = volume4.pricePerPouch;
const volume5Price = volume5.pricePerPouch;


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
    <span class="result-label">Pouch type</span>
    <span class="result-value">${document.getElementById("pouchType").value || "None"}</span>
  </div>

   <div class="result-row">
    <span class="result-label">Pouch height</span>
    <span class="result-value">${document.getElementById("pouchHeight").value || "None"}mm</span>
  </div>
   <div class="result-row">
    <span class="result-label">Pouch width</span>
    <span class="result-value">${document.getElementById("pouchWidth").value || "None"}mm</span>
  </div>
   <div class="result-row">
    <span class="result-label">Pouch gusset</span>
    <span class="result-value">${document.getElementById("gusset").value || "None"}mm</span>
  </div>

  <div class="divider"></div>

   <div class="result-row">
    <span class="result-label">Number of pouches around</span>
    <span class="result-value">${around}</span>
  </div>
   <div class="result-row">
    <span class="result-label">Number of pouches across</span>
    <span class="result-value">${across}</span>
  </div>


  <div class="divider"></div>

   <div class="result-row">
    <span class="result-label">Zipper required </span>
    <span class="result-value">${document.getElementById("zipper").value || "None"}</span>
  </div>

  <div class="divider"></div>

  <div class="result-row">
    <span class="result-label">Ink set</span>
    <span class="result-value">${ document.getElementById("inkSet").value}</span>
  </div>


  <div class="result-row">
    <span class="result-label">White ink</span>
    <span class="result-value">${document.getElementById("whiteInk").value}</span>
  </div>

  

  <div class="divider"></div>

  <div class="result-row">
    <span class="result-label">VAT</span>
    <span class="result-value">R${vat.toFixed(2)}</span>
  </div>

  <div class="result-row">
    <span class="result-label">Price per pouch before VAT</span>
    <span class="result-value">R${pouchpricebeforeVAT.toFixed(2)}</span>
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

  <h3 style="margin-top:20px;">Extra Volume Benefit</h3>

<div class="volume-benefit-grid">

  <div class="volume-box">
    <div class="volume-qty">
      ${quantity.toLocaleString()} pouches
    </div>

    <div class="volume-price">
      R${ppp.toFixed(2)}
    </div>

    <div class="volume-label">
      per pouch
    </div>
  </div>

  <div class="volume-box">
    <div class="volume-qty">
      ${volume2Qty.toLocaleString()} pouches
    </div>

    <div class="volume-price">
      R${volume2Price.toFixed(2)}
    </div>

    <div class="volume-label">
      per pouch
    </div>
  </div>

  <div class="volume-box">
    <div class="volume-qty">
      ${volume3Qty.toLocaleString()} pouches
    </div>

    <div class="volume-price">
      R${volume3Price.toFixed(2)}
    </div>

    <div class="volume-label">
      per pouch
    </div>
  </div>

   <div class="volume-box">
    <div class="volume-qty">
      ${volume4Qty.toLocaleString()} pouches
    </div>

    <div class="volume-price">
      R${volume4Price.toFixed(2)}
    </div>

    <div class="volume-label">
      per pouch
    </div>
  </div>

   <div class="volume-box">
    <div class="volume-qty">
      ${volume5Qty.toLocaleString()} pouches
    </div>

    <div class="volume-price">
      R${volume5Price.toFixed(2)}
    </div>

    <div class="volume-label">
      per pouch
    </div>
  </div>

</div>

</div>
`;

} catch (err) {
  console.error(err);
  alert("Calculation error — check console");
}
}