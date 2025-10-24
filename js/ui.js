// js/ui.js
window.showDialog = function(title, message, onConfirm) {
  const dialog = document.getElementById("dialog");
  const titleEl = document.getElementById("dialog-title");
  const msgEl = document.getElementById("dialog-message");
  const btnConfirm = document.getElementById("dialog-confirm");
  const btnCancel = document.getElementById("dialog-cancel");

  titleEl.textContent = title;
  msgEl.textContent = message;

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
};
