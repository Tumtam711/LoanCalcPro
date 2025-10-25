/* logic.js — core calculations */

// ดอกเบี้ยโชว์ 10% ของต้นคงเหลือ (ปัดลง)
function calcInterestFromPrincipal(principal, rate=10){
  return Math.floor((Number(principal)||0) * ((Number(rate)||10)/100));
}

// ต้นคงเหลือ = basePrincipal + sum(topup) − sum(payPrincipal)
function calcCurrentPrincipal(loan){
  if(!loan) return 0;
  const base = Number(loan.basePrincipal)||0;
  const pays = loan.payments||[];
  const topups = pays.filter(p=>p.kind==="topup").reduce((a,p)=>a+(Number(p.topupAmount)||0),0);
  const paidP = pays.filter(p=>p.kind==="payment").reduce((a,p)=>a+(Number(p.payPrincipal)||0),0);
  return Math.max(base + topups - paidP, 0);
}

// ตรวจสอบว่าวันนี้ครบงวดหรือค้างงวดไหม
function getLoanStatus(loan) {
  if (!loan) return "normal";

  // วันที่ใช้เป็นจุดเริ่มนับรอบงวด = วันที่จ่ายล่าสุด หรือวันที่กู้
  const lastDate = (loan.payments && loan.payments.length)
    ? new Date(loan.payments[loan.payments.length - 1].date)
    : new Date(loan.startDate);

  const now = new Date();
  const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));

  // 🔹 logic การคำนวณงวด
  if (diffDays > 14) return "overdue2"; // ค้าง 2 งวดขึ้นไป
  if (diffDays > 7) return "overdue";   // ค้างงวดเดียว
  if (diffDays === 7) return "due";     // ครบงวดวันนี้
  return "normal";                      // ปกติ
}


// ใช้โชว์ mini history ตารางสั้น
function formatThaiDate(iso){
  if(!iso) return "-";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()+543}`;
}

// สรุปยอดรวมทั้งระบบ
window.computeSummary = function(startDate, endDate) {
  const data = getAllCustomers();
  let totalCustomers = data.length;
  let totalGiven = 0, totalPrincipalPaid = 0, totalInterestPaid = 0;

  const start = new Date(startDate);
  const end = new Date(endDate);

  data.forEach(c => {
    (c.loans || []).forEach(l => {
      totalGiven += l.amount || 0;

      (l.payments || []).forEach(p => {
        const d = new Date(p.date);
        if (d >= start && d <= end) {
          totalPrincipalPaid += p.payPrincipal || 0;
          totalInterestPaid += p.payInterest || 0;
        }
      });
    });
  });

  const totalProfit = totalInterestPaid;

  return {
    totalCustomers,
    totalGiven,
    totalPrincipalPaid,
    totalInterestPaid,
    totalProfit
  };
};
