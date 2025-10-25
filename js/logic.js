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

// ใช้โชว์ mini history ตารางสั้น
function formatThaiDate(iso){
  if(!iso) return "-";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()+543}`;
}

// สรุปยอดรวมทั้งระบบ
function computeSummary(){
  const all = getAllCustomers();
  let totalCustomers = all.length;
  let totalRemain = 0;
  let totalGiven = 0;
  let totalInterestView = 0;

  all.forEach(c=>{
    (c.loans||[]).forEach(l=>{
      const p = calcCurrentPrincipal(l);
      totalRemain += p;
      totalGiven += l.basePrincipal + (l.payments||[]).filter(x=>x.kind==="topup").reduce((a,x)=>a+(x.topupAmount||0),0);
      totalInterestView += calcInterestFromPrincipal(p, l.rate);
    });
  });

  return { totalCustomers, totalRemain, totalGiven, totalInterestView };
}
