/* ==============================
   📦 LoanCalc Pro — storage.js
   ระบบเก็บข้อมูลลูกค้าและสัญญาเงินกู้ (localStorage)
   ใช้ได้ทุกหน้า ไม่ต้อง import
============================== */

const STORAGE_KEY = "loanCalcPro_customers";

/* ✅ โหลดข้อมูลทั้งหมด */
function getAllCustomers() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

/* 💾 บันทึกข้อมูลทั้งหมดกลับเข้า localStorage */
function saveAllCustomers(customers) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
}

/* 🆕 เพิ่มลูกค้าใหม่ */
function addCustomer(customer) {
  const customers = getAllCustomers();
  customers.push(customer);
  saveAllCustomers(customers);
  return customer;
}

/* ➕ เพิ่มสัญญาใหม่ให้ลูกค้าเก่า */
function addLoanToCustomer(custId, loan) {
  const customers = getAllCustomers();
  const idx = customers.findIndex((c) => c.id === custId);
  if (idx === -1) return false;
  customers[idx].loans = customers[idx].loans || [];
  customers[idx].loans.push(loan);
  saveAllCustomers(customers);
  return true;
}

/* 🔍 ดึงข้อมูลลูกค้ารายเดียว */
function getCustomerById(id) {
  return getAllCustomers().find((c) => c.id === id);
}

/* ✏️ แก้ไขข้อมูลลูกค้า */
function updateCustomer(custId, newData) {
  const customers = getAllCustomers();
  const idx = customers.findIndex((c) => c.id === custId);
  if (idx === -1) return false;
  customers[idx] = { ...customers[idx], ...newData };
  saveAllCustomers(customers);
  return true;
}

/* ❌ ลบลูกค้าพร้อมข้อมูลสัญญาทั้งหมด */
function deleteCustomer(custId) {
  const customers = getAllCustomers().filter((c) => c.id !== custId);
  saveAllCustomers(customers);
}

/* 🧾 ลบเฉพาะสัญญาเงินกู้ */
function deleteLoan(custId, loanId) {
  const customers = getAllCustomers();
  const idx = customers.findIndex((c) => c.id === custId);
  if (idx === -1) return false;
  customers[idx].loans = customers[idx].loans.filter((l) => l.id !== loanId);
  saveAllCustomers(customers);
  return true;
}

/* 💰 ติ๊กงวดที่ชำระแล้ว */
function updatePayment(custId, loanId, termIndex, paid) {
  const customers = getAllCustomers();
  const custIdx = customers.findIndex((c) => c.id === custId);
  if (custIdx === -1) return false;

  const loanIdx = customers[custIdx].loans.findIndex((l) => l.id === loanId);
  if (loanIdx === -1) return false;

  const loan = customers[custIdx].loans[loanIdx];
  loan.paid = loan.paid || [];
  loan.paid[termIndex] = paid;

  customers[custIdx].loans[loanIdx] = loan;
  saveAllCustomers(customers);
  return true;
}

/* 🧮 ตัวช่วยสร้าง id */
function generateId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
}

/* 📦 ฟังก์ชันบันทึกลูกค้าพร้อมสัญญาใหม่ */
function saveNewLoan(customerInfo, loanData) {
  const customers = getAllCustomers();

  // หาในระบบว่ามีลูกค้าคนนี้ไหม (ตามชื่อ + เบอร์)
  let existing = customers.find(
    (c) =>
      c.name === customerInfo.name &&
      c.phone === customerInfo.phone
  );

  // ถ้าไม่มี → เพิ่มใหม่
  if (!existing) {
    const newCust = {
      id: generateId("cust"),
      name: customerInfo.name,
      phone: customerInfo.phone || "",
      address: customerInfo.address || "",
      createdAt: new Date().toISOString(),
      loans: [
        {
          ...loanData,
          id: generateId("loan"),
          createdAt: new Date().toISOString(),
          paid: [], // 👈 เพิ่มช่องสถานะชำระงวด
        },
      ],
    };
    addCustomer(newCust);
    return newCust;
  }

  // ถ้ามีอยู่แล้ว → เพิ่ม loan ใหม่ให้เขา
  const newLoan = {
    ...loanData,
    id: generateId("loan"),
    createdAt: new Date().toISOString(),
    paid: [], // 👈 เพิ่มช่องสถานะชำระงวด
  };
  addLoanToCustomer(existing.id, newLoan);
  return existing;
}
