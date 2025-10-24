// js/calc.js

/* ===========================
   ฟังก์ชัน Dialog (ใช้ร่วมได้ทุกโหมด)
=========================== */
function showDialog(title, message, onConfirm) {
  const dialog = document.getElementById("dialog");
  const titleEl = document.getElementById("dialog-title");
  const msgEl = document.getElementById("dialog-message");
  const btnConfirm = document.getElementById("dialog-confirm");
  const btnCancel = document.getElementById("dialog-cancel");

  titleEl.innerHTML = title;
  msgEl.innerHTML = message;
  dialog.classList.remove("hidden");

  const closeDialog = () => {
    dialog.classList.add("hidden");
    btnConfirm.removeEventListener("click", confirmHandler);
    btnCancel.removeEventListener("click", cancelHandler);
  };

  const confirmHandler = () => {
    closeDialog();
    if (typeof onConfirm === "function") onConfirm();
  };

  const cancelHandler = () => closeDialog();

  btnConfirm.addEventListener("click", confirmHandler);
  btnCancel.addEventListener("click", cancelHandler);
}

/* ===========================
   Logic หลักคำนวณ LoanCalc
=========================== */
document.addEventListener("DOMContentLoaded", () => {
  const btnCalc = document.getElementById("btnCalc");
  const btnReset = document.getElementById("btnReset");
  const btnSaveLoan = document.getElementById("btnSaveLoan");

  const resultSection = document.getElementById("result-section");
  const resultTable = document.querySelector("#resultTable tbody");
  const summaryEl = document.getElementById("summary");

  const dialogSave = document.getElementById("dialog-save");
  const existingSelect = document.getElementById("existingCustomer");
  const newFields = document.getElementById("newCustomerFields");
  const nameInput = document.getElementById("custName");
  const phoneInput = document.getElementById("custPhone");
  const addressInput = document.getElementById("custAddress");
  const cancelSaveBtn = document.getElementById("cancelSave");
  const confirmSaveBtn = document.getElementById("confirmSave");

  let lastLoanData = null;

  /* ✅ ปุ่มคำนวณ (ของเดิม) */
  btnCalc.addEventListener("click", () => {
    const amount = parseFloat(document.getElementById("loanAmount").value);
    const rate = parseFloat(document.getElementById("interestRate").value);
    const type = document.getElementById("interestType").value;
    const ratePeriod = document.getElementById("ratePeriod").value;
    const term = parseInt(document.getElementById("term").value);
    let startDate = document.getElementById("startDate").value;

    const missing = [];
    if (!amount) missing.push("ยอดเงินกู้");
    if (!rate) missing.push("อัตราดอกเบี้ย");
    if (!term) missing.push("จำนวนงวด");

    if (missing.length > 0) {
      showDialog(
        "กรอกข้อมูลไม่ครบ",
        `กรุณากรอกช่องต่อไปนี้ให้ครบ:<br>${missing.join("<br>")}`
      );
      return;
    }

    if (!startDate) startDate = new Date().toISOString().split("T")[0];
    const r = rate / 100;

    const data =
      type === "flat"
        ? calcFlat(amount, r, term, startDate, ratePeriod)
        : calcAmortized(amount, r, term, startDate, ratePeriod);

    renderTable(data, resultTable, summaryEl);
    resultSection.classList.remove("hidden");
    window.scrollTo({ top: resultSection.offsetTop, behavior: "smooth" });

    // บันทึกข้อมูลล่าสุดเก็บไว้สำหรับ save ลูกค้า
    lastLoanData = {
      amount,
      rate,
      type,
      period: ratePeriod,
      term,
      startDate,
      table: data.list,
    };
  });

  /* 💾 ปุ่มบันทึกลูกค้า */
  btnSaveLoan.addEventListener("click", () => {
    if (!lastLoanData) {
      showDialog("ยังไม่มีข้อมูล", "กรุณาคำนวณก่อนบันทึกลูกค้า");
      return;
    }

    // โหลดลูกค้าเดิมมาแสดงใน dropdown
    if (typeof getAllCustomers === "function") {
      const customers = getAllCustomers();
      existingSelect.innerHTML = `<option value="new" selected>➕ เพิ่มลูกค้าใหม่</option>`;
      customers.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = `${c.name} (${c.phone || "ไม่ระบุเบอร์"})`;
        existingSelect.appendChild(opt);
      });
    }

    dialogSave.classList.remove("hidden");
  });

  /* 🎛️ สลับช่องกรอกใหม่ */
  existingSelect.addEventListener("change", () => {
    if (existingSelect.value === "new") {
      newFields.style.display = "block";
    } else {
      newFields.style.display = "none";
    }
  });

  /* ❌ ยกเลิกบันทึก */
  cancelSaveBtn.addEventListener("click", () => {
    dialogSave.classList.add("hidden");
  });

  /* ✅ ยืนยันบันทึก */
  confirmSaveBtn.addEventListener("click", () => {
    const isNew = existingSelect.value === "new";

    if (isNew && !nameInput.value.trim()) {
      showDialog("กรอกข้อมูลไม่ครบ", "กรุณากรอกชื่ออย่างน้อย 1 ช่อง");
      return;
    }

    let customerInfo = {};
    if (isNew) {
      customerInfo = {
        name: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        address: addressInput.value.trim(),
      };
    } else {
      const all = getAllCustomers();
      const c = all.find((x) => x.id === existingSelect.value);
      if (!c) return;
      customerInfo = c;
    }

    saveNewLoan(customerInfo, lastLoanData);
    dialogSave.classList.add("hidden");

    // แจ้งสำเร็จ
    showDialog(
      "บันทึกสำเร็จ 🎉",
      "ข้อมูลลูกค้าถูกบันทึกเรียบร้อยแล้ว!",
      () => window.location.href = "customers.html"
    );

    // เคลียร์ฟอร์ม popup
    nameInput.value = "";
    phoneInput.value = "";
    addressInput.value = "";
  });
});


  // รีเซ็ต
  btnReset.addEventListener("click", () => {
    showDialog("รีเซ็ตข้อมูล", "คุณต้องการล้างข้อมูลทั้งหมดหรือไม่?", () => {
      document.getElementById("loanAmount").value = "";
      document.getElementById("interestRate").value = "";
      document.getElementById("term").value = "";
      document.getElementById("startDate").value = "";
      resultTable.innerHTML = "";
      summaryEl.innerHTML = "";
      resultSection.classList.add("hidden");
    });
  });

