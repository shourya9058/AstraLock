// Initialize EmailJS
emailjs.init("lKQMX4p-cSyYhv0-7");

// Add SHA-256 implementation at the top
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

// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Check if user is already registered before showing any view
  chrome.storage.sync.get(["pg_email", "pg_password"], (result) => {
    if (result.pg_email && result.pg_password) {
      // User is registered, show main view
      document.getElementById("main-view").style.display = "block";
      document.getElementById("setup-wizard").style.display = "none";
      document.getElementById("password-not-set").style.display = "none";
      document.getElementById("password-already-set").style.display = "block";
    } else {
      // User is not registered, show setup wizard
      document.getElementById("main-view").style.display = "none";
      document.getElementById("setup-wizard").style.display = "block";
      document.getElementById("wizard-step-1").style.display = "block";
      document.getElementById("wizard-password-step").style.display = "none";
      document.getElementById("wizard-step-2").style.display = "none";
      
      // Reset step indicators
      document.querySelectorAll('.step').forEach(step => step.classList.remove("active"));
      document.querySelector('.step[data-step="1"]').classList.add("active");
    }
  });

  // Setup Wizard
  setupWizardHandlers();

  // Tab navigation
  const tabs = document.querySelectorAll(".tab")
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Remove active class from all tabs
      tabs.forEach((t) => t.classList.remove("active"))
      // Add active class to clicked tab
      tab.classList.add("active")

      // Hide all tab content
      document.querySelectorAll(".tab-content").forEach((content) => {
        content.classList.remove("active")
      })

      // Show the corresponding tab content
      const tabId = tab.getAttribute("data-tab")
      document.getElementById(`${tabId}-tab`).classList.add("active")
    })
  })

  // Helper function to show fun success messages
  function showNotification(element, message, type) {
    element.textContent = message;
    element.className = type;
    element.innerHTML = type === 'success' ? `✨ ${message}` : `⚠️ ${message}`;
    
    // Remove any existing hide class and previous animation end listener
    element.classList.remove('hide');
    element.removeEventListener('animationend', element.hideListener);
    
    // Auto dismiss after 3 seconds
    setTimeout(() => {
      element.classList.add('hide');
      // Remove the element after animation completes
      element.hideListener = () => {
        element.textContent = '';
        element.className = '';
      };
      element.addEventListener('animationend', element.hideListener, { once: true });
    }, 3000);
  }

  function showSuccess(element, message) {
    showNotification(element, message, 'success');
  }

  function showError(element, message) {
    showNotification(element, message, 'error');
  }

  // Create account
  document.getElementById("create-account").addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const statusElement = document.getElementById("account-status");

    if (!email || !validateEmail(email)) {
      showError(statusElement, "Oops! That email doesn't look quite right 🤔");
      return;
    }

    // Send OTP and show modal
    sendVerificationEmail(email)
      .then((otp) => {
      showOTPModal((success) => {
        if (success) {
          showSuccess(statusElement, "Email verified successfully! 🎉");
          // Store email and verification status temporarily
          chrome.storage.sync.set({ 
            pg_temp_email: email,
            pg_temp_verified: true 
          }, () => {
            // Show password setup step
            document.getElementById("main-view").style.display = "none";
            document.getElementById("setup-wizard").style.display = "block";
            document.getElementById("wizard-step-1").style.display = "none";
            document.getElementById("wizard-password-step").style.display = "block";
            document.getElementById("wizard-step-2").style.display = "none";
            
            // Update step indicator
            document.querySelectorAll('.step').forEach(step => step.classList.remove("active"));
            document.querySelector('.step[data-step="2"]').classList.add("active");
          });
        }
        });
      })
      .catch((error) => {
        console.error('Failed to send OTP email:', error);
        showError(statusElement, "Failed to send verification code. Please try again.");
    });
  });

  // Logout button
  document.getElementById("logout-button").addEventListener("click", () => {
    showLogoutPasswordModal();
  })

  // Forgot password link
  document.getElementById("forgot-password-link").addEventListener("click", () => {
    document.getElementById("main-view").style.display = "none"
    document.getElementById("forgot-password-view").style.display = "block"

    // Pre-fill email and ensure it's the logged-in user's email
    chrome.storage.sync.get(["pg_email"], (result) => {
      const resetEmailInput = document.getElementById("reset-email");
      const resetStatus = document.getElementById("reset-status");
      
      if (!result.pg_email) {
        resetStatus.textContent = "No account found. Please set up your account first.";
        resetStatus.className = "error";
        resetEmailInput.value = "";
        document.getElementById("send-reset-link").disabled = true;
        return;
      }
      
      resetEmailInput.value = result.pg_email;
      resetStatus.textContent = "A verification code will be sent to your registered email.";
      resetStatus.className = "info";
      document.getElementById("send-reset-link").disabled = false;
    });
  });

  // Back button
  document.getElementById("back-to-main").addEventListener("click", () => {
    document.getElementById("forgot-password-view").style.display = "none"
    document.getElementById("main-view").style.display = "block"
  })

  // Back to forgot password
  document.getElementById("back-to-forgot").addEventListener("click", () => {
    document.getElementById("verification-view").style.display = "none"
    document.getElementById("forgot-password-view").style.display = "block"
  })

  // Send verification code
  document.getElementById("send-reset-link").addEventListener("click", () => {
    const email = document.getElementById("reset-email").value;
    const statusElement = document.getElementById("reset-status");

    // Verify that the email matches the logged-in user's email
    chrome.storage.sync.get(["pg_email"], (result) => {
      if (!result.pg_email) {
        statusElement.textContent = "No account found. Please set up your account first.";
        statusElement.className = "error";
        return;
      }

      if (result.pg_email !== email) {
        statusElement.textContent = "You can only reset password for your registered email.";
        statusElement.className = "error";
        return;
      }

      // Generate verification code (6 digits)
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiryTime = Date.now() + 15 * 60 * 1000; // 15 minutes expiry

      // Show loading state
      const button = document.getElementById("send-reset-link");
      button.disabled = true;
      button.textContent = "Sending...";

      // Store verification code
      chrome.storage.sync.set(
        {
          pg_verification_code: verificationCode,
          pg_verification_expiry: expiryTime,
          pg_verification_email: email,
        },
        () => {
          // Send actual email with verification code
          sendVerificationEmail(email, verificationCode)
            .then(() => {
              statusElement.textContent = "Verification code sent to your registered email!";
              statusElement.className = "success";

              // Reset button state
              button.disabled = false;
              button.textContent = "Send Verification Code";

              // Move to verification code view after 2 seconds
              setTimeout(() => {
                document.getElementById("forgot-password-view").style.display = "none";
                document.getElementById("verification-view").style.display = "block";

                // For demo purposes, show the code in the UI
                chrome.storage.sync.get(["pg_verification_code"], (result) => {
                  if (result.pg_verification_code) {
                    const demoCodeElement = document.createElement("div");
                    demoCodeElement.id = "demo-code";
                    demoCodeElement.style.marginTop = "10px";
                    demoCodeElement.style.padding = "8px";
                    demoCodeElement.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
                    demoCodeElement.style.borderRadius = "4px";
                    demoCodeElement.style.fontSize = "0.9rem";
                    demoCodeElement.textContent = `Demo Mode: Your verification code is ${result.pg_verification_code}`;

                    // Insert after the verification code input
                    const codeInput = document.getElementById("verification-code");
                    codeInput.parentNode.insertBefore(demoCodeElement, codeInput.nextSibling);
                  }
                });
              }, 2000);
            })
            .catch((error) => {
              console.error("Failed to send email:", error);
              statusElement.textContent = "Failed to send email. Please try again.";
              statusElement.className = "error";

              // Reset button state
              button.disabled = false;
              button.textContent = "Send Verification Code";
            });
        }
      );
    });
  });

  // Verify code
  document.getElementById("verify-code").addEventListener("click", () => {
    const code = document.getElementById("verification-code").value
    const statusElement = document.getElementById("verification-status")

    if (!code || code.length !== 6) {
      statusElement.textContent = "Please enter a valid 6-digit verification code."
      statusElement.className = "error"
      return
    }

    // Check verification code
    chrome.storage.sync.get(["pg_verification_code", "pg_verification_expiry"], (result) => {
      const storedCode = result.pg_verification_code
      const expiryTime = result.pg_verification_expiry

      // Check if code is valid and not expired
      if (!storedCode || !expiryTime || Date.now() > expiryTime) {
        statusElement.textContent = "Verification code has expired. Please request a new one."
        statusElement.className = "error"
        return
      }

      if (code !== storedCode) {
        statusElement.textContent = "Invalid verification code. Please try again."
        statusElement.className = "error"
        return
      }

      // Code is valid
      statusElement.textContent = "Verification successful!"
      statusElement.className = "success"

      // Set verification status
      chrome.storage.sync.set({ pg_verified: true }, () => {
        // Move to reset password view after 1.5 seconds
        setTimeout(() => {
          document.getElementById("verification-view").style.display = "none"
          document.getElementById("reset-password-view").style.display = "block"
        }, 1500)
      })
    })
  })

  // Update password
  document.getElementById("update-password").addEventListener("click", () => {
    const newPassword = document.getElementById("reset-new-password").value
    const confirmPassword = document.getElementById("reset-confirm-password").value
    const statusElement = document.getElementById("update-status")

    // Check verification status
    chrome.storage.sync.get(["pg_verified"], (result) => {
      if (!result.pg_verified) {
        statusElement.textContent = "Email verification required before changing password."
        statusElement.className = "error"
        return
      }

      if (newPassword.length < 6) {
        statusElement.textContent = "Password must be at least 6 characters."
        statusElement.className = "error"
        return
      }

      if (newPassword !== confirmPassword) {
        statusElement.textContent = "Passwords do not match."
        statusElement.className = "error"
        return
      }

      // Hash the new password before storing
      const hashedPassword = window.sha256(newPassword)

      // Update password (store hashed password)
      chrome.storage.sync.get(["pg_email"], (result) => {
        chrome.storage.sync.set(
          {
            pg_password: hashedPassword,
            pg_verification_code: null,
            pg_verification_expiry: null,
            pg_verified: false,
          },
          () => {
            statusElement.textContent = "Password updated successfully!"
            statusElement.className = "success"

            // Return to main view after 2 seconds
            setTimeout(() => {
              document.getElementById("reset-password-view").style.display = "none"
              document.getElementById("main-view").style.display = "block"
              document.getElementById("password-not-set").style.display = "none"
              document.getElementById("password-already-set").style.display = "block"
            }, 2000)
          },
        )
      })
    })
  })

  // Load protected sites
  loadProtectedSites()
  loadWizardSites()

  // Add site button
  document.getElementById("add-site").addEventListener("click", () => {
    const urlInput = document.getElementById("site-url");
    const url = urlInput.value;
    const statusElement = document.getElementById("sites-status");
    const addButton = document.getElementById("add-site");

    if (!url || !isValidUrl(url)) {
      showError(statusElement, "That URL needs a little adjustment 🔧");
      urlInput.focus();
      return;
    }

    // Show loading state
    addButton.disabled = true;
    addButton.innerHTML = '<span class="button-text">Adding...</span>';

    addProtectedSite(url, statusElement, () => {
      urlInput.value = "";
      showSuccess(statusElement, "New site added to your fortress! 🏰");
      
      // Reset button state
      addButton.disabled = false;
      addButton.innerHTML = '<span class="button-text">Add Site</span>';
      
      loadProtectedSites();
    });
  });

  // Helper functions
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  function isValidUrl(url) {
    try {
      new URL(url)
      return true
    } catch (e) {
      return false
    }
  }

  function loadProtectedSites() {
    const siteListElement = document.getElementById("site-list");
    const emptyState = document.querySelector(".empty-sites");

    chrome.storage.sync.get(["protected_sites", "pg_email"], (result) => {
      // Only show sites if user is logged in
      if (!result.pg_email) {
        // Reset to default if no user is logged in
        chrome.storage.sync.set({ protected_sites: ["https://web.whatsapp.com/"] }, () => {
          displaySites(["https://web.whatsapp.com/"]);
        });
        return;
      }

      const sites = result.protected_sites || ["https://web.whatsapp.com/"];
      displaySites(sites);
    });

    function displaySites(sites) {
      // Clear current list
      siteListElement.innerHTML = "";

      // Show/hide empty state
      if (sites.length === 0) {
        emptyState.style.display = "block";
        siteListElement.style.display = "none";
      } else {
        emptyState.style.display = "none";
        siteListElement.style.display = "block";

        // Add each site to the list with animation
        sites.forEach((site, index) => {
          const siteItem = document.createElement("div");
          siteItem.className = "site-item";
          siteItem.style.animation = `slideIn 0.3s ease forwards ${index * 0.1}s`;
          siteItem.style.opacity = "0";

          const siteText = document.createElement("span");
          siteText.textContent = site;

          const removeButton = document.createElement("button");
          removeButton.className = "remove-site";
          removeButton.innerHTML = '<span class="button-text">Remove</span>';
          
        removeButton.addEventListener("click", () => {
            // Only add fade-out animation after password verification
            removeSite(site);
          });

          siteItem.appendChild(siteText);
          siteItem.appendChild(removeButton);
          siteListElement.appendChild(siteItem);
        });
      }
    }
  }

  function loadWizardSites() {
    const siteListElement = document.getElementById("wizard-site-list")

    chrome.storage.sync.get(["protected_sites"], (result) => {
      const sites = result.protected_sites || []

      // Default to WhatsApp if no sites are set
      if (sites.length === 0) {
        chrome.storage.sync.set({ protected_sites: ["https://web.whatsapp.com/"] })
        sites.push("https://web.whatsapp.com/")
      }

      // Clear current list
      siteListElement.innerHTML = ""

      // Add each site to the list
      sites.forEach((site) => {
        const siteItem = document.createElement("div")
        siteItem.className = "site-item"

        const siteText = document.createElement("span")
        siteText.textContent = site

        const removeButton = document.createElement("button")
        removeButton.className = "remove-site"
        removeButton.textContent = "Remove"
        removeButton.addEventListener("click", () => {
          removeWizardSite(site)
        })

        siteItem.appendChild(siteText)
        siteItem.appendChild(removeButton)
        siteListElement.appendChild(siteItem)
      })
    })
  }

  // --- Secure Remove/Edit of Protected Sites ---
  // Wrap removeSite and addProtectedSite to require authentication

  // Save original removeSite and addProtectedSite
  const _removeSite = removeSite;
  const _addProtectedSite = addProtectedSite;

  function removeSite(site) {
    showPasswordModalForTabAccess((success) => {
      if (success) {
        chrome.storage.sync.get(['protected_sites'], (res) => {
          let sites = res.protected_sites || [];
          sites = sites.filter((s) => s !== site);
          chrome.storage.sync.set({ protected_sites: sites }, () => {
            loadProtectedSites();
            const statusElement = document.getElementById('sites-status');
            showSuccess(statusElement, 'Site removed successfully! 🗑️');
          });
        });
      }
    });
  }

  function removeWizardSite(site) {
    showPasswordModalForTabAccess((success) => {
      if (success) {
        chrome.storage.sync.get(['protected_sites'], (res) => {
          let sites = res.protected_sites || [];
          sites = sites.filter((s) => s !== site);
          chrome.storage.sync.set({ protected_sites: sites }, () => {
            loadWizardSites();
            const statusElement = document.getElementById('wizard-status-2');
            showSuccess(statusElement, 'Site removed successfully! 🗑️');
          });
        });
      }
    });
  }

  function addProtectedSite(siteUrl, statusElement, callback) {
    if (!siteUrl || !isValidUrl(siteUrl)) {
      showError(statusElement, "Please enter a valid URL.");
      return;
    }

    // Add site to protected list
    chrome.storage.sync.get(["protected_sites"], (result) => {
      const sites = result.protected_sites || [];

      // Check if site already exists
      if (sites.includes(siteUrl)) {
        showError(statusElement, "This site is already protected.");
        return;
      }

      // Add new site
      sites.push(siteUrl);

      chrome.storage.sync.set({ protected_sites: sites }, () => {
        showSuccess(statusElement, "New site added to your fortress! 🏰");
        if (callback) callback();
      });
    });
  }

  // Update the wizard handlers
  function setupWizardHandlers() {
    // Step 1: Account Creation
    document.getElementById("wizard-next-1").addEventListener("click", () => {
      const email = document.getElementById("wizard-email").value;
      const statusElement = document.getElementById("wizard-status-1");

      if (!email || !validateEmail(email)) {
        showError(statusElement, "Hold up! That email needs another look 🧐");
        return;
      }

      // Clean up existing data and send OTP
      chrome.storage.sync.remove(["pg_temp_email", "pg_temp_verified"], () => {
      sendOTP(email, () => {
          showOTPModal((success) => {
            if (success) {
              showSuccess(statusElement, "Awesome! Email verified successfully 🌟");
              chrome.storage.sync.set({ 
                pg_temp_email: email,
                pg_temp_verified: true 
              }, () => {
                document.getElementById("wizard-step-1").style.display = "none";
                document.getElementById("wizard-password-step").style.display = "block";
                document.querySelector('.step[data-step="1"]').classList.remove("active");
                document.querySelector('.step[data-step="2"]').classList.add("active");
              });
            }
          }, statusElement);
        });
      });
    });

    // Password setup step
    document.getElementById("wizard-set-password").addEventListener("click", () => {
      const password = document.getElementById("wizard-password").value;
      const statusElement = document.getElementById("wizard-password-status");

      if (!password || password.length < 6) {
        showError(statusElement, "Your password needs a bit more strength 💪");
        return;
      }

      chrome.storage.sync.get(['pg_temp_email', 'pg_temp_verified'], (result) => {
        if (!result.pg_temp_email || !result.pg_temp_verified) {
          showError(statusElement, "Let's verify your email first! 📧");
          // Reset to first step
          document.getElementById("wizard-password-step").style.display = "none";
          document.getElementById("wizard-step-1").style.display = "block";
          document.querySelector('.step[data-step="2"]').classList.remove("active");
          document.querySelector('.step[data-step="1"]').classList.add("active");
          return;
        }

        const hashedPassword = sha256(password);
        
        chrome.storage.sync.set({ 
          pg_email: result.pg_temp_email, 
          pg_password: hashedPassword 
        }, () => {
          chrome.storage.sync.remove(['pg_temp_email', 'pg_temp_verified'], () => {
            showSuccess(statusElement, "Perfect! Your password is set 🔒");
            setTimeout(() => {
              document.getElementById("wizard-password-step").style.display = "none";
              document.getElementById("wizard-step-2").style.display = "block";
              document.querySelector('.step[data-step="2"]').classList.remove("active");
              document.querySelector('.step[data-step="3"]').classList.add("active");
              loadWizardSites();
            }, 1000);
          });
        });
      });
    });

    // Add site handlers
    document.getElementById("wizard-add-site").addEventListener("click", () => {
      const url = document.getElementById("wizard-site-url").value;
      const statusElement = document.getElementById("wizard-status-2");

      if (!url || !isValidUrl(url)) {
        showError(statusElement, "Hmm, that URL doesn't look quite right 🤔");
        return;
      }

      addProtectedSite(url, statusElement, () => {
        document.getElementById("wizard-site-url").value = "";
        showSuccess(statusElement, "Site added to your protected list! 🛡️");
        loadWizardSites();
      });
    });

    document.getElementById("wizard-next-2").addEventListener("click", () => {
      const statusElement = document.getElementById("wizard-status-2");
      showSuccess(statusElement, "All set! Your digital fortress is ready 🏰");
      setTimeout(() => {
        document.getElementById("setup-wizard").style.display = "none";
        document.getElementById("main-view").style.display = "block";
        document.getElementById("password-not-set").style.display = "none";
        document.getElementById("password-already-set").style.display = "block";
      }, 1000);
    });
  }

  // --- OTP and Email Utility Functions (must be defined before use) ---
  function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  function sendVerificationEmail(email) {
    return new Promise((resolve, reject) => {
      if (!window.sendVerificationEmail) {
        console.error('EmailJS not loaded');
        reject(new Error('EmailJS not loaded'));
        return;
      }

      const otp = generateOTP();
      // Store OTP before sending email
      const expiry = Date.now() + 15 * 60 * 1000; // 15 minutes expiry
      chrome.storage.sync.set({ 
        pg_verification_code: otp,
        pg_verification_expiry: expiry,
        pg_verification_email: email 
      }, () => {
        window.sendVerificationEmail(email, otp)
          .then(() => {
            resolve(otp);
          })
          .catch((err) => {
            console.error('Failed to send OTP email:', err);
            reject(err);
          });
      });
    });
  }

  function sendOTP(email, callback, statusElement) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 15 * 60 * 1000;
    chrome.storage.sync.set({ pg_verification_code: code, pg_verification_expiry: expiry, pg_verification_email: email }, () => {
      sendVerificationEmail(email).then(() => {
        if (callback) callback();
      }).catch((err) => {
        // Improved error reporting: show error in UI and log to console
        if (statusElement) {
          statusElement.textContent = `Failed to send OTP email: ${err.message || err}`;
          statusElement.className = "error";
        }
        console.error("Failed to send OTP email:", err);
        alert("Failed to send OTP email. Please check your network and EmailJS setup.");
        if (callback) callback(false);
      });
    });
  }

  function showOTPModal(onVerify, onCancel) {
    const modal = document.getElementById('otp-modal');
    const input = document.getElementById('otp-input');
    const status = document.getElementById('otp-modal-status');
    modal.style.display = 'flex';
    input.value = '';
    status.textContent = '';
    input.focus();

    document.getElementById('otp-verify-btn').onclick = function() {
      const code = input.value.trim();
      chrome.storage.sync.get(['pg_verification_code', 'pg_verification_expiry'], (result) => {
        console.log('Entered code:', code);
        console.log('Stored code:', result.pg_verification_code);
        if (!result.pg_verification_code || !result.pg_verification_expiry || Date.now() > result.pg_verification_expiry) {
          status.textContent = 'OTP expired. Please try again.';
          return;
        }
        if (code !== result.pg_verification_code) {
          status.textContent = 'Invalid OTP. Please try again.';
          return;
        }
        modal.style.display = 'none';
        chrome.storage.sync.set({ pg_verification_code: null, pg_verification_expiry: null });
        if (onVerify) onVerify(true);
      });
    };

    document.getElementById('otp-cancel-btn').onclick = function() {
      modal.style.display = 'none';
      if (typeof onCancel === 'function') {
        onCancel();
      } else if (typeof onVerify === 'function') {
        onVerify(false);
      }
    };
  }

  // --- Secure the Protected Sites Tab ---

  // Helper: Prompt for password and authenticate
  function promptPopupPassword(callback) {
    const password = prompt('Enter your master password to access this section:');
    if (!password) return;
    // Hash the entered password
    const enteredHash = window.sha256(password);
    chrome.storage.sync.get(['pg_password'], (result) => {
      if (enteredHash === result.pg_password) {
        if (typeof callback === 'function') callback(true);
      } else {
        alert('Incorrect password.');
        if (typeof callback === 'function') callback(false);
      }
    });
  }

  // Protect the sites tab
  const sitesTab = document.querySelector('.tab[data-tab="sites"]');
  const sitesTabContent = document.getElementById('sites-tab');
  const accountTab = document.querySelector('.tab[data-tab="account"]');
  const accountTabContent = document.getElementById('account-tab');

  sitesTab.addEventListener('click', (e) => {
    e.preventDefault();
    showPasswordModalForTabAccess((success) => {
        if (success) {
        // Show protected sites tab
          sitesTab.classList.add('active');
        accountTab.classList.remove('active');
          sitesTabContent.classList.add('active');
        accountTabContent.classList.remove('active');
      } else {
        // On cancel or incorrect password, stay on account tab
        accountTab.classList.add('active');
        sitesTab.classList.remove('active');
        accountTabContent.classList.add('active');
    sitesTabContent.classList.remove('active');
  }
    });
  });

  function showPasswordModalForTabAccess(callback) {
    const modal = document.getElementById('password-modal');
    const input = document.getElementById('password-modal-input');
    const status = document.getElementById('password-modal-status');
    modal.style.display = 'flex';
    input.value = '';
    status.textContent = '';
    input.focus();

    document.getElementById('password-modal-submit').onclick = function() {
      const enteredPassword = input.value;
      if (!enteredPassword) {
        showError(status, "Don't forget your password! 🔑");
        return;
      }
      
      const enteredPasswordHash = sha256(enteredPassword);
      
      chrome.storage.sync.get(['pg_password'], (result) => {
        const realPasswordHash = result.pg_password;
        if (enteredPasswordHash === realPasswordHash) {
          modal.style.display = 'none';
          if (typeof callback === 'function') callback(true);
        } else {
          showError(status, "Oops! That's not the right password 🤔");
          input.value = '';
          input.focus();
        }
      });
    };

    document.getElementById('password-modal-cancel').onclick = function() {
      modal.style.display = 'none';
      if (typeof callback === 'function') callback(false);
    };
  }

  // Update the logout logic to properly reset protected sites
  function showLogoutPasswordModal() {
    const modal = document.getElementById('password-modal');
    const input = document.getElementById('password-modal-input');
    const status = document.getElementById('password-modal-status');
    modal.style.display = 'flex';
    input.value = '';
    status.textContent = '';
    input.focus();

    // Add or show the 'Forgot password?' link below the input
    let forgotLink = document.getElementById('password-modal-forgot');
    if (!forgotLink) {
      forgotLink = document.createElement('p');
      forgotLink.id = 'password-modal-forgot';
      forgotLink.textContent = 'Forgot password?';
      forgotLink.style.cursor = 'pointer';
      forgotLink.style.color = '#0984e3';
      forgotLink.style.marginTop = '1rem';
      forgotLink.style.textDecoration = 'underline';
      input.parentNode.insertBefore(forgotLink, input.nextSibling.nextSibling);
    } else {
      forgotLink.style.display = 'block';
    }
    forgotLink.onclick = function() {
      modal.style.display = 'none';
      document.getElementById('main-view').style.display = 'none';
      document.getElementById('forgot-password-view').style.display = 'block';
      chrome.storage.sync.get(["pg_email"], (result) => {
        if (result.pg_email) {
          document.getElementById("reset-email").value = result.pg_email;
        }
      });
    };

    document.getElementById('password-modal-submit').onclick = function() {
      const enteredPassword = input.value;
      status.textContent = '';
      if (!enteredPassword) {
        showError(status, 'Please enter your password.');
        return;
      }
      chrome.storage.sync.get(['pg_password'], (result) => {
        const realPasswordHash = result.pg_password;
        const enteredPasswordHash = sha256(enteredPassword);
        if (enteredPasswordHash === realPasswordHash) {
          // Password correct, proceed to logout
          modal.style.display = 'none';
          // Clear ALL relevant storage items and reset to default protected sites
          chrome.storage.sync.set(
            { 
              protected_sites: ["https://web.whatsapp.com/"]
            }, 
            () => {
              chrome.storage.sync.remove([
                "pg_email", 
                "pg_password",
                "pg_first_run",
                "pg_temp_email",
                "pg_temp_verified",
                "pg_verification_code",
                "pg_verification_expiry",
                "pg_verification_email"
              ], () => {
                // Show setup wizard with email step
                document.getElementById("main-view").style.display = "none";
                document.getElementById("setup-wizard").style.display = "block";
                document.getElementById("wizard-step-1").style.display = "block";
                document.getElementById("wizard-password-step").style.display = "none";
                document.getElementById("wizard-step-2").style.display = "none";
                
                // Reset step indicators
                document.querySelectorAll('.step').forEach(step => step.classList.remove("active"));
                document.querySelector('.step[data-step="1"]').classList.add("active");

                // Reload protected sites to show default
                loadProtectedSites();
              });
            }
          );
        } else {
          showError(status, 'Incorrect password. Please try again.');
          input.value = '';
          input.focus();
        }
      });
    };
    
    document.getElementById('password-modal-cancel').onclick = function() {
      modal.style.display = 'none';
    };
  }

  // Listen for OTP email requests from content.js
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'send_otp_email') {
      if (window.emailjs && typeof window.emailjs.send === 'function') {
        window.emailjs.send('service_h9a8bgc', 'template_zuuk2t1', {
          to_email: request.toEmail,
          verification_code: request.otp,
          to_name: request.toEmail.split('@')[0]
        }).then(() => {
          sendResponse({ success: true });
        }).catch((err) => {
          sendResponse({ success: false, error: err });
        });
        return true; // Keep the message channel open for async response
      } else {
        sendResponse({ success: false, error: 'EmailJS not loaded' });
      }
    }
  });

  // Add these CSS keyframes to your styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
  }
    }

    @keyframes fadeOut {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(20px);
      }
    }
  `;
  document.head.appendChild(style);
});
