document.addEventListener("DOMContentLoaded", () => {
    const listEl = document.getElementById("customerList");
    const searchEl = document.getElementById("searchInput");

    const detailDialog = document.getElementById("customerDetail");
    const custNameEl = document.getElementById("custName");
    const custPhoneEl = document.getElementById("custPhone");
    const custAddressEl = document.getElementById("custAddress");
    const loanListEl = document.getElementById("loanList");
    const closeDetailBtn = document.getElementById("closeDetail");

    const confirmDialog = document.getElementById("confirmDelete");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
    const cancelDeleteBtn = document.getElementById("cancelDelete");

    let customers = [];
    let selectedId = null;

    /* ===========================
       ฟังก์ชันหลัก
    =========================== */

    // โหลดข้อมูลลูกค้าทั้งหมด
    function loadCustomers() {
        if (typeof getAllCustomers === "function") {
            customers = getAllCustomers();
        } else {
            customers = [];
        }
        renderCustomers(customers);
    }

    // แสดงรายชื่อลูกค้า
    function renderCustomers(data) {
        if (!data.length) {
            listEl.innerHTML = `<p class="empty-text">ยังไม่มีข้อมูลลูกค้า</p>`;
            return;
        }

        listEl.innerHTML = "";
        data.forEach((cust) => {
            const div = document.createElement("div");
            div.className = "customer-card";
            div.innerHTML = `
        <div class="cust-info">
          <h3>${cust.name}</h3>
          <p>${cust.phone || "ไม่ระบุเบอร์"}</p>
          <p>จำนวนสัญญา: <strong>${cust.loans?.length || 0}</strong></p>
        </div>
        <div class="cust-actions">
          <button class="small-btn info" data-id="${cust.id}" data-action="view">ดู</button>
          <button class="small-btn danger" data-id="${cust.id}" data-action="delete">ลบ</button>
        </div>
      `;
            listEl.appendChild(div);
        });
    }

    // แปล period ไทย
    function getPeriodLabel(period) {
        switch (period) {
            case "day": return "ต่อวัน";
            case "week": return "ต่อสัปดาห์";
            case "month": return "ต่อเดือน";
            case "year": return "ต่อปี";
            default: return period;
        }
    }

    // ฟังก์ชัน confirm แบบ custom dialog
    function confirmAction(message, onConfirm) {
        const overlay = document.createElement("div");
        overlay.className = "dialog";
        overlay.innerHTML = `
      <div class="dialog-box">
        <h3>ยืนยันการทำรายการ</h3>
        <p>${message}</p>
        <div class="dialog-buttons">
          <button class="secondary">ยกเลิก</button>
          <button class="danger">ตกลง</button>
        </div>
      </div>
    `;
        document.body.appendChild(overlay);
        overlay.querySelector(".secondary").onclick = () => overlay.remove();
        overlay.querySelector(".danger").onclick = () => {
            overlay.remove();
            onConfirm();
        };
    }

    /* ===========================
       การจัดการการค้นหา / ดู / ลบ
    =========================== */

    // ค้นหา
    searchEl.addEventListener("input", (e) => {
        const keyword = e.target.value.trim().toLowerCase();
        const filtered = customers.filter(
            (c) =>
                c.name.toLowerCase().includes(keyword) ||
                (c.phone && c.phone.includes(keyword))
        );
        renderCustomers(filtered);
    });

    // ปุ่มดู / ลบ ลูกค้า
    listEl.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        const id = btn.dataset.id;
        const action = btn.dataset.action;

        if (action === "view") showDetail(id);
        if (action === "delete") confirmDelete(id);
    });

    /* ===========================
       รายละเอียดลูกค้า
    =========================== */

    // ฟังก์ชันแสดงตัวเลขแบบสั้น ถ้าไม่มีทศนิยมจะไม่ใส่ .00
    function formatNumber(num) {
        // ถ้าเป็นจำนวนเต็มเป๊ะ → แสดงแบบไม่ต้องมีทศนิยม
        if (Number.isInteger(num)) return num.toLocaleString();
        // ถ้ามีเศษ → แสดงทศนิยมสูงสุด 2 ตำแหน่ง
        return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    function showDetail(id) {
        const cust = customers.find((c) => c.id === id);
        if (!cust) return;

        custNameEl.textContent = `ชื่อ: ${cust.name}`;
        custPhoneEl.textContent = `เบอร์โทร: ${cust.phone || "-"}`;
        custAddressEl.textContent = `ที่อยู่: ${cust.address || "-"}`;

        loanListEl.innerHTML = cust.loans?.length
            ? cust.loans.map((loan) => renderLoanCard(cust.id, loan)).join("")
            : `<p class="empty-text">ยังไม่มีข้อมูลสัญญา</p>`;

        detailDialog.classList.remove("hidden");
    }

    // render loan card
    function renderLoanCard(custId, loan) {
        const schedule = loan.table || [];
        let paidCount = 0;
        let paidSum = 0;
        let remainSum = 0;
        let rows = "";

        schedule.forEach((row, i) => {
            const paid = loan.paid?.[i] || false;
            const trClass = paid ? "paid-row" : "";
            if (paid) paidCount++;
            paidSum += paid ? row.total : 0;
            remainSum += paid ? 0 : row.total;

            rows += `
        <tr class="${trClass}">
          <td>${i + 1}</td>
          <td>${row.dueDate}</td>
         <td>${formatNumber(row.principal)}</td>
         <td>${formatNumber(row.interest)}</td>
         <td>${formatNumber(row.total)}</td>

          <td><input type="checkbox" data-cust="${custId}" data-loan="${loan.id}" data-term="${i}" ${paid ? "checked" : ""}></td>
        </tr>`;
        });

        const summary = `
      <div class="loan-summary">
        <p>ชำระแล้ว: ${paidCount}/${schedule.length} งวด</p>
        <p>ยอดชำระแล้ว: ${paidSum.toFixed(2)} บาท</p>
        <p>ยอดคงเหลือ: ${remainSum.toFixed(2)} บาท</p>
      </div>`;

        return `
      <div class="loan-card">
        <div class="loan-header">
          <p><strong>ยอดกู้:</strong> ${loan.amount.toLocaleString()} บาท</p>
          <p><strong>ดอกเบี้ย:</strong> ${loan.rate}% (${getPeriodLabel(loan.period)})</p>
          <p><strong>งวดทั้งหมด:</strong> ${loan.term}</p>
          <p><strong>เริ่มวันที่:</strong> ${loan.startDate}</p>
          <button class="small-btn danger" data-cust="${custId}" data-loan="${loan.id}" data-action="delete-loan">🗑️ ลบสัญญานี้</button>
        </div>

        <table class="loan-table">
          <thead>
            <tr>
              <th>งวด</th>
              <th>ครบกำหนด</th>
              <th>เงินต้น</th>
              <th>ดอกเบี้ย</th>
              <th>ยอดรวม</th>
              <th>จ่ายแล้ว</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        ${summary}
      </div>`;
    }

    /* ===========================
       การติ๊กงวด + ลบ loan
    =========================== */

    // ติ๊กงวด
    loanListEl.addEventListener("change", (e) => {
        const chk = e.target;
        if (chk.type !== "checkbox") return;

        const custId = chk.dataset.cust;
        const loanId = chk.dataset.loan;
        const termIndex = parseInt(chk.dataset.term);
        const paid = chk.checked;

        confirmAction(
            paid
                ? "ยืนยันว่าชำระงวดนี้แล้วหรือไม่?"
                : "ยกเลิกการชำระงวดนี้ใช่หรือไม่?",
            () => {
                if (typeof updatePayment === "function") {
                    updatePayment(custId, loanId, termIndex, paid);
                }
                customers = getAllCustomers();
                showDetail(custId);
            }
        );
    });

    // ลบเฉพาะ loan
    loanListEl.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        if (btn.dataset.action === "delete-loan") {
            const custId = btn.dataset.cust;
            const loanId = btn.dataset.loan;
            confirmAction(
                "แน่ใจหรือไม่ว่าจะลบสัญญานี้? การผ่อนทั้งหมดจะถูกลบถาวร!",
                () => {
                    if (typeof deleteLoan === "function") {
                        deleteLoan(custId, loanId);
                    }
                    customers = getAllCustomers();
                    showDetail(custId);
                }
            );
        }
    });

    /* ===========================
       Dialog ลบลูกค้าทั้งคน
    =========================== */
    closeDetailBtn.addEventListener("click", () =>
        detailDialog.classList.add("hidden")
    );

    confirmDeleteBtn.addEventListener("click", () => {
        if (typeof deleteCustomer === "function") {
            deleteCustomer(selectedId);
        }
        customers = customers.filter((c) => c.id !== selectedId);
        renderCustomers(customers);
        confirmDialog.classList.add("hidden");
    });

    cancelDeleteBtn.addEventListener("click", () =>
        confirmDialog.classList.add("hidden")
    );

    function confirmDelete(id) {
        selectedId = id;
        confirmDialog.classList.remove("hidden");
    }

    loadCustomers();
});
