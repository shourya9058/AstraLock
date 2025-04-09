// Check if current URL is in protected sites list
function checkAndProtectSite() {
  chrome.storage.sync.get(["protected_sites"], (result) => {
    const sites = result.protected_sites || ["https://web.whatsapp.com/"]
    const currentUrl = window.location.href

    // Check if current URL matches any protected site
    const shouldProtect = sites.some((site) => {
      // Convert both to URL objects for proper comparison
      try {
        const siteUrl = new URL(site)
        const currentUrlObj = new URL(currentUrl)

        // Compare hostname only (ignore pathname for broader protection)
        return (
          currentUrlObj.hostname === siteUrl.hostname ||
          currentUrlObj.hostname.endsWith(`.${siteUrl.hostname}`) ||
          siteUrl.hostname.endsWith(`.${currentUrlObj.hostname}`)
        )
      } catch (e) {
        return false
      }
    })

    // If current site should be protected, inject protection overlay
    if (shouldProtect) {
      injectProtectionOverlay()
    }
  })
}

// Run the check when the content script loads
checkAndProtectSite()

function injectProtectionOverlay() {
  // Check if password is already set
  chrome.storage.sync.get(["pg_email", "pg_password"], (result) => {
    if (!result.pg_email || !result.pg_password) {
      // No account set up, redirect to extension popup
      alert("Please set up your AstraLock account first by clicking on the extension icon.")
      return
    }

    // Check if overlay already exists
    if (document.getElementById("pg-blur-layer")) {
      return
    }

    // Inject custom CSS styles
    const style = document.createElement("style")
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
        padding: 2.5rem;
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
  
      #pg-password, #pg-verification-code {
        width: 100%;
        max-width: 320px;
        padding: 14px 16px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 16px;
        font-size: 1rem;
        transition: all 0.3s ease;
        background: rgba(255, 255, 255, 0.1);
        box-shadow: inset 0 2px 5px rgba(0,0,0,0.05);
        text-align: center;
        color: #ffffff;
        margin: 0 auto 20px auto;
        display: block;
        height: 48px;
        box-sizing: border-box;
      }
  
      #pg-password:focus, #pg-verification-code:focus {
        outline: none;
        border-color: white;
        box-shadow: 0 0 0 4px rgba(71, 118, 230, 0.2), inset 0 2px 5px rgba(0,0,0,0.05);
        background: rgba(255, 255, 255, 0.15);
      }
  
      #pg-password::placeholder, #pg-verification-code::placeholder {
        color: rgba(255, 255, 255, 0.5);
      }
  
      #pg-submit, #pg-verify-code {
        width: 100%;
        max-width: 320px;
        height: 48px;
        padding: 14px 16px;
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
  
      #pg-submit:hover, #pg-verify-code:hover {
        color: white;
        background-color: #1B56FD;
      }
  
      #pg-submit:active, #pg-verify-code:active {
        transform: translateY(-1px);
        box-shadow: 0 8px 15px rgba(71, 118, 230, 0.3);
      }
  
      #pg-error, #pg-verification-error {
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
  
      #pg-error.show, #pg-verification-error.show {
        opacity: 1;
        transform: translateY(0);
      }

      #pg-forgot-password {
        margin-top: 15px;
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.7);
        text-decoration: underline;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      #pg-forgot-password:hover {
        color: white;
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

      /* Reset Password Form */
      #pg-reset-form, #pg-verification-form {
        display: none;
      }

      #pg-reset-email {
        width: 100%;
        max-width: 320px;
        padding: 14px 16px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 16px;
        font-size: 1rem;
        transition: all 0.3s ease;
        background: rgba(255, 255, 255, 0.1);
        box-shadow: inset 0 2px 5px rgba(0,0,0,0.05);
        text-align: center;
        color: #ffffff;
        margin: 0 auto 20px auto;
        display: block;
        height: 48px;
        box-sizing: border-box;
      }

      #pg-reset-email:focus {
        outline: none;
        border-color: white;
        box-shadow: 0 0 0 4px rgba(71, 118, 230, 0.2), inset 0 2px 5px rgba(0,0,0,0.05);
        background: rgba(255, 255, 255, 0.15);
      }

      #pg-back-button {
        background: transparent;
        border: 1px solid white;
        color: white;
        margin-bottom: 15px;
      }

      #pg-back-button:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      
      .verification-info {
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.7);
        margin-bottom: 15px;
        max-width: 320px;
        text-align: center;
      }
    `
    document.head.appendChild(style)

    // Create background icons with more variety
    const securityIcons = ["💀", "🔒", "🛡️", "⚠️", "🔐", "🔑"]
    let bgIconsHTML = ""

    for (let i = 0; i < 20; i++) {
      const randomIcon = securityIcons[Math.floor(Math.random() * securityIcons.length)]
      const randomTop = Math.random() * 100
      const randomLeft = Math.random() * 100
      const randomDelay = Math.random() * 8
      const randomDuration = 6 + Math.random() * 8
      const randomSize = 50 + Math.random() * 40

      // Ensure each icon has a unique animation duration and delay for more natural movement
      bgIconsHTML += `<div class="bg-icon" style="top: ${randomTop}%; left: ${randomLeft}%; animation-delay: ${randomDelay}s; animation-duration: ${randomDuration}s; font-size: ${randomSize}px;">${randomIcon}</div>`
    }

    // Create blur layer with enhanced content
    const blurDiv = document.createElement("div")
    blurDiv.id = "pg-blur-layer"
    blurDiv.innerHTML = `
      <div class="background-icons">
        ${bgIconsHTML}
      </div>
      <div class="unlock-modal">
        <!-- Login Form -->
        <div id="pg-login-form">
          <h2>AstraLock</h2>
          <input type="password" id="pg-password" placeholder="Enter your password" autocomplete="current-password" />
          <button id="pg-submit">
            <span>Unlock</span>
            <span class="loading-spinner"></span>
          </button>
          <div id="pg-error"></div>
          <div id="pg-forgot-password">Forgot Password?</div>
        </div>

        <!-- Reset Password Form -->
        <div id="pg-reset-form">
          <h2>Reset Password</h2>
          <p class="verification-info">Enter your email to receive a verification code</p>
          <input type="email" id="pg-reset-email" placeholder="Enter your email" />
          <button id="pg-back-button">Back</button>
          <button id="pg-send-reset">
            <span>Send Verification Code</span>
            <span class="loading-spinner"></span>
          </button>
          <div id="pg-reset-error"></div>
        </div>
        
        <!-- Verification Code Form -->
        <div id="pg-verification-form">
          <h2>Verify Email</h2>
          <p class="verification-info">Enter the verification code sent to your email</p>
          <input type="text" id="pg-verification-code" placeholder="Enter verification code" />
          <button id="pg-back-to-reset" class="pg-back-button">Back</button>
          <button id="pg-verify-code">
            <span>Verify Code</span>
            <span class="loading-spinner"></span>
          </button>
          <div id="pg-verification-error"></div>
        </div>
      </div>
      <div class="branding">
        Created by <a href="https://www.linkedin.com/in/shaurya-singh007" target="_blank">@Shourya Singh</a>
      </div>
    `

    document.body.appendChild(blurDiv)

    // Get DOM elements
    const passwordInput = document.getElementById("pg-password")
    const submitBtn = document.getElementById("pg-submit")
    const errorMessage = document.getElementById("pg-error")
    const spinner = submitBtn.querySelector(".loading-spinner")
    const blurLayer = document.getElementById("pg-blur-layer")
    const forgotPasswordLink = document.getElementById("pg-forgot-password")
    const loginForm = document.getElementById("pg-login-form")
    const resetForm = document.getElementById("pg-reset-form")
    const verificationForm = document.getElementById("pg-verification-form")
    const resetEmailInput = document.getElementById("pg-reset-email")
    const sendResetBtn = document.getElementById("pg-send-reset")
    const backButton = document.getElementById("pg-back-button")
    const backToResetButton = document.getElementById("pg-back-to-reset")
    const resetErrorMessage = document.getElementById("pg-reset-error")
    const verificationCodeInput = document.getElementById("pg-verification-code")
    const verifyCodeBtn = document.getElementById("pg-verify-code")
    const verificationErrorMessage = document.getElementById("pg-verification-error")

    // Focus the password input
    setTimeout(() => {
      passwordInput.focus()
    }, 100)

    // Enter key submits the form
    passwordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        submitBtn.click()
      }
    })

    verificationCodeInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        verifyCodeBtn.click()
      }
    })

    // Ensure background icons are animated
    function animateBackgroundIcons() {
      const icons = document.querySelectorAll(".bg-icon")
      icons.forEach((icon) => {
        // Apply a small random movement to each icon to ensure animation is visible
        icon.style.animationPlayState = "running"
        icon.style.willChange = "transform"
      })
    }

    // Call the animation function after a short delay
    setTimeout(animateBackgroundIcons, 500)

    // Authentication logic
    submitBtn.addEventListener("click", () => {
      const enteredPassword = passwordInput.value

      // Hide any visible error messages
      errorMessage.classList.remove("show")

      if (!enteredPassword) {
        errorMessage.textContent = "Please enter a password"
        errorMessage.classList.add("show")
        document.querySelector(".unlock-modal").classList.add("shake")
        setTimeout(() => {
          document.querySelector(".unlock-modal").classList.remove("shake")
        }, 500)
        return
      }

      // Show loading state
      submitBtn.disabled = true
      spinner.style.display = "inline-block"
      submitBtn.querySelector("span").textContent = "Authenticating..."

      // Get password from storage
      chrome.storage.sync.get(["pg_password"], (result) => {
        const realPassword = result.pg_password

        // Simulate network delay for authentication
        setTimeout(() => {
          if (enteredPassword === realPassword) {
            // Success path
            document.querySelector(".unlock-modal").style.boxShadow = "0 0 40px rgba(0, 176, 155, 0.5)"

            // Smooth fade out transition instead of abrupt removal
            blurLayer.classList.add("fade-out")

            // Only remove from DOM after transition completes
            setTimeout(() => {
              blurLayer.remove()
            }, 800) // Match this to the transition duration
          } else {
            // Failure path
            errorMessage.textContent = "Incorrect password. Please try again."
            errorMessage.classList.add("show")
            document.querySelector(".unlock-modal").classList.add("shake")

            setTimeout(() => {
              document.querySelector(".unlock-modal").classList.remove("shake")
            }, 500)

            passwordInput.value = ""
            passwordInput.focus()

            // Reset button state
            submitBtn.disabled = false
            spinner.style.display = "none"
            submitBtn.querySelector("span").textContent = "Unlock"
          }
        }, 1000)
      })
    })

    // Forgot password link
    forgotPasswordLink.addEventListener("click", () => {
      loginForm.style.display = "none"
      resetForm.style.display = "block"

      // Pre-fill email if available
      chrome.storage.sync.get(["pg_email"], (result) => {
        if (result.pg_email) {
          resetEmailInput.value = result.pg_email
        }
      })
    })

    // Back button
    backButton.addEventListener("click", () => {
      resetForm.style.display = "none"
      loginForm.style.display = "block"
    })

    // Back to reset button
    backToResetButton.addEventListener("click", () => {
      verificationForm.style.display = "none"
      resetForm.style.display = "block"
    })

    // Send reset link with verification code
    sendResetBtn.addEventListener("click", () => {
      const email = resetEmailInput.value

      // Basic validation
      if (!email || !validateEmail(email)) {
        resetErrorMessage.textContent = "Please enter a valid email address"
        resetErrorMessage.classList.add("show")
        return
      }

      // Check if email exists
      chrome.storage.sync.get(["pg_email"], (result) => {
        if (result.pg_email !== email) {
          resetErrorMessage.textContent = "Email not found. Please enter the email you used to register."
          resetErrorMessage.classList.add("show")
          return
        }

        // Show loading state
        sendResetBtn.disabled = true
        sendResetBtn.querySelector(".loading-spinner").style.display = "inline-block"
        sendResetBtn.querySelector("span").textContent = "Sending..."

        // Generate verification code (6 digits)
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
        const expiryTime = Date.now() + 15 * 60 * 1000 // 15 minutes

        // Store verification code
        chrome.storage.sync.set(
          {
            pg_verification_code: verificationCode,
            pg_verification_expiry: expiryTime,
            pg_verification_email: email,
          },
          () => {
            // In a real extension, you would send an email here
            // For this demo, we'll just show the code (in a real app, this would be sent via email)
            resetErrorMessage.textContent = `Verification code sent to your email! (For demo: ${verificationCode})`
            resetErrorMessage.style.color = "#10b981"
            resetErrorMessage.classList.add("show")

            // Reset button state
            setTimeout(() => {
              sendResetBtn.disabled = false
              sendResetBtn.querySelector(".loading-spinner").style.display = "none"
              sendResetBtn.querySelector("span").textContent = "Send Verification Code"

              // Go to verification form
              resetForm.style.display = "none"
              verificationForm.style.display = "block"
            }, 3000)
          },
        )
      })
    })

    // Verify code
    verifyCodeBtn.addEventListener("click", () => {
      const enteredCode = verificationCodeInput.value

      // Basic validation
      if (!enteredCode || enteredCode.length !== 6) {
        verificationErrorMessage.textContent = "Please enter a valid 6-digit verification code"
        verificationErrorMessage.classList.add("show")
        return
      }

      // Show loading state
      verifyCodeBtn.disabled = true
      verifyCodeBtn.querySelector(".loading-spinner").style.display = "inline-block"
      verifyCodeBtn.querySelector("span").textContent = "Verifying..."

      // Check verification code
      chrome.storage.sync.get(["pg_verification_code", "pg_verification_expiry"], (result) => {
        const storedCode = result.pg_verification_code
        const expiryTime = result.pg_verification_expiry

        setTimeout(() => {
          // Check if code is valid and not expired
          if (!storedCode || !expiryTime || Date.now() > expiryTime) {
            verificationErrorMessage.textContent = "Verification code has expired. Please request a new one."
            verificationErrorMessage.classList.add("show")

            // Reset button state
            verifyCodeBtn.disabled = false
            verifyCodeBtn.querySelector(".loading-spinner").style.display = "none"
            verifyCodeBtn.querySelector("span").textContent = "Verify Code"
            return
          }

          if (enteredCode !== storedCode) {
            verificationErrorMessage.textContent = "Invalid verification code. Please try again."
            verificationErrorMessage.classList.add("show")

            // Reset button state
            verifyCodeBtn.disabled = false
            verifyCodeBtn.querySelector(".loading-spinner").style.display = "none"
            verifyCodeBtn.querySelector("span").textContent = "Verify Code"
            return
          }

          // Code is valid - open extension popup for password reset
          verificationErrorMessage.textContent = "Verification successful! Opening password reset..."
          verificationErrorMessage.style.color = "#10b981"
          verificationErrorMessage.classList.add("show")

          // Set verification status
          chrome.storage.sync.set({ pg_verified: true }, () => {
            // Open extension popup for password reset
            setTimeout(() => {
              chrome.runtime.sendMessage({ action: "openPopup", view: "reset_password" })

              // Remove the overlay
              blurLayer.classList.add("fade-out")
              setTimeout(() => {
                blurLayer.remove()
              }, 800)
            }, 2000)
          })
        }, 1500)
      })
    })

    // Helper function to validate email
    function validateEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return re.test(email)
    }
  })
}
