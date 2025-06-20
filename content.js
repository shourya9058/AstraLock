// Synchronous SHA-256 implementation (from https://geraintluff.github.io/sha256/)
function sha256(ascii) {
    function rightRotate(v, c) { return (v>>>c)|(v<<(32-c)); }
    var mathPow=Math.pow,maxMath=Math.max;
    var result = "", i, j, k, l, W = new Array(64), H = [1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225], K = [1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298];
    ascii += '\x80';
    while (ascii.length%64-56) ascii += '\x00';
    for (i=0; i<ascii.length; i++) {
        j = ascii.charCodeAt(i);
        if (j>>8) return;
        result += String.fromCharCode(j);
    }
    var l = ascii.length-1;
    var words = [];
    for (i=0; i<ascii.length; i++) words[i>>2] |= ascii.charCodeAt(i) << (24-(i%4)*8);
    words[words.length] = ((l*8)>>29)&0xFF;
    words[words.length] = ((l*8)>>21)&0xFF;
    words[words.length] = ((l*8)>>13)&0xFF;
    words[words.length] = ((l*8)>>5)&0xFF;
    words[words.length] = ((l*8)<<3)&0xFF;
    for (j=0; j<words.length; j+=16) {
        var oldH = H.slice(0);
        for (i=0; i<64; i++) {
            if (i<16) W[i] = words[j+i]|0;
            else {
                var gamma0 = rightRotate(W[i-15],7)^rightRotate(W[i-15],18)^(W[i-15]>>>3);
                var gamma1 = rightRotate(W[i-2],17)^rightRotate(W[i-2],19)^(W[i-2]>>>10);
                W[i] = (W[i-16] + gamma0 + W[i-7] + gamma1)|0;
            }
            var ch = (H[4]&H[5])^((~H[4])&H[6]);
            var maj = (H[0]&H[1])^(H[0]&H[2])^(H[1]&H[2]);
            var sigma0 = rightRotate(H[0],2)^rightRotate(H[0],13)^rightRotate(H[0],22);
            var sigma1 = rightRotate(H[4],6)^rightRotate(H[4],11)^rightRotate(H[4],25);
            var t1 = (H[7] + sigma1 + ch + K[i] + W[i])|0;
            var t2 = (sigma0 + maj)|0;
            H = [(t1+t2)|0,H[0],H[1],H[2],(H[3]+t1)|0,H[4],H[5],H[6]];
        }
        for (i=0; i<8; i++) H[i] = (H[i]+oldH[i])|0;
    }
    for (i=0; i<8; i++) for (j=3; j+1; j--) {
        var b = (H[i]>>(j*8))&255;
        result += ((b>>4).toString(16)) + ((b&15).toString(16));
    }
    return result.slice(-64);
}

// Dynamically load sha256.min.js for password hashing
(function loadSHA256() {
  if (typeof window.sha256 === 'undefined') {
    var script = document.createElement('script');
    script.src = chrome.runtime.getURL('sha256.min.js');
    document.head.appendChild(script);
  }
})();

// Check if current URL is in protected sites list
function checkAndProtectSite() {
  // Use a single sessionStorage flag for the tab and a global window flag
  const tabAuth = sessionStorage.getItem('astralock_authenticated');
  const globalAuth = window.astralock_authenticated;
  const navigationEntry = performance.getEntriesByType("navigation")[0];
  const isPageRefresh = navigationEntry?.type === "reload";

  // If already authenticated for this tab (sessionStorage or global), skip protection
  if ((tabAuth === "true" || globalAuth === true) && !isPageRefresh) {
    return;
  }

  // Clear auth on page refresh
  if (isPageRefresh) {
    sessionStorage.removeItem('astralock_authenticated');
    window.astralock_authenticated = false;
  }

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
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');

      /* Ensure consistent box sizing */
      *, *::before, *::after {
        box-sizing: border-box;
}

#pg-blur-layer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  min-width: 100vw;
  min-height: 100vh;
        background: rgba(235, 235, 235, 0.15);
        backdrop-filter: blur(15px) saturate(110%);
        -webkit-backdrop-filter: blur(15px) saturate(110%);
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        z-index: 2147483647;
  display: flex;
  justify-content: center;
  align-items: center;
        font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
  overflow: hidden;
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        will-change: opacity, backdrop-filter, transform;
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
        pointer-events: none;
      }

      #pg-blur-layer.visible {
        opacity: 1;
        pointer-events: all;
      }

      /* Ensure the blur layer stays on top and covers everything */
      html.has-blur-overlay,
      body.has-blur-overlay {
        overflow: hidden !important;
        position: fixed !important;
        height: 100% !important;
        width: 100% !important;
        max-height: 100vh !important;
        max-width: 100vw !important;
        margin: 0 !important;
        padding: 0 !important;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
      }

