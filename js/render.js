/* render.js — v3.1: แสดงประวัติในรายละเอียดบิล + ลบได้ทันที */

function renderCustomers(customers = []) {
  const list = document.getElementById("customerList");
  if (!list) return;

  if (!customers.length) {
    list.innerHTML = `<p style="text-align:center;color:#666;">ยังไม่มีลูกค้า</p>`;
    return;
  }
  list.innerHTML = "";

  const tpl = document.getElementById("customerCardTpl");
  const loanTpl = document.getElementById("loanItemTpl");

  customers.forEach((cust) => {
    const node = tpl.content.cloneNode(true);
    const card = node.querySelector(".customer-card");
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
    card.querySelector(".principal-sum").textContent = "฿" + sumP.toLocaleString();
    card.querySelector(".interest-sum").textContent = "฿" + sumI.toLocaleString();

    // toggle expand
    main.addEventListener("click", () => {
      expand.classList.toggle("hidden");
      card.classList.toggle("open");
    });

    // render each loan (บิล)
    (cust.loans || []).forEach((loan, idx) => {
      const lnode = loanTpl.content.cloneNode(true);
      const el = lnode.querySelector(".loan-card");
      el.dataset.loanId = loan.id;

      const curP = calcCurrentPrincipal(loan);
      const curI = calcInterestFromPrincipal(curP, loan.rate);

      el.querySelector(".loan-title").textContent = `บิล #${idx + 1}`;
      el.querySelector(".start").textContent = "เริ่ม: " + formatThaiDate(loan.startDate);
     // el.querySelector(".rate").textContent = `ดอก: ${loan.rate || 10}%`;
      el.querySelector(".principal").textContent = `ต้น: ฿${curP.toLocaleString()}`;
      el.querySelector(".interest").textContent = `ดอก: ฿${curI.toLocaleString()}`;

      // ปุ่มการทำงาน
      el.querySelector("[data-role='pay']").onclick = () => window.openPaymentDialog(cust.id, loan.id);
      el.querySelector("[data-role='topup']").onclick = () => window.openTopupDialog(cust.id, loan.id);
      // เอาปุ่ม history ออกไปเลย (ไม่ใช้ dialog แยกแล้ว)
      const btnHist = el.querySelector("[data-role='history']");
      if (btnHist) btnHist.remove();

      el.querySelector("[data-role='delete-loan']").onclick = () => {
        if (confirm("ลบบิลนี้จริงหรือไม่?")) {
          deleteLoan(cust.id, loan.id);
          renderCustomers(getAllCustomers());
          showToast("ลบบิลเรียบร้อย", "success");
        }
      };

      // 🔥 ประวัติเต็มอยู่ในหน้ารายละเอียดนี้เลย + ปุ่มลบได้
      const wrap = el.querySelector("[data-role='mini-history']");
      const pays = loan.payments || [];
      wrap.innerHTML = `
        <table class="mini-table">
          <thead>
            <tr>
              <th>วันที่</th>
              <th>ประเภท</th>
              <th>ดอก</th>
              <th>ต้น</th>
              <th>Top-up</th>
              <th>ลบ</th>
            </tr>
          </thead>
          <tbody>
            ${
              pays.length
                ? pays
                    .map(
                      (p) => `
                <tr>
                  <td>${formatThaiDate(p.date)}</td>
                  <td>${p.kind === "topup" ? "Top-up" : "จ่าย"}</td>
                  <td>${(p.payInterest || 0).toLocaleString()}</td>
                  <td>${(p.payPrincipal || 0).toLocaleString()}</td>
                  <td>${(p.topupAmount || 0).toLocaleString()}</td>
                  <td><button class="small-btn danger" data-del="${p.id}">ลบ</button></td>
                </tr>`
                    )
                    .join("")
                : `<tr><td colspan="6" style="color:#777;">ยังไม่มีประวัติการจ่าย</td></tr>`
            }
          </tbody>
        </table>
      `;

      // bind ปุ่มลบรายการ
      wrap.querySelectorAll("[data-del]").forEach((btn) => {
        btn.onclick = () => {
          const payId = btn.getAttribute("data-del");
          deletePayment(cust.id, loan.id, payId);
          // คำนวณต้นใหม่โดย render ทั้งหมด (ง่ายและชัวร์)
          renderCustomers(getAllCustomers());
          showToast("ลบรายการเรียบร้อย", "info");
        };
      });

      loansWrap.appendChild(el);
    });

    // ระดับลูกค้า
    const addLoanBtn = expand.querySelector("[data-role='add-loan']");
    if (addLoanBtn) addLoanBtn.onclick = () => window.openLoanDialog(cust.id, cust.name);

    const delCustBtn = expand.querySelector("[data-role='delete-customer']");
    if (delCustBtn)
      delCustBtn.onclick = () => {
        if (confirm(`ลบลูกค้า ${cust.name} ทั้งหมดจริงหรือไม่?`)) {
          deleteCustomer(cust.id);
          renderCustomers(getAllCustomers());
          showToast("ลบลูกค้าเรียบร้อย", "success");
        }
      };

    list.appendChild(card);
  });
}
