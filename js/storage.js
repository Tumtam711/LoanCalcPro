/* storage.js — data layer (localStorage) */

const STORAGE_KEY = "loanCalcPro_final_customers";

function getAllCustomers() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function saveAllCustomers(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

function generateId(prefix="id"){
  return `${prefix}_${Date.now()}_${Math.floor(Math.random()*9999)}`;
}

/* Customer CRUD */
function addCustomer({name, phone, amount, rate, startDate}){
  const all = getAllCustomers();
  const cust = {
    id: generateId("cust"),
    name, phone,
    loans: [{
      id: generateId("loan"),
      rate: Number(rate)||10,
      startDate: startDate || new Date().toISOString().split("T")[0],
      basePrincipal: Number(amount)||0,
      payments: [] // {id,date,kind:'payment'|'topup', payInterest, payPrincipal, topupAmount}
    }]
  };
  all.push(cust);
  saveAllCustomers(all);
  return cust;
}

function updateCustomer(custId, newData){
  const all = getAllCustomers();
  const idx = all.findIndex(c=>c.id===custId);
  if (idx===-1) return false;
  all[idx] = {...all[idx], ...newData};
  saveAllCustomers(all);
  return true;
}

function getCustomerById(custId){
  return getAllCustomers().find(c=>c.id===custId);
}

function deleteCustomer(custId){
  saveAllCustomers(getAllCustomers().filter(c=>c.id!==custId));
}

/* Loan CRUD */
function addLoanToCustomer(custId, {amount, rate, startDate}){
  const all = getAllCustomers();
  const idx = all.findIndex(c=>c.id===custId);
  if (idx===-1) return false;
  all[idx].loans.push({
    id: generateId("loan"),
    rate: Number(rate)||10,
    startDate: startDate || new Date().toISOString().split("T")[0],
    basePrincipal: Number(amount)||0,
    payments: []
  });
  saveAllCustomers(all);
  return true;
}

function deleteLoan(custId, loanId){
  const all = getAllCustomers();
  const ci = all.findIndex(c=>c.id===custId);
  if (ci===-1) return false;
  all[ci].loans = (all[ci].loans||[]).filter(l=>l.id!==loanId);
  saveAllCustomers(all);
  return true;
}

/* Payments */
function addPayment(custId, loanId, {payInterest=0, payPrincipal=0}){
  const all = getAllCustomers();
  const ci = all.findIndex(c=>c.id===custId);
  if (ci===-1) return false;
  const li = all[ci].loans.findIndex(l=>l.id===loanId);
  if (li===-1) return false;

  all[ci].loans[li].payments.push({
    id: generateId("pay"),
    date: new Date().toISOString().split("T")[0],
    kind: "payment",
    payInterest: Number(payInterest)||0,
    payPrincipal: Number(payPrincipal)||0
  });
  saveAllCustomers(all);
  return true;
}

function addTopup(custId, loanId, amount){
  const all = getAllCustomers();
  const ci = all.findIndex(c=>c.id===custId);
  if (ci===-1) return false;
  const li = all[ci].loans.findIndex(l=>l.id===loanId);
  if (li===-1) return false;

  all[ci].loans[li].payments.push({
    id: generateId("topup"),
    date: new Date().toISOString().split("T")[0],
    kind: "topup",
    topupAmount: Number(amount)||0
  });
  saveAllCustomers(all);
  return true;
}

function deletePayment(custId, loanId, payId){
  const all = getAllCustomers();
  const ci = all.findIndex(c=>c.id===custId);
  if (ci===-1) return false;
  const loan = all[ci].loans.find(l=>l.id===loanId);
  if (!loan) return false;
  loan.payments = (loan.payments||[]).filter(p=>p.id!==payId);
  saveAllCustomers(all);
  return true;
}

/* Export / Import */
function exportAsJSON(){
  const blob = new Blob([JSON.stringify(getAllCustomers(),null,2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `loanCalc_backup_${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importFromJSONFile(){
  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = "application/json";
  inp.onchange = (e)=>{
    const f = e.target.files[0];
    if(!f) return;
    const rd = new FileReader();
    rd.onload = ()=>{
      try{
        const arr = JSON.parse(rd.result);
        if(!Array.isArray(arr)) throw new Error("ไฟล์ไม่ถูกต้อง");
        saveAllCustomers(arr);
        window.showToast?.("กู้คืนข้อมูลเรียบร้อย","success");
        window.renderCustomers?.(getAllCustomers());
      }catch{
        window.showToast?.("ไฟล์ไม่ถูกต้อง","danger");
      }
    };
    rd.readAsText(f);
  };
  inp.click();
}