.unlock-modal {
        background: rgba(187, 214, 243, 0.75);
  border-radius: 24px;
        padding: 32px;
        width: 90%;
        max-width: 380px;
  text-align: center;
        transform: translateY(20px) scale(0.95);
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        transition-delay: 0.1s;
        box-shadow: 
          0 4px 24px -1px rgba(0, 0, 0, 0.12),
          0 0 1px 0 rgba(0, 0, 0, 0.05),
          0 0 40px rgba(0, 85, 255, 0.06);
  position: relative;
        backdrop-filter: blur(10px) saturate(180%);
        -webkit-backdrop-filter: blur(10px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.3);
        will-change: transform, opacity;
      }

      #pg-blur-layer.visible .unlock-modal {
        transform: translateY(0) scale(1);
        opacity: 1;
      }

      .modal-title {
  display: flex;
  align-items: center;
  justify-content: center;
        gap: 12px;
        margin-bottom: 24px;
        color: #1A1A1A;
        font-size: 28px;
        font-weight: 600;
        letter-spacing: -0.5px;
        background: linear-gradient(135deg, #1a365d, #0055FF);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-family: 'Poppins', sans-serif;
      }

      .modal-logo {
        width: 32px;
        height: 32px;
        object-fit: contain;
        filter: drop-shadow(0 2px 4px rgba(0, 85, 255, 0.1));
      }

      .modal-subtitle {
        color: #222;
        font-size: 16px;
        font-weight: 400;
        margin-bottom: 28px;
        opacity: 0.85;
        line-height: 1.6;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .modal-subtitle .highlight {
        color: #0055FF;
        font-weight: 500;
        position: relative;
        display: inline-block;
        margin-bottom: 4px;
      }

      .modal-subtitle .highlight::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        width: 100%;
        height: 2px;
        background: linear-gradient(to right, #0055FF, transparent);
        opacity: 0.3;
      }

      .password-field-wrapper {
        position: relative;
        width: 100%;
        margin-bottom: 20px;
}

      #pg-password,
      #pg-reset-otp,
      #pg-reset-newpass {
  width: 100%;
        height: 52px;
        padding: 0 44px 0 20px;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.5);
        border-radius: 14px;
        font-size: 16px;
        color: #000;
        transition: all 0.2s ease;
        box-shadow: 
          0 2px 6px rgba(0, 0, 0, 0.05),
          0 0 0 4px rgba(0, 85, 255, 0);
        font-family: inherit;
}

      #pg-password:focus,
      #pg-reset-otp:focus,
      #pg-reset-newpass:focus {
  outline: none;
        background: #fff;
        box-shadow: 
          0 4px 12px rgba(0, 0, 0, 0.1),
          0 0 0 4px rgba(0, 85, 255, 0.1);
        border-color: rgba(0, 85, 255, 0.2);
}

      #pg-password::placeholder,
      #pg-reset-otp::placeholder,
      #pg-reset-newpass::placeholder {
        color: rgba(0, 0, 0, 0.4);
}

      #pg-error,
      #pg-reset-error {
        color: #ef4444;
        font-size: 14px;
        margin-top: 12px;
        opacity: 0;
        transition: opacity 0.2s ease;
      }

      #pg-error.show,
      #pg-reset-error.show {
        opacity: 1;
      }

      .forgot-password-btn {
        background: none;
        border: none;
        color: #0055FF;
        font-size: 14px;
        padding: 8px 16px;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-top: 12px;
        opacity: 0.8;
      }

      .forgot-password-btn:hover {
        opacity: 1;
        text-decoration: underline;
      }

      #pg-submit,
      #pg-reset-confirm {
        width: 100%;
        height: 52px;
        background: linear-gradient(135deg, #0055FF, #0044CC);
        border: none;
        border-radius: 14px;
        color: #fff;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
        box-shadow: 
          0 4px 12px rgba(0, 85, 255, 0.2),
          0 0 0 4px rgba(0, 85, 255, 0);
        font-family: inherit;
      }

      #pg-submit:hover,
      #pg-reset-confirm:hover {
        transform: translateY(-1px);
        box-shadow: 
          0 6px 16px rgba(0, 85, 255, 0.25),
          0 0 0 4px rgba(0, 85, 255, 0.1);
      }

      #pg-submit:active,
      #pg-reset-confirm:active {
        transform: translateY(0);
        box-shadow: 
          0 2px 8px rgba(0, 85, 255, 0.15),
          0 0 0 4px rgba(0, 85, 255, 0.1);
      }

      #pg-submit.loading,
      #pg-reset-confirm.loading {
        background: #93c5fd;
        cursor: not-allowed;
        transform: none;
      }

      #pg-submit.loading span,
      #pg-reset-confirm.loading span {
        opacity: 0;
      }

      #pg-submit.loading .loading-spinner,
      #pg-reset-confirm.loading .loading-spinner {
        opacity: 1;
      }

      .loading-spinner {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid #fff;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        opacity: 0;
        transition: opacity 0.15s;
        z-index: 2;
        pointer-events: none;
      }

      @keyframes spin {
        to {
          transform: translate(-50%, -50%) rotate(360deg);
        }
      }
    `
    
    document.head.appendChild(style);
    // ----- Add watermark styles (same as popup.html) -----
    const watermarkStyle = document.createElement("style");
    watermarkStyle.textContent = `
      /* Watermark */
      .watermark {
        position: fixed;
        left: 50%;
        bottom: 30px;
        transform: translate(-50%, 0);
        display: inline-flex;
        justify-content: center;
        align-items: center;
        white-space: nowrap;
        font-size: 13px;
        font-weight: 500;
        color: #4285f4;
        background: rgba(239, 246, 255, 0.95);
        padding: 4px 16px 4px 12px;
        border-radius: 100px;
        box-shadow: 0 4px 20px rgba(66, 133, 244, 0.25), 0 0 15px rgba(66, 133, 244, 0.15);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        gap: 12px;
        border: 1px solid rgba(66, 133, 244, 0.2);
        transition: all 0.3s ease;
        text-decoration: none;
        height: 42px;
        box-sizing: border-box;
        animation: float 4s ease-in-out infinite;
      }
      
      @keyframes float {
        0%, 100% {
          transform: translate(-50%, 0) scale(1);
          box-shadow: 0 4px 20px rgba(66, 133, 244, 0.25), 0 0 15px rgba(66, 133, 244, 0.15);
        }
        50% {
          transform: translate(-50%, -5px) scale(1.01);
          box-shadow: 0 8px 25px rgba(66, 133, 244, 0.3), 0 0 20px rgba(66, 133, 244, 0.2);
        }
      }

      .watermark:hover {
        transform: translateY(-1px) scale(1.03);
        box-shadow: 0 4px 12px rgba(66, 133, 244, 0.2);
        background: rgba(239, 246, 255, 1);
        text-decoration: none;
      }

      .watermark img {
        width: 42px;
        height: 36px;
        object-fit: contain;
        margin: -2px 0;
        transition: all 0.3s ease;
      }

      .watermark:hover img {
        transform: scale(1.05);
      }
      /* Position at bottom center of blur layer */
      #pg-blur-layer .watermark {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
      }
      [data-theme="dark"] .watermark {
        background: rgba(30, 58, 138, 0.3);
        border-color: rgba(66, 133, 244, 0.3);
        color: #4285f4;
      }
      [data-theme="dark"] .watermark:hover {
        background: rgba(30, 58, 138, 0.4);
      }
    `;
    document.head.appendChild(watermarkStyle)

    // Create blur layer with enhanced content
    const blurDiv = document.createElement("div")
    blurDiv.id = "pg-blur-layer"
    blurDiv.innerHTML = `
      <div class="unlock-modal" id="pg-main-modal">
        <div class="modal-title">
          AstraLock
          <img src="${chrome.runtime.getURL('security.png')}" alt="Security Logo" class="modal-logo" />
        </div>
        <div class="modal-subtitle">
          <div><span class="highlight">This page is protected</span></div>
          <div style="white-space: nowrap;">Please enter your access code to continue</div>
        </div>
        <div class="password-field-wrapper">
          <input 
            type="password" 
            id="pg-password" 
            placeholder="Password" 
            autocomplete="current-password" 
            spellcheck="false"
          />
        </div>
        <button id="pg-submit">
          <span>Unlock</span>
          <div class="loading-spinner"></div>
        </button>
        <button class="forgot-password-btn" id="pg-forgot-password">Forgot password?</button>
        <div id="pg-error"></div>
      </div>
      <div class="unlock-modal" id="pg-reset-modal" style="display:none;">
        <div class="modal-title">Reset Password</div>
        <div class="modal-subtitle" id="pg-reset-info">An OTP has been sent to your email.</div>
        <div class="password-field-wrapper">
          <input type="text" id="pg-reset-otp" placeholder="Enter OTP" maxlength="6" autocomplete="one-time-code" />
        </div>
        <div class="password-field-wrapper">
          <input type="password" id="pg-reset-newpass" placeholder="New password" autocomplete="new-password" />
      </div>
        <button id="pg-reset-confirm">
          <span>Reset Password</span>
          <div class="loading-spinner"></div>
        </button>
        <button class="forgot-password-btn" id="pg-reset-back" style="margin-top:18px;">Back to Login</button>
        <div id="pg-reset-error"></div>
      </div>
      <a href="https://www.instagram.com/_shauryasingh__/" target="_blank" class="watermark">
        <img src="${chrome.runtime.getURL('logo.png')}" alt="Spiderman Logo" />
        Created by Shaurya Singh
      </a>
    `

    document.body.classList.add('has-blur-overlay');
    document.body.appendChild(blurDiv);
    
    // Force a reflow before adding the visible class
    blurDiv.offsetHeight;
    
    // Add visible class to trigger the transition
    requestAnimationFrame(() => {
      blurDiv.classList.add('visible');
    });

    // Get DOM elements after appending blurDiv
    const passwordInput = blurDiv.querySelector("#pg-password");
    const submitBtn = blurDiv.querySelector("#pg-submit");
    const errorMessage = blurDiv.querySelector("#pg-error");
    const togglePassword = blurDiv.querySelector('#pg-toggle-password');

      // Authentication logic
      submitBtn.addEventListener("click", () => {
        const enteredPassword = passwordInput.value;
        errorMessage.classList.remove("show");
        errorMessage.textContent = "";

        if (!enteredPassword) {
          errorMessage.textContent = "Please enter your password";
          errorMessage.classList.add("show");
          return;
        }

        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        // Wait for sha256 function to be available
        const checkSHA256 = () => {
          // Use the built-in sha256 function we defined at the top of the file
          const enteredPasswordHash = sha256(enteredPassword);
          
          chrome.storage.sync.get(["pg_password", "pg_email"], (result) => {
            const realPasswordHash = result.pg_password;
            const userEmail = result.pg_email;

            // If no email or password exists, start fresh flow
            if (!userEmail || !realPasswordHash) {
              errorMessage.textContent = "Please set up your account first";
              errorMessage.classList.add("show");
              submitBtn.classList.remove('loading');
              submitBtn.disabled = false;
              return;
            }

          setTimeout(() => {
            if (enteredPasswordHash === realPasswordHash) {
              // Set session flag so overlay doesn't reappear for this tab
              sessionStorage.setItem('astralock_authenticated', 'true');
              window.astralock_authenticated = true;
              removeBlurLayer();
            } else {
                errorMessage.textContent = "Incorrect password";
              errorMessage.classList.add("show");
              passwordInput.value = "";
              passwordInput.focus();
                submitBtn.classList.remove('loading');
              submitBtn.disabled = false;
            }
          }, 1000);
        });
        };

        // Since we have the sha256 function defined at the top of the file,
        // we can call it immediately
        checkSHA256();
      });

    // Forgot password modal logic
    const forgotBtn = blurDiv.querySelector('#pg-forgot-password');
    const mainModal = blurDiv.querySelector('#pg-main-modal');
    const resetModal = blurDiv.querySelector('#pg-reset-modal');
    const resetBackBtn = blurDiv.querySelector('#pg-reset-back');
    const resetConfirmBtn = blurDiv.querySelector('#pg-reset-confirm');
    const resetError = blurDiv.querySelector('#pg-reset-error');
    const resetInfo = blurDiv.querySelector('#pg-reset-info');
    let generatedOtp = null;
    let userEmail = '';

    forgotBtn.addEventListener('click', () => {
      // Get the logged-in user's email
      chrome.storage.sync.get(["pg_email"], (result) => {
        userEmail = result.pg_email;
        if (!userEmail) {
          resetError.textContent = 'Please set up your account first';
          return;
        }
        mainModal.style.display = 'none';
        resetModal.style.display = 'block';
        resetError.textContent = '';
        resetInfo.textContent = 'Sending OTP...';
        
        // Generate OTP
        generatedOtp = (Math.floor(100000 + Math.random() * 900000)).toString();
        
        // Request background script to send the OTP email
        chrome.runtime.sendMessage({
          action: 'send_otp_email',
          toEmail: userEmail,
          otp: generatedOtp
        }, (response) => {
          if (response && response.success) {
            resetInfo.textContent = `An OTP has been sent to your email (${userEmail.replace(/(.{2}).+(@.*)/, '$1***$2')})`;
          } else {
            resetInfo.textContent = 'Failed to send OTP email. Please try again.';
            resetError.textContent = response?.error || 'Network error. Please check your connection.';
            console.error('OTP send error:', response?.error);
            // Show the back button to let user try again
            resetBackBtn.style.display = 'block';
              }
        });
      });
    });

    resetBackBtn.addEventListener('click', () => {
      mainModal.style.display = 'block';
      resetModal.style.display = 'none';
      resetError.textContent = '';
    });

    resetConfirmBtn.addEventListener('click', () => {
      const otpInput = blurDiv.querySelector('#pg-reset-otp').value.trim();
      const newPass = blurDiv.querySelector('#pg-reset-newpass').value;
      resetError.textContent = '';

      if (!otpInput) {
        resetError.textContent = 'Please enter OTP.';
        return;
      }

      if (otpInput !== generatedOtp) {
        resetError.textContent = 'Invalid OTP.';
        return;
          }

      if (!newPass) {
        resetError.textContent = 'Please enter new password.';
        return;
      }

      if (newPass.length < 6) {
        resetError.textContent = 'Password must be at least 6 characters.';
        return;
          }

      // Save new password (hash it)
      const newHash = sha256(newPass);
      resetConfirmBtn.classList.add('loading');
            setTimeout(() => {
        chrome.storage.sync.set({ pg_password: newHash }, () => {
          resetConfirmBtn.classList.remove('loading');
          resetError.textContent = 'Password reset successfully! You can now log in.';
              setTimeout(() => {
            mainModal.style.display = 'block';
            resetModal.style.display = 'none';
          }, 1200);
        });
      }, 1200);
    });

    // Store original scroll position
    let scrollPosition = 0;

    // Lock scroll when blur layer is active
    document.body.classList.add('has-blur-overlay');
    document.documentElement.classList.add('has-blur-overlay');
    scrollPosition = window.pageYOffset;
    document.body.style.top = `-${scrollPosition}px`;
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';

    // Remove body class and cleanup when blur layer is removed
    const removeBlurLayer = () => {
      // Start fade out
      blurDiv.classList.remove('visible');
      
      // Wait for the transition to complete before removing
      blurDiv.addEventListener('transitionend', () => {
        // Restore scroll position
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollPosition);
        
        document.body.classList.remove('has-blur-overlay');
        document.documentElement.classList.remove('has-blur-overlay');
        blurDiv.remove();
      }, { once: true });
    };
  })
}
