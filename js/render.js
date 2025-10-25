/* render.js — v3.5: สมูทอยู่ที่เดิมหลังบันทึก / ลบ / เพิ่ม / จ่าย + สถานะค้างงวด */

function getLoanStatus(loan) {
  if (!loan) return "normal";
  const lastDate = (loan.payments && loan.payments.length)
    ? new Date(loan.payments[loan.payments.length - 1].date)
    : new Date(loan.startDate);
  const now = new Date();
  const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
  if (diffDays > 28) return "overdue3plus";
  if (diffDays > 21) return "overdue3";
  if (diffDays > 14) return "overdue2";
  if (diffDays > 7) return "overdue1";
  if (diffDays === 7) return "due";
  return "normal";
}

function renderCustomers(customers = []) {
  const list = document.getElementById("customerList");
  if (!list) return;

  // 🧠 จำสถานะที่เปิดไว้ก่อน render ใหม่
  const openedIds = [...document.querySelectorAll(".customer-card.open")]
    .map(el => el.dataset.id);
  const scrollY = window.scrollY;

  if (!customers.length) {
    list.innerHTML = `<p style="text-align:center;color:#666;">ยังไม่มีลูกค้า</p>`;
    return;
  }
  list.innerHTML = "";

  const tpl = document.getElementById("customerCardTpl");
  const loanTpl = document.getElementById("loanItemTpl");

  customers.sort((a, b) => {
    const loanA = (a.loans || []).slice(-1)[0];
    const loanB = (b.loans || []).slice(-1)[0];
    const sA = loanA ? getLoanStatus(loanA) : "normal";
    const sB = loanB ? getLoanStatus(loanB) : "normal";
    const priority = {
      overdue3plus: 5, overdue3: 4, overdue2: 3, overdue1: 2, due: 1, normal: 0
    };
    return priority[sB] - priority[sA];
  });

  customers.forEach((cust) => {
    const node = tpl.content.cloneNode(true);
    const card = node.querySelector(".customer-card");
    card.dataset.id = cust.id; // 🆔 ใช้คืนสถานะตอน render ใหม่
    const main = card.querySelector(".card-main");
    const expand = card.querySelector(".card-expand");
    const loansWrap = card.querySelector("[data-role='loans']");

    // header summary
    card.querySelector(".cust-name").textContent = cust.name;
    card.querySelector(".cust-phone").textContent = cust.phone || "-";
    const loanCount = (cust.loans || []).length;

    let sumP = 0, sumI = 0;
    (cust.loans || []).forEach((l) => {
      const p = calcCurrentPrincipal(l);
      sumP += p;
      sumI += calcInterestFromPrincipal(p, l.rate);
    });
    card.querySelector(".loan-count").textContent = loanCount;
    card.querySelector(".principal-sum").textContent = sumP.toLocaleString();
    card.querySelector(".interest-sum").textContent = sumI.toLocaleString();

    // toggle expand
    main.addEventListener("click", () => {
      expand.classList.toggle("hidden");
      card.classList.toggle("open");
    });

    // ✅ badge สถานะ
    const latestLoan = (cust.loans || []).slice(-1)[0];
    let statusText = "ปกติ", statusClass = "normal";
    if (latestLoan) {
      const st = getLoanStatus(latestLoan);
      if (st === "due") { statusText = "ครบงวด"; statusClass = "due"; }
      else if (st === "overdue1") { statusText = "ค้าง 1 งวด"; statusClass = "overdue1"; }
      else if (st === "overdue2") { statusText = "ค้าง 2 งวด"; statusClass = "overdue2"; }
      else if (st === "overdue3") { statusText = "ค้าง 3 งวด"; statusClass = "overdue3"; }
      else if (st === "overdue3plus") { statusText = "ค้างหลายงวด"; statusClass = "overdue3plus"; }
    }
    const badge = document.createElement("span");
    badge.className = `status-badge ${statusClass}`;
    badge.textContent = statusText;
    badge.style.position = "absolute";
    badge.style.right = "10px";
    badge.style.top = "5px";
    badge.style.fontSize = "0.9rem";
    badge.style.padding = "4px 8px";
    badge.style.borderRadius = "8px";
    card.querySelector(".card-main").appendChild(badge);

    // render loans
    (cust.loans || []).forEach((loan, idx) => {
      const lnode = loanTpl.content.cloneNode(true);
      const el = lnode.querySelector(".loan-card");
      el.dataset.loanId = loan.id;

      const curP = calcCurrentPrincipal(loan);
      const curI = calcInterestFromPrincipal(curP, loan.rate);

      el.querySelector(".loan-title").textContent = `บิล #${idx + 1}`;
      el.querySelector(".start").textContent = "เริ่ม: " + formatThaiDate(loan.startDate);
      el.querySelector(".principal").textContent = `ต้น: ${curP.toLocaleString()}`;
      el.querySelector(".interest").textContent = `ดอก: ${curI.toLocaleString()}`;

      el.querySelector("[data-role='pay']").onclick = () => window.openPaymentDialog(cust.id, loan.id);
      el.querySelector("[data-role='topup']").onclick = () => window.openTopupDialog(cust.id, loan.id);

      const btnHist = el.querySelector("[data-role='history']");
      if (btnHist) btnHist.remove();

      el.querySelector("[data-role='delete-loan']").onclick = () => {
        showConfirm("ลบบิลเงินกู้", `ยืนยันลบบิลนี้ของ ${cust.name}?`, () => {
          deleteLoan(cust.id, loan.id);
          renderCustomers(getAllCustomers());
          showToast("ลบบิลนี้เรียบร้อย ✅", "success");
        });
      };

      const wrap = el.querySelector("[data-role='mini-history']");
      const pays = loan.payments || [];
      wrap.innerHTML = `
        <table class="mini-table">
          <thead><tr><th>วันที่</th><th>ประเภท</th><th>ดอก</th><th>ต้น</th><th>กู้เพิ่ม</th><th>ลบ</th></tr></thead>
          <tbody>
            ${pays.length ? pays.map(p => `
              <tr>
                <td>${formatThaiDate(p.date)}</td>
                <td>${p.kind === "topup" ? "กู้เพิ่ม" : "จ่าย"}</td>
                <td>${(p.payInterest || 0).toLocaleString()}</td>
                <td>${(p.payPrincipal || 0).toLocaleString()}</td>
                <td>${(p.topupAmount || 0).toLocaleString()}</td>
                <td><button class="small-btn danger" data-del="${p.id}">ลบ</button></td>
              </tr>`).join("") : `<tr><td colspan="6" style="color:#777;">ยังไม่มีประวัติการจ่าย</td></tr>`}
          </tbody>
        </table>
      `;
      wrap.querySelectorAll("[data-del]").forEach(btn => {
        btn.onclick = () => {
          const payId = btn.dataset.del;
          showConfirm("ลบรายการ", "ยืนยันลบประวัติการจ่ายนี้?", () => {
            deletePayment(cust.id, loan.id, payId);
            renderCustomers(getAllCustomers());
            showToast("ลบรายการเรียบร้อย ✅", "info");
          });
        };
      });

      loansWrap.appendChild(el);
    });

    const addLoanBtn = expand.querySelector("[data-role='add-loan']");
    if (addLoanBtn) addLoanBtn.onclick = () => window.openLoanDialog(cust.id, cust.name);

    const delCustBtn = expand.querySelector("[data-role='delete-customer']");
    if (delCustBtn) {
      delCustBtn.onclick = () => {
        showConfirm("ลบลูกค้า", `ลบลูกค้า ${cust.name} ทั้งหมดจริงหรือไม่?`, () => {
          deleteCustomer(cust.id);
          renderCustomers(getAllCustomers());
          showToast("ลบลูกค้าเรียบร้อย ✅", "success");
        });
      };
    }

    list.appendChild(card);
  });

  // 🪄 คืนสถานะเปิดและ scroll กลับที่เดิม
  openedIds.forEach(id => {
    const card = document.querySelector(`.customer-card[data-id="${id}"]`);
    if (card) {
      card.classList.add("open");
      const expand = card.querySelector(".card-expand");
      if (expand) expand.classList.remove("hidden");
    }
  });
  setTimeout(() => window.scrollTo(0, scrollY), 100);
}