/* ==================================
   💾 Auto Save / Restore Form
================================== */
const FORM_KEY = "loanCalcPro_form";

function saveFormState() {
  const data = {
    loanAmount: document.getElementById("loanAmount").value,
    interestRate: document.getElementById("interestRate").value,
    interestType: document.getElementById("interestType").value,
    ratePeriod: document.getElementById("ratePeriod").value,
    term: document.getElementById("term").value,
    startDate: document.getElementById("startDate").value,
  };
  localStorage.setItem(FORM_KEY, JSON.stringify(data));
}

function loadFormState() {
  const data = localStorage.getItem(FORM_KEY);
  if (!data) return;
  try {
    const f = JSON.parse(data);
    document.getElementById("loanAmount").value = f.loanAmount || "";
    document.getElementById("interestRate").value = f.interestRate || "";
    document.getElementById("interestType").value = f.interestType || "flat";
    document.getElementById("ratePeriod").value = f.ratePeriod || "week";
    document.getElementById("term").value = f.term || "";
    document.getElementById("startDate").value = f.startDate || "";
  } catch (e) {
    console.warn("โหลดฟอร์มไม่สำเร็จ", e);
  }
}

function clearFormState() {
  localStorage.removeItem(FORM_KEY);
}

/* 🎯 ผูก event อัตโนมัติ */
document.addEventListener("DOMContentLoaded", () => {
  loadFormState();

  const inputs = document.querySelectorAll(
    "#loanAmount, #interestRate, #interestType, #ratePeriod, #term, #startDate"
  );
  inputs.forEach((el) => el.addEventListener("input", saveFormState));
});

/* ===========================
   ดอกเบี้ยคงที่ (Flat)
=========================== */
function calcFlat(P, r, n, startDate, period) {
  const list = [];
  const interestPerTerm = P * r;
  const principalPerTerm = P / n;
  let totalInterest = 0;

  for (let i = 1; i <= n; i++) {
    const dueDate = nextDue(startDate, i, period);
    const interest = interestPerTerm;
    const principal = principalPerTerm;
    const total = principal + interest;
    totalInterest += interest;

    list.push({ i, dueDate, principal, interest, total });
  }

  return { list, totalInterest };
}

/* ===========================
   ดอกเบี้ยลดต้นลดดอก
=========================== */
function calcAmortized(P, r, n, startDate, period) {
  const list = [];
  const installment = (P * r) / (1 - Math.pow(1 + r, -n));
  let balance = P;
  let totalInterest = 0;

  for (let i = 1; i <= n; i++) {
    const dueDate = nextDue(startDate, i, period);
    const interest = balance * r;
    const principal = installment - interest;
    balance -= principal;
    totalInterest += interest;

    list.push({
      i,
      dueDate,
      principal,
      interest,
      total: principal + interest,
    });
  }

  return { list, totalInterest };
}

/* ===========================
   แสดงผลในตาราง
=========================== */
function renderTable(data, tbody, summaryEl) {
  tbody.innerHTML = "";
  let totalPrincipal = 0;
  let totalInterest = 0;
  let totalSum = 0;

  data.list.forEach((row) => {
    totalPrincipal += row.principal;
    totalInterest += row.interest;
    totalSum += row.total;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.i}</td>
      <td>${row.dueDate}</td>
      <td>${row.principal.toFixed(2)}</td>
      <td>${row.interest.toFixed(2)}</td>
      <td>${row.total.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });

  summaryEl.innerHTML = `
    <p><strong>รวมเงินต้น:</strong> ${totalPrincipal.toFixed(2)} บาท</p>
    <p><strong>รวมดอกเบี้ยทั้งหมด:</strong> ${totalInterest.toFixed(2)} บาท</p>
    <p><strong>ยอดรวมทั้งหมด:</strong> ${totalSum.toFixed(2)} บาท</p>
  `;
}

/* ===========================
   วันครบกำหนดตามช่วงเวลาที่เลือก
=========================== */
function nextDue(startDate, index, period) {
  const d = new Date(startDate);

  switch (period) {
    case "day":
      d.setDate(d.getDate() + (index - 1));
      break;
    case "week":
      d.setDate(d.getDate() + 7 * (index - 1));
      break;
    case "month":
      d.setMonth(d.getMonth() + (index - 1));
      break;
    case "year":
      d.setFullYear(d.getFullYear() + (index - 1));
      break;
  }

  return d.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
