document.addEventListener("click", async (e) => {

  if (e.target.id === "copySummaryBtn") {

    const card =
      document.getElementById("finalSummaryCard");

    if (!card) return;

    let text =
      "===== FINAL QUOTATION =====\n\n";

    // ================= NORMAL ROWS =================
    card.querySelectorAll(".result-row").forEach(row => {

      const label =
        row.querySelector(".result-label")
          ?.innerText
          ?.trim();

      const value =
        row.querySelector(".result-value")
          ?.innerText
          ?.trim();

      if (label && value) {
        text += `${label}: ${value}\n`;
      }
    });

    // ================= EXTRA VOLUME BENEFIT =================
    const volumeBoxes =
      card.querySelectorAll(".volume-box");

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

    text += "\n=========================\n";

    try {

      await navigator.clipboard.writeText(text);

      e.target.innerText = "Copied!";

      setTimeout(() => {
        e.target.innerText = "Copy";
      }, 1500);

    } catch (err) {

      console.error("Clipboard error:", err);

      alert(
        "Copy failed — check browser permissions"
      );
    }
  }
});

// ---------------- INDIGO ----------------
function calculateIndigoCost({
  quantity,
  sizeData,
  inkData,
  whiteData,
  primerRate,
  overhead
}) {
  const safeQuantity = Number(quantity ?? 0);

  const ppf = Number(sizeData?.ppf ?? 0);
  const mpf = Number(sizeData?.mpf ?? 0);

  if (ppf <= 0) {
    throw new Error("Invalid sizeData.ppf (must be > 0)");
  }

  const printFrames = Math.ceil(safeQuantity / ppf);

  // FIXED: include setup frames like dynamic.js
  const setupFrames = Number(sizeData?.setupFrames ?? 250);
  const totalFrames = printFrames + setupFrames;

  const meters = printFrames * mpf;
  const totalMeters = totalFrames * mpf;

  const primer = totalMeters * Number(primerRate ?? 0);

  const absorptionCost =
    Number(overhead ?? 0) * totalFrames;

  const clickCost =
    Number(inkData?.price ?? 0) * printFrames+(0.5202*250);

  const whiteCost =
    Number(whiteData?.price ?? 0) * meters;

  const total = primer + clickCost + whiteCost + absorptionCost;

  return {
    printFrames,
    totalFrames,
    meters,
    totalMeters,
    primer,
    clickCost,
    whiteCost,
    absorptionCost,
    total
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
    adhesiveCost: laminationMeters * Number(adhesiveCostPerMeter || 0),
    maintenanceCost: laminationMeters * Number(maintenanceCostPerMeter || 0),
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


function calculatePouchingCost({
  meters,
  metersPerFrame,
  maintenanceCostPerMeter,
  zipperCostPerMeter,
  materialConstructionCost,
  zipperEnabled
}) {

  const setupFrames = 200;

  const setupMeters = setupFrames * Number(metersPerFrame || 0);

  const pouchMeters = Number(meters || 0) + setupMeters;

  const roundedMeters = Math.ceil(pouchMeters);

  const zipperCost =
    zipperEnabled
      ? roundedMeters * Number(zipperCostPerMeter || 0)
      : 0;

  const maintenanceCost =
    roundedMeters * Number(maintenanceCostPerMeter || 0);

  const materialCost =
    roundedMeters * Number(materialConstructionCost?.price || 0);

  return {
    pouchMeters: roundedMeters,
    zipperCost,
    maintenanceCost,
    materialCost,
    total: zipperCost + maintenanceCost + materialCost
  };
}


// ================= DATA =================
let data = {};

// ================= LOAD JSON =================
fetch("data.json")
  .then(res => res.json())
  .then(json => {
    data = json;
    populate();
  })
  .catch(err => console.error("Failed to load data:", err));


// ================= POPULATE =================
function populate() {
  data.size.forEach(v => addOption("size", v.name));
  data.material.forEach(v => addOption("material", v.name));
  data.pouchType.forEach(v => addOption("pouchType", v));
  data.quantity.forEach(v => addOption("quantity", v.value));
  data.inkSet.forEach(v => addOption("inkSet", v.name));
  data.whiteInk.forEach(v => addOption("whiteInk", v.name));
 

    enableCalculateButtonCheck();
}

function enableCalculateButtonCheck() {
  const requiredFields = ["size", "material", "pouchType", "quantity", "inkSet", "whiteInk", "zipper"];
  const calculateBtn = document.getElementById("calculateBtn");

  function checkFields() {
    const allSelected = requiredFields.every(id => {
      const el = document.getElementById(id);
      return el && el.value && el.value !== "default"; // assuming default option is placeholder
    });

    calculateBtn.disabled = !allSelected;
  }

  requiredFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", checkFields);
  });

  // Initial check in case form is pre-filled
  checkFields();
}

