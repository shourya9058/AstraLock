// Check if password already set
chrome.storage.sync.get("pg_password", (result) => {
    if (result.pg_password) {
      // Password already set
      document.getElementById("password-not-set").style.display = "none";
      document.getElementById("password-already-set").style.display = "block";
    } else {
      // Allow to set new password
      document.getElementById("set-password").addEventListener("click", () => {
        const newPassword = document.getElementById("new-password").value;
  
        if (newPassword.length < 4) {
          document.getElementById("status").textContent = "Password must be at least 4 characters.";
          return;
        }
  
        chrome.storage.sync.set({ pg_password: newPassword }, () => {
          document.getElementById("status").textContent = "Password saved successfully!";
          setTimeout(() => {
            window.close();
          }, 1000);
        });
      });
    }
  });
  