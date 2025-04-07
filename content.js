// Check if password is already set
document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.sync.get(['pg_password'], function(result) {
      if (result.pg_password) {
        document.getElementById('password-not-set').style.display = 'none';
        document.getElementById('password-already-set').style.display = 'block';
      }
    });
  
    // Set password functionality
    document.getElementById('set-password').addEventListener('click', function() {
      const newPassword = document.getElementById('new-password').value;
      const statusElement = document.getElementById('status');
      
      if (!newPassword) {
        statusElement.textContent = 'Please enter a password';
        statusElement.className = 'status error show';
        setTimeout(() => {
          statusElement.className = 'status error';
        }, 3000);
        return;
      }
      
      chrome.storage.sync.set({pg_password: newPassword}, function() {
        statusElement.textContent = 'Password saved successfully!';
        statusElement.className = 'status success show';
        
        setTimeout(() => {
          document.getElementById('password-not-set').style.display = 'none';
          document.getElementById('password-already-set').style.display = 'block';
        }, 2000);
      });
    });
  });
  
  // Password protection overlay
  setTimeout(() => {
    // Inject custom CSS styles
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
      }
  
      @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-20px); }
      }
  
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-8px); }
        75% { transform: translateX(8px); }
      }
  
      @keyframes pulse {
        0% { transform: scale(1); box-shadow: 0 15px 35px rgba(0,0,0,0.2); }
        50% { transform: scale(1.03); box-shadow: 0 20px 45px rgba(0,0,0,0.3); }
        100% { transform: scale(1); box-shadow: 0 15px 35px rgba(0,0,0,0.2); }
      }
  
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
  
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }
  
      @keyframes floatIcons {
        0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 0.2; }
        50% { transform: translateY(-20px) rotate(5deg) scale(1.1); opacity: 0.3; }
        100% { transform: translateY(0) rotate(0deg) scale(1); opacity: 0.2; }
      }
  
      @keyframes gradientBG {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
  
      #pg-blur-layer {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(10, 15, 30, 0.85);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        z-index: 999999;
        display: flex;
        justify-content: center;
        align-items: center;
        animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
        transition: opacity 0.8s ease, transform 0.8s ease;
        font-family: 'Inter', sans-serif;
      }
  
      #pg-blur-layer.fade-out {
        opacity: 0;
        transform: translateY(-20px);
        pointer-events: none;
      }
  
      .background-icons {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
        overflow: hidden;
        pointer-events: none;
      }
  
      .bg-icon {
        position: absolute;
        font-size: 70px;
        color: rgba(255, 255, 255, 0.2);
        animation: floatIcons 8s infinite;
        opacity: 0.2;
        filter: drop-shadow(0 5px 15px rgba(0,0,0,0.1));
        will-change: transform;
      }
  
      .unlock-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: black;
  padding: 2.5rem;  /* Slightly reduced padding */
  border-radius: 24px;
  box-shadow: 0 15px 50px rgba(0,0,0,0.3);
  text-align: center;
  max-width: 400px;
  width: 90%;
  animation: pulse 2s ease infinite;
  position: relative;
  z-index: 2;
  border: 1px solid rgba(255,255,255,0.1);
  color: #ffffff;
}

  
      .unlock-modal h2 {
        margin: 0 0 1.8rem 0;
        font-size: 2rem;
        font-weight: 800;
        background: black;
        background-size: 200% 200%;
        animation: gradientBG 5s ease infinite;
        -webkit-background-clip: text;
        background-clip: text;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        letter-spacing: -0.5px;
      }
  
      #pg-password {
  width: 100%;
  max-width: 320px;  /* Control maximum width */
  padding: 14px 16px;  /* Slightly reduced padding for better proportion */
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 2px 5px rgba(0,0,0,0.05);
  text-align: center;
  color: #ffffff;
  margin: 0 auto 20px auto;  /* Center the input and maintain bottom margin */
  display: block;  /* Ensure proper block display */
  height: 48px;  /* Set explicit height for consistency */
  box-sizing: border-box;  /* Include padding in width/height calculation */
}
  
      #pg-password:focus {
        outline: none;
        border-color: white;
        box-shadow: 0 0 0 4px rgba(71, 118, 230, 0.2), inset 0 2px 5px rgba(0,0,0,0.05);
        background: rgba(255, 255, 255, 0.15);
      }
  
      #pg-password::placeholder {
        color: rgba(255, 255, 255, 0.5);
      }
  
      #pg-submit {

      width: 100%;
  max-width: 320px;  /* Match input max-width */
  height: 48px;  /* Set explicit height for consistency */
  padding: 14px 16px;  /* Match input padding */
  /* other properties remain the same */
        background: white;
        background-size: 200% 200%;
        animation: gradientBG 5s ease infinite;
        color: black;
        border: none;
        border-radius: 16px;
        font-weight: 700;
        font-size: 1.1rem;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.8rem;
        box-shadow: 0 10px 25px rgba(71, 118, 230, 0.3);
        position: relative;
        overflow: hidden;
        transition: width 0.4s ease-in-out;
      }
  
      #pg-submit:hover {
  color: white;
  background-color: #1B56FD;
}
  
      #pg-submit:active {
        transform: translateY(-1px);
        box-shadow: 0 8px 15px rgba(71, 118, 230, 0.3);
      }
  
      #pg-submit::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 5px;
        height: 5px;
        background: rgba(255, 255, 255, 0.5);
        opacity: 0;
        border-radius: 100%;
        transform: scale(1, 1) translate(-50%);
        transform-origin: 50% 50%;
      }
  
      #pg-submit:focus:not(:active)::after {
        animation: ripple 1s ease-out;
      }
  
      @keyframes ripple {
        0% {
          transform: scale(0, 0);
          opacity: 0.5;
        }
        100% {
          transform: scale(100, 100);
          opacity: 0;
        }
      }
  
      #pg-error {
        margin-top: 15px;
        font-size: 0.95rem;
        padding: 12px;
        border-radius: 12px;
        background-color: rgba(248, 113, 113, 0.2);
        color: #f87171;
        border: 1px solid rgba(248, 113, 113, 0.3);
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.3s ease;
      }
  
      #pg-error.show {
        opacity: 1;
        transform: translateY(0);
      }
  
      .lock-icon {
        font-size: 2.2rem;
        animation: bounce 2s ease infinite;
        display: inline-block;
        margin-right: 10px;
        filter: drop-shadow(0 2px 5px rgba(0,0,0,0.2));
      }
  
      .loading-spinner {
        width: 22px;
        height: 22px;
        border: 3px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 0.8s ease-in-out infinite;
        display: none;
      }
  
      .branding {
        position: absolute;
        bottom: 20px;
        left: 0;
        width: 100%;
        text-align: center;
        font-size: 0.85rem;
        color: rgba(255,255,255,0.5);
      }
  
      .branding a {
        color: rgba(255,255,255,0.7);
        text-decoration: none;
        transition: all 0.3s ease;
      }
  
      .branding a:hover {
        color: #fff;
        text-decoration: underline;
      }
    `;
    document.head.appendChild(style);
  
    // Create background icons with more variety
    const securityIcons = ['💀 ', '💀 ', '💀 ', '💀 ', '💀 ', '💀', '💀 ', '💀 ', '💀 '];
    let bgIconsHTML = '';
    
    for (let i = 0; i < 20; i++) {
      const randomIcon = securityIcons[Math.floor(Math.random() * securityIcons.length)];
      const randomTop = Math.random() * 100;
      const randomLeft = Math.random() * 100;
      const randomDelay = Math.random() * 8;
      const randomDuration = 6 + Math.random() * 8;
      const randomSize = 50 + Math.random() * 40;
      
      // Ensure each icon has a unique animation duration and delay for more natural movement
      bgIconsHTML += `<div class="bg-icon" style="top: ${randomTop}%; left: ${randomLeft}%; animation-delay: ${randomDelay}s; animation-duration: ${randomDuration}s; font-size: ${randomSize}px;">${randomIcon}</div>`;
    }
  
    // Create blur layer with enhanced content
    const blurDiv = document.createElement("div");
    blurDiv.id = "pg-blur-layer";
    blurDiv.innerHTML = `
      <div class="background-icons">
        ${bgIconsHTML}
      </div>
      <div class="unlock-modal">
        <h2>AstraLock</h2>
        <input type="password" id="pg-password" placeholder="Enter your password" autocomplete="current-password" />
        <button id="pg-submit">
          <span>Unlock</span>
          <span class="loading-spinner"></span>
        </button>
        <div id="pg-error"></div>
      </div>
      <div class="branding">
        Created by <a href="https://www.linkedin.com/in/shaurya-singh007" target="_blank">@Shourya Singh</a>
      </div>
    `;
  
    document.body.appendChild(blurDiv);
  
    // Get DOM elements
    const passwordInput = document.getElementById("pg-password");
    const submitBtn = document.getElementById("pg-submit");
    const errorMessage = document.getElementById("pg-error");
    const spinner = submitBtn.querySelector(".loading-spinner");
    const blurLayer = document.getElementById("pg-blur-layer");
  
    // Focus the password input
    setTimeout(() => passwordInput.focus(), 100);
  
    // Enter key submits the form
    passwordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        submitBtn.click();
      }
    });
  
    // Ensure background icons are animated
    function animateBackgroundIcons() {
      const icons = document.querySelectorAll('.bg-icon');
      icons.forEach(icon => {
        // Apply a small random movement to each icon to ensure animation is visible
        icon.style.animationPlayState = 'running';
        icon.style.willChange = 'transform';
      });
    }
    
    // Call the animation function after a short delay
    setTimeout(animateBackgroundIcons, 500);
  
    // Authentication logic
    submitBtn.addEventListener("click", () => {
      const enteredPassword = passwordInput.value;
      
      // Hide any visible error messages
      errorMessage.classList.remove("show");
      
      if (!enteredPassword) {
        errorMessage.textContent = "Please enter a password";
        errorMessage.classList.add("show");
        document.querySelector(".unlock-modal").classList.add("shake");
        setTimeout(() => {
          document.querySelector(".unlock-modal").classList.remove("shake");
        }, 500);
        return;
      }
      
      // Show loading state
      submitBtn.disabled = true;
      spinner.style.display = "inline-block";
      submitBtn.querySelector("span").textContent = "Authenticating...";
  
      // Simulate getting password from storage
      chrome.storage.sync.get(["pg_password"], (result) => {
        const realPassword = result.pg_password || "1234";
        
        // Simulate network delay for authentication
        setTimeout(() => {
          if (enteredPassword === realPassword) {
            // Success path
            document.querySelector(".unlock-modal").style.boxShadow = "0 0 40px rgba(0, 176, 155, 0.5)";
            
            // Smooth fade out transition instead of abrupt removal
            blurLayer.classList.add('fade-out');
            
            // Only remove from DOM after transition completes
            setTimeout(() => {
              blurLayer.remove();
            }, 800); // Match this to the transition duration
          } else {
            // Failure path
            errorMessage.textContent = "Incorrect password. Please try again.";
            errorMessage.classList.add("show");
            document.querySelector(".unlock-modal").classList.add("shake");
            
            setTimeout(() => {
              document.querySelector(".unlock-modal").classList.remove("shake");
            }, 500);
            
            passwordInput.value = "";
            passwordInput.focus();
            
            // Reset button state
            submitBtn.disabled = false;
            spinner.style.display = "none";
            submitBtn.querySelector("span").textContent = "Unlock";
          }
        }, 1000);
      });
    });
  
  }, 1000);