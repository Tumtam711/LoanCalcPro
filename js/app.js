/* app.js — bootstrap */

document.addEventListener("DOMContentLoaded", ()=>{
  renderCustomers(getAllCustomers());

  document.getElementById("btnAddCustomer").onclick = window.openAddCustomerDialog;
  document.getElementById("btnSummary").onclick = window.openSummaryDialog;
  

  const search = document.getElementById("searchInput");
  if(search){
    search.addEventListener("input", e=>{
      const q = e.target.value.trim().toLowerCase();
      const filtered = getAllCustomers().filter(c =>
        (c.name||"").toLowerCase().includes(q) ||
        (c.phone||"").toLowerCase().includes(q)
      );
      renderCustomers(filtered);
    });
  }

  showToast("✅ ระบบพร้อมใช้งาน", "success");
});
