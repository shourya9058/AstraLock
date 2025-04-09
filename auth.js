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

  // In auth.js
document.getElementById("set-password").addEventListener("click", () => {
  const newPassword = document.getElementById("new-password").value;
  const userEmail = document.getElementById("user-email").value;

  if (newPassword.length < 4) {
    document.getElementById("status").textContent = "Password must be at least 4 characters.";
    return;
  }

  if (!userEmail || !validateEmail(userEmail)) {
    document.getElementById("status").textContent = "Please enter a valid email address.";
    return;
  }

  chrome.storage.sync.set({ 
    pg_password: newPassword,
    pg_email: userEmail 
  }, () => {
    document.getElementById("status").textContent = "Password and email saved successfully!";
    setTimeout(() => {
      window.close();
    }, 1000);
  });
});

// Email validation function
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
  