// ================= ADD OPTION =================
function addOption(id, value) {
  const el = document.getElementById(id);
  if (!el) return;

  const opt = document.createElement("option");
  opt.value = value;
  opt.textContent = value;
  el.appendChild(opt);
}


// ================= CLEAN =================
const clean = (v) => Number(v || 0);


// ================= Extra volume benefit =================
function calculateSellingPriceForQuantity({
  quantity,
  sizeData,
  materialData,
  inkData,
  whiteData,
  zipper,
  data
}) {

  // ================= INDIGO =================
  const indigo = calculateIndigoCost({
    quantity,
    sizeData,
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
    metersPerFrame: sizeData.mpf,
    maintenanceCostPerMeter: data.slittermaintainance
  });

  // ================= POUCHING =================
  const pouching = calculatePouchingCost({
    meters: slitting.slittingMeters,
    metersPerFrame: sizeData.mpf,
    maintenanceCostPerMeter: data.pouchmaintainance,
    zipperCostPerMeter: data.pouchzipperprice,
    materialConstructionCost: materialData,
    zipperEnabled: zipper
  });

  // ================= FINAL COST =================
  const absorptionCost = indigo.absorptionCost || 0;

  const productionCost =
    indigo.total +
    lamination.total +
    slitting.total +
    pouching.total -
    absorptionCost +
    1000;

  const underproductionInsurance = productionCost * 0.10;

  const markupPercent = 1;

  const markupValue =
    (productionCost + underproductionInsurance) *
    markupPercent;

  const costAfterMarkup =
    productionCost +
    markupValue +
    absorptionCost;

  const vat = costAfterMarkup * 0.15;

  const sellingPrice = costAfterMarkup + vat;

  const pricePerPouch =
    quantity ? sellingPrice / quantity : 0;

  return {
    quantity,
    sellingPrice,
    pricePerPouch
  };
}


