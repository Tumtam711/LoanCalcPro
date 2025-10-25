/* ui.js — dialogs & toasts */

(function () {
    const dlgAdd = document.getElementById("customerDialog");
    const dlgPay = document.getElementById("paymentDialog");
    const dlgTopup = document.getElementById("topupDialog");
    const dlgLoan = document.getElementById("loanDialog");
    const dlgSummary = document.getElementById("summaryDialog");

    const toastWrap = document.getElementById("toastWrap");

    window.showToast = function (msg, type = "info") {
        const t = document.createElement("div");
        t.className = `toast ${type}`;
        t.textContent = msg;
        toastWrap.appendChild(t);
        setTimeout(() => t.classList.add("show"), 30);
        setTimeout(() => {
            t.classList.remove("show");
            setTimeout(() => t.remove(), 300);
        }, 2500);
    };

    function open(el) { el.classList.add("show"); el.classList.remove("hidden"); }
    function close(el) { el.classList.remove("show"); el.classList.add("hidden"); }

    /* เพิ่มลูกค้า */
    window.openAddCustomerDialog = function () {
        // reset fields
        document.getElementById("custName").value = "";
        document.getElementById("custPhone").value = "";
        document.getElementById("custAmount").value = "";
        document.getElementById("custRate").value = 10;
        document.getElementById("custStartDate").value = new Date().toISOString().split("T")[0];
        open(dlgAdd);
    };

    document.getElementById("customerCancel").onclick = () => close(dlgAdd);
    document.getElementById("customerSave").onclick = () => {
        const name = document.getElementById("custName").value.trim();
        const phone = document.getElementById("custPhone").value.trim();
        const amount = Number(document.getElementById("custAmount").value || 0);
        const rate = Number(document.getElementById("custRate").value || 10);
        const start = document.getElementById("custStartDate").value || new Date().toISOString().split("T")[0];
        if (!name || !amount) { showToast("กรอกข้อมูลให้ครบ", "warn"); return; }
        addCustomer({ name, phone, amount, rate, startDate: start });
        close(dlgAdd);
        renderCustomers(getAllCustomers());
        showToast("เพิ่มลูกค้าเรียบร้อย", "success");
    };

    /* จ่ายเงิน */
    let ctxPay = { custId: null, loanId: null, currentInterest: 0, currentPrincipal: 0 };
    window.openPaymentDialog = function (custId, loanId) {
        const cust = getCustomerById(custId); if (!cust) return;
        const loan = (cust.loans || []).find(l => l.id === loanId); if (!loan) return;

        const curP = calcCurrentPrincipal(loan);
        const curI = calcInterestFromPrincipal(curP, loan.rate);

        document.getElementById("payCustName").textContent = cust.name;
        document.getElementById("payPrincipalRemain").textContent = "฿" + curP.toLocaleString();
        document.getElementById("payInterestDue").textContent = "฿" + curI.toLocaleString();
        document.getElementById("payInterest").value = "";
        document.getElementById("payPrincipal").value = "";

        ctxPay = { custId, loanId, currentInterest: curI, currentPrincipal: curP };
        open(dlgPay);
    };

    document.getElementById("paymentCancel").onclick = () => close(dlgPay);
    document.getElementById("paymentSave").onclick = () => {
        const payI = Number(document.getElementById("payInterest").value || 0);
        const payP = Number(document.getElementById("payPrincipal").value || 0);

        // ต้องจ่ายดอกให้ครบก่อนถึงจะจ่ายต้น
        if (payP > 0 && payI < ctxPay.currentInterest) {
            showToast("ต้องจ่ายดอกให้ครบก่อนถึงจะจ่ายต้นได้!", "warn");
            return;
        }

        addPayment(ctxPay.custId, ctxPay.loanId, { payInterest: payI, payPrincipal: payP });
        close(dlgPay);
        renderCustomers(getAllCustomers());
        showToast("บันทึกการจ่ายเรียบร้อย", "success");
    };

    /* Top-up (แก้ไขเงินต้นในงวดเดิม) */
    let ctxTop = { custId: null, loanId: null };
    window.openTopupDialog = function (custId, loanId) {
        const cust = getCustomerById(custId); if (!cust) return;
        const loan = (cust.loans || []).find(l => l.id === loanId); if (!loan) return;
        const curP = calcCurrentPrincipal(loan);
        document.getElementById("topupCustName").textContent = cust.name;
        document.getElementById("topupCurrentPrincipal").textContent = "฿" + curP.toLocaleString();
        document.getElementById("topupAmount").value = "";
        ctxTop = { custId, loanId };
        open(dlgTopup);
    };

    document.getElementById("topupCancel").onclick = () => close(dlgTopup);
    document.getElementById("topupSave").onclick = () => {
        const amt = Number(document.getElementById("topupAmount").value || 0);
        if (amt <= 0) { showToast("ใส่จำนวนให้ถูกต้อง", "warn"); return; }
        addTopup(ctxTop.custId, ctxTop.loanId, amt);
        close(dlgTopup);
        renderCustomers(getAllCustomers());
        showToast("เพิ่มต้น (Top-up) เรียบร้อย", "success");
    };

    let ctxLoan = { custId: null };
    window.openLoanDialog = function (custId, custName) {
        ctxLoan = { custId };
        document.getElementById("loanDlgCustName").textContent = custName || "-";
        document.getElementById("loanDlgAmount").value = "";
        document.getElementById("loanDlgRate").value = 10;
        document.getElementById("loanDlgStart").value = new Date().toISOString().split("T")[0];
        open(dlgLoan);
    };
    document.getElementById("loanDlgCancel").onclick = () => close(dlgLoan);
    document.getElementById("loanDlgSave").onclick = () => {
        const amount = Number(document.getElementById("loanDlgAmount").value || 0);
        const rate = Number(document.getElementById("loanDlgRate").value || 10);
        const start = document.getElementById("loanDlgStart").value || new Date().toISOString().split("T")[0];
        if (amount <= 0) { showToast("กรอกยอดกู้ให้ถูกต้อง", "warn"); return; }

        addLoanToCustomer(ctxLoan.custId, { amount, rate, startDate: start });
        close(dlgLoan);
        renderCustomers(getAllCustomers());
        showToast("เพิ่มบิลใหม่เรียบร้อย", "success");
    };

    /* ประวัติ */
    window.openHistoryDialog = function (custId, loanId) {
        const cust = getCustomerById(custId); if (!cust) return;
        const loan = (cust.loans || []).find(l => l.id === loanId); if (!loan) return;
        const pays = loan.payments || [];

        const wrap = document.getElementById("historyWrap");
        if (!pays.length) {
            wrap.innerHTML = `<p style="color:#666;">ยังไม่มีประวัติการจ่าย</p>`;
        } else {
            wrap.innerHTML = `
        <table class="full-history">
          <thead><tr><th>วันที่</th><th>ประเภท</th><th>ดอก</th><th>ต้น</th><th>Top-up</th><th>ลบ</th></tr></thead>
          <tbody>
            ${pays.map(p => `
              <tr>
                <td>${formatThaiDate(p.date)}</td>
                <td>${p.kind === "topup" ? "Top-up" : "จ่าย"}</td>
                <td>${(p.payInterest || 0).toLocaleString()}</td>
                <td>${(p.payPrincipal || 0).toLocaleString()}</td>
                <td>${(p.topupAmount || 0).toLocaleString()}</td>
                <td><button class="small-btn danger" data-pay-id="${p.id}">ลบ</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;

            wrap.querySelectorAll("[data-pay-id]").forEach(btn => {
                btn.onclick = () => {
                    const payId = btn.dataset.payId;
                    deletePayment(custId, loanId, payId);
                    openHistoryDialog(custId, loanId); // reload view
                    renderCustomers(getAllCustomers()); // อัปเดตต้นคงเหลือ
                    showToast("ลบรายการเรียบร้อย", "info");
                };
            });
        }

        open(dlgHistory);
        document.getElementById("historyClose").onclick = () => close(dlgHistory);
    };

    /* สรุป */
    window.openSummaryDialog = function () {
        const { totalCustomers, totalRemain, totalGiven, totalInterestView } = computeSummary();
        document.getElementById("sumCustomers").textContent = totalCustomers.toLocaleString();
        document.getElementById("sumPrincipal").textContent = "฿" + totalGiven.toLocaleString();
        document.getElementById("sumRemain").textContent = "฿" + totalRemain.toLocaleString();
        document.getElementById("sumInterestView").textContent = "฿" + totalInterestView.toLocaleString();
        open(dlgSummary);
        document.getElementById("btnCloseSummary").onclick = () => close(dlgSummary);
    };

    /* ☁️ Cloud Sync: Google Sheet */
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxFqbZrbHJ_YreIFeVZpHJ-fuYrkXjkIUEzuqyt3RoUacrtHyEU-GrdVME2uPlu-rhwfg/exec";


    // ซิงค์ข้อมูลขึ้น Google Sheet
    window.syncUp = async function () {
        const data = getAllCustomers();
        updateSyncStatus("กำลังอัปโหลด...");
        try {
            const res = await fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" },
            });
            if (res.ok) {
                updateSyncStatus("☁️ ซิงค์ขึ้นสำเร็จ (" + getThaiTime() + ")");
                showToast("อัปโหลดขึ้น Google Sheet เรียบร้อย ✅", "success");
            } else {
                updateSyncStatus("❌ ซิงค์ล้มเหลว");
                showToast("ส่งข้อมูลไม่สำเร็จ", "danger");
            }
        } catch (err) {
            console.error(err);
            updateSyncStatus("❌ ไม่สามารถเชื่อมต่อได้");
            showToast("เชื่อมต่อ Google Sheet ไม่สำเร็จ", "warn");
        }
    };

    // ดึงข้อมูลจาก Google Sheet กลับมา
    window.syncDown = async function () {
        updateSyncStatus("กำลังดึงข้อมูล...");
        try {
            const res = await fetch(GOOGLE_SCRIPT_URL);
            const data = await res.json();
            if (Array.isArray(data)) {
                saveAllCustomers(data);
                renderCustomers(getAllCustomers());
                updateSyncStatus("⬇️ ดึงข้อมูลสำเร็จ (" + getThaiTime() + ")");
                showToast("โหลดข้อมูลจาก Google Sheet สำเร็จ ✅", "success");
            } else {
                updateSyncStatus("❌ ข้อมูลไม่ถูกต้อง");
            }
        } catch (err) {
            console.error(err);
            updateSyncStatus("❌ ดึงข้อมูลไม่สำเร็จ");
            showToast("โหลดข้อมูลจาก Google Sheet ล้มเหลว", "warn");
        }
    };

    function updateSyncStatus(text) {
        const el = document.getElementById("syncStatus");
        if (el) el.textContent = text;
    }

    function getThaiTime() {
        const now = new Date();
        return now.toLocaleString("th-TH", { hour: "2-digit", minute: "2-digit" });
    }
document.addEventListener("DOMContentLoaded", () => {
  const upBtn = document.getElementById("btnSyncUp");
  const downBtn = document.getElementById("btnSyncDown");
  if (upBtn) upBtn.onclick = syncUp;
  if (downBtn) downBtn.onclick = syncDown;
});

})();