// ================= MAIN CALCULATION =================
function calculate() {

  const size = clean(document.getElementById("size").value);
  const material = clean(document.getElementById("material").value);
  const quantity = Number(document.getElementById("quantity").value || 0);

  const inkSet = clean(document.getElementById("inkSet").value);
  const whiteInk = clean(document.getElementById("whiteInk").value);
  

  const sizeData = data.size.find(s => s.name === document.getElementById("size").value);
  const materialData = data.material.find(m => m.name === document.getElementById("material").value);
  const inkData = data.inkSet.find(i => i.name === document.getElementById("inkSet").value);
  const whiteData = data.whiteInk.find(w => w.name === document.getElementById("whiteInk").value);
 

  const zipper = document.getElementById("zipper").value === "yes" ? 1 : 0;

  if (!sizeData || !materialData || !inkData || !whiteData) {
    alert("Missing dropdown data");
    return;
  }

  // ================= INDIGO =================
  const indigo = calculateIndigoCost({
    quantity,
    sizeData,
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
  metersPerFrame: sizeData.mpf,
  maintenanceCostPerMeter: data.slittermaintainance
});


  // ================= POUCHING =================
const pouching = calculatePouchingCost({
  meters: slitting.slittingMeters,
  metersPerFrame: sizeData.mpf,
  maintenanceCostPerMeter: data.pouchmaintainance,
  zipperCostPerMeter: data.pouchzipperprice,
  materialConstructionCost: materialData,
  zipperEnabled: zipper
});


// ================= FINAL COST (CLEAN DYNAMIC LOGIC) =================

const absorptionCost = indigo.absorptionCost || 0;

const productionCost =
  indigo.total +
  lamination.total +
  slitting.total +
  pouching.total -
  absorptionCost +
  1000;

 // Underproduction insurance (marked up)
const underproductionInsurance = productionCost * 0.10; 

// Markup (FIXED: percent converted properly)
const markupPercent = 1;
const markupValue = (productionCost + underproductionInsurance) * markupPercent;

// Cost after markup
const costAfterMarkup =
  productionCost +
  markupValue +
  absorptionCost
  ;

// VAT
const costBeforeVAT = costAfterMarkup;
const vat = costBeforeVAT * 0.15;

// Final price
const sellingPrice = costBeforeVAT + vat;

// Unit pricing
const ppp = quantity ? sellingPrice / quantity : 0;
const pouchpricebeforeVAT = quantity ? costBeforeVAT / quantity : 0;

// ================= EXTRA VOLUME BENEFIT =================

const volume1 = calculateSellingPriceForQuantity({
  quantity,
  sizeData,
  materialData,
  inkData,
  whiteData,
  zipper,
  data
});

const volume2 = calculateSellingPriceForQuantity({
  quantity: quantity * 2,
  sizeData,
  materialData,
  inkData,
  whiteData,
  zipper,
  data
});

const volume3 = calculateSellingPriceForQuantity({
  quantity: quantity * 4,
  sizeData,
  materialData,
  inkData,
  whiteData,
  zipper,
  data
});

const volume4 = calculateSellingPriceForQuantity({
  quantity: quantity * 8,
  sizeData,
  materialData,
  inkData,
  whiteData,
  zipper,
  data
});


const volume5 = calculateSellingPriceForQuantity({
  quantity: quantity * 16,
  sizeData,
  materialData,
  inkData,
  whiteData,
  zipper,
  data
});


const materialBreakdown = {
  material: materialData ?? { name: "None", price: 0 },

  totalPerMeter:
    (materialData?.price ?? 0)
};


const volume2Qty = volume2.quantity;
const volume3Qty = volume3.quantity;
const volume4Qty = volume4.quantity;
const volume5Qty = volume5.quantity;

const volume2Price = volume2.pricePerPouch;
const volume3Price = volume3.pricePerPouch;
const volume4Price = volume4.pricePerPouch;
const volume5Price = volume5.pricePerPouch;

// ================= OUTPUT =================

document.getElementById("result").innerHTML = `
<div class="result-grid">

  <!-- ================= INDIGO ================= -->
  <div class="card">
    <h3>Indigo</h3>

    <div class="result-row">
      <span class="result-label">Pouches per frame</span>
      <span class="result-value">${sizeData.ppf}</span>
    </div>

    <div class="result-row">
      <span class="result-label">Frames to print</span>
      <span class="result-value">${indigo.printFrames}</span>
    </div>

    <div class="result-row">
      <span class="result-label">Meters to print</span>
      <span class="result-value">${indigo.meters.toFixed(2)} m</span>
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
      <span class="result-value">R${indigo.absorptionCost.toFixed(2)}</span>
    </div>

    <div class="result-row highlight">
      <span class="result-label">Total</span>
      <span class="result-value">R${indigo.total.toFixed(2)}</span>
    </div>
  </div>

  <!-- ================= LAMINATION ================= -->
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

    <div class="result-row highlight">
      <span class="result-label">Total</span>
      <span class="result-value">R${lamination.total.toFixed(2)}</span>
    </div>
  </div>

  <!-- ================= SLITTING ================= -->
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

  <!-- ================= POUCHING ================= -->
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
      <span class="result-value">R${pouching.materialCost.toFixed(2)}</span>
    </div>

    <div class="result-row">
      <span class="result-label">Maintenance</span>
      <span class="result-value">R${pouching.maintenanceCost.toFixed(2)}</span>
    </div>

    <div class="result-row">
      <span class="result-label">Material cost per meter</span>
      <span class="result-value">R${materialBreakdown.totalPerMeter.toFixed(2)}</span>
    </div>

    <div class="result-row highlight">
      <span class="result-label">Total</span>
      <span class="result-value">R${pouching.total.toFixed(2)}</span>
    </div>
  </div>

</div>

<!-- ================= FINAL SUMMARY ================= -->
<div class="totals" id="finalSummaryCard">

  <div style="display:flex; justify-content:space-between; align-items:center;">
    <h3>Final Summary</h3>
    <button id="copySummaryBtn">Copy</button>
  </div>

  <div class="result-row">
    <span class="result-label">Material construction</span>
    <span class="result-value">${materialData?.name || "None"}</span>
  </div>

  <div class="result-row">
    <span class="result-label">Pouch type</span>
    <span class="result-value">${document.getElementById("pouchType").value || "None"}</span>
  </div>

  <div class="result-row">
    <span class="result-label">Pouch size</span>
    <span class="result-value">${document.getElementById("size").value || "None"}</span>
  </div>

  <div class="result-row">
    <span class="result-label">Number of pouches across</span>
    <span class="result-value">${sizeData.across || "None"}</span>
  </div>

  <div class="result-row">
    <span class="result-label">Number of pouches around</span>
    <span class="result-value">${sizeData.around || "None"}</span>
  </div>

  <div class="result-row">
    <span class="result-label">Number of pouches per frame</span>
    <span class="result-value">${sizeData.ppf || "None"}</span>
  </div>

   <div class="result-row">
    <span class="result-label">Zipper required </span>
    <span class="result-value">${document.getElementById("zipper").value || "None"}</span>
  </div>

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
    <span class="result-label">Price per pouch before VAT</span>
    <span class="result-value">R${pouchpricebeforeVAT.toFixed(2)}</span>
  </div>

  <div class="result-row">
    <span class="result-label">VAT</span>
    <span class="result-value">R${vat.toFixed(2)}</span>
  </div>

  
  <div class="divider"></div>

  <div class="result-row">
    <span class="result-label">Selling Price</span>
    <span class="result-value">R${sellingPrice.toFixed(2)}</span>
  </div>

  <div class="result-row">
    <span class="result-label">Quantity</span>
    <span class="result-value">${quantity}</span>
  </div>

  <div class="result-row">
    <span class="result-label">Price per Pouch after VAT</span>
    <span class="result-value">R${ppp.toFixed(2)}</span>
  </div>

  <div class="divider"></div>
  

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
}
