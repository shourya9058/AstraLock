// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
    // Check if this is first run
    chrome.storage.sync.get(["pg_first_run"], (result) => {
      if (result.pg_first_run === undefined) {
        // First run - show setup wizard
        document.getElementById("main-view").style.display = "none"
        document.getElementById("setup-wizard").style.display = "block"
  
        // Set first run flag
        chrome.storage.sync.set({ pg_first_run: true })
      } else {
        // Check if we need to open a specific view
        chrome.storage.sync.get(["pg_open_view", "pg_verified"], (result) => {
          if (result.pg_open_view === "reset_password" && result.pg_verified) {
            // Open reset password view
            document.getElementById("main-view").style.display = "none"
            document.getElementById("reset-password-view").style.display = "block"
  
            // Clear the view and verification flags
            chrome.storage.sync.remove(["pg_open_view", "pg_verified"])
          }
        })
      }
    })
  
    // Setup Wizard
    setupWizardHandlers()
  
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
  
    // Check if user is already registered
    chrome.storage.sync.get(["pg_email", "pg_password"], (result) => {
      if (result.pg_email && result.pg_password) {
        // User is registered
        document.getElementById("password-not-set").style.display = "none"
        document.getElementById("password-already-set").style.display = "block"
      } else {
        // User is not registered
        document.getElementById("password-not-set").style.display = "block"
        document.getElementById("password-already-set").style.display = "none"
      }
    })
  
    // Create account
    document.getElementById("create-account").addEventListener("click", () => {
      const email = document.getElementById("email").value
      const password = document.getElementById("new-password").value
      const statusElement = document.getElementById("account-status")
  
      // Basic validation
      if (!email || !validateEmail(email)) {
        statusElement.textContent = "Please enter a valid email address."
        statusElement.className = "error"
        return
      }
  
      if (password.length < 6) {
        statusElement.textContent = "Password must be at least 6 characters."
        statusElement.className = "error"
        return
      }
  
      // Save user data
      chrome.storage.sync.set(
        {
          pg_email: email,
          pg_password: password,
        },
        () => {
          statusElement.textContent = "Account created successfully!"
          statusElement.className = "success"
  
          // Update UI after successful registration
          setTimeout(() => {
            document.getElementById("password-not-set").style.display = "none"
            document.getElementById("password-already-set").style.display = "block"
  
            // Switch to sites tab to prompt user to add sites
            document.querySelector('.tab[data-tab="sites"]').click()
          }, 1500)
        },
      )
    })
  
    // Logout button
    document.getElementById("logout-button").addEventListener("click", () => {
      if (confirm("Are you sure you want to logout? This will remove your account information.")) {
        chrome.storage.sync.remove(["pg_email", "pg_password"], () => {
          document.getElementById("password-not-set").style.display = "block"
          document.getElementById("password-already-set").style.display = "none"
        })
      }
    })
  
    // Forgot password link
    document.getElementById("forgot-password-link").addEventListener("click", () => {
      document.getElementById("main-view").style.display = "none"
      document.getElementById("forgot-password-view").style.display = "block"
  
      // Pre-fill email if available
      chrome.storage.sync.get(["pg_email"], (result) => {
        if (result.pg_email) {
          document.getElementById("reset-email").value = result.pg_email
        }
      })
    })
  
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
      const email = document.getElementById("reset-email").value
      const statusElement = document.getElementById("reset-status")
  
      if (!email || !validateEmail(email)) {
        statusElement.textContent = "Please enter a valid email address."
        statusElement.className = "error"
        return
      }
  
      // Check if email exists in storage
      chrome.storage.sync.get(["pg_email"], (result) => {
        if (result.pg_email !== email) {
          statusElement.textContent = "Email not found. Please enter the email you used to register."
          statusElement.className = "error"
          return
        }
  
        // Generate verification code (6 digits)
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
        const expiryTime = Date.now() + 15 * 60 * 1000 // 15 minutes expiry
  
        // Store verification code
        chrome.storage.sync.set(
          {
            pg_verification_code: verificationCode,
            pg_verification_expiry: expiryTime,
            pg_verification_email: email,
          },
          () => {
            // In a real extension, you would send an email here
            // For this demo, we'll show the code (in a real app, this would be sent via email)
            statusElement.textContent = `Verification code sent! (For demo: ${verificationCode})`
            statusElement.className = "success"
  
            // Move to verification code view after 2 seconds
            setTimeout(() => {
              document.getElementById("forgot-password-view").style.display = "none"
              document.getElementById("verification-view").style.display = "block"
            }, 2000)
          },
        )
      })
    })
  
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
  
        // Update password
        chrome.storage.sync.get(["pg_email"], (result) => {
          chrome.storage.sync.set(
            {
              pg_password: newPassword,
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
      addProtectedSite(document.getElementById("site-url").value, document.getElementById("sites-status"), () => {
        document.getElementById("site-url").value = ""
        loadProtectedSites()
      })
    })
  
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
      const siteListElement = document.getElementById("site-list")
  
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
            removeSite(site)
          })
  
          siteItem.appendChild(siteText)
          siteItem.appendChild(removeButton)
          siteListElement.appendChild(siteItem)
        })
      })
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
  
    function removeSite(site) {
      chrome.storage.sync.get(["protected_sites"], (result) => {
        let sites = result.protected_sites || []
  
        // Remove the site
        sites = sites.filter((s) => s !== site)
  
        chrome.storage.sync.set({ protected_sites: sites }, () => {
          // Reload sites list
          loadProtectedSites()
  
          const statusElement = document.getElementById("sites-status")
          statusElement.textContent = "Site removed successfully!"
          statusElement.className = "success"
        })
      })
    }
  
    function removeWizardSite(site) {
      chrome.storage.sync.get(["protected_sites"], (result) => {
        let sites = result.protected_sites || []
  
        // Remove the site
        sites = sites.filter((s) => s !== site)
  
        chrome.storage.sync.set({ protected_sites: sites }, () => {
          // Reload sites list
          loadWizardSites()
  
          const statusElement = document.getElementById("wizard-status-2")
          statusElement.textContent = "Site removed successfully!"
          statusElement.className = "success"
        })
      })
    }
  
    function addProtectedSite(siteUrl, statusElement, callback) {
      if (!siteUrl || !isValidUrl(siteUrl)) {
        statusElement.textContent = "Please enter a valid URL."
        statusElement.className = "error"
        return
      }
  
      // Add site to protected list
      chrome.storage.sync.get(["protected_sites"], (result) => {
        const sites = result.protected_sites || []
  
        // Check if site already exists
        if (sites.includes(siteUrl)) {
          statusElement.textContent = "This site is already protected."
          statusElement.className = "error"
          return
        }
  
        // Add new site
        sites.push(siteUrl)
  
        chrome.storage.sync.set({ protected_sites: sites }, () => {
          statusElement.textContent = "Site added successfully!"
          statusElement.className = "success"
  
          if (callback) callback()
        })
      })
    }
  
    function setupWizardHandlers() {
      // Step 1: Account Creation
      document.getElementById("wizard-next-1").addEventListener("click", () => {
        const email = document.getElementById("wizard-email").value
        const password = document.getElementById("wizard-password").value
        const statusElement = document.getElementById("wizard-status-1")
  
        // Basic validation
        if (!email || !validateEmail(email)) {
          statusElement.textContent = "Please enter a valid email address."
          statusElement.className = "error"
          return
        }
  
        if (password.length < 6) {
          statusElement.textContent = "Password must be at least 6 characters."
          statusElement.className = "error"
          return
        }
  
        // Save user data
        chrome.storage.sync.set(
          {
            pg_email: email,
            pg_password: password,
          },
          () => {
            // Move to step 2
            document.getElementById("wizard-step-1").style.display = "none"
            document.getElementById("wizard-step-2").style.display = "block"
  
            // Update step indicator
            document.querySelector('.step[data-step="1"]').classList.remove("active")
            document.querySelector('.step[data-step="2"]').classList.add("active")
          },
        )
      })
  
      // Step 2: Add Websites
      document.getElementById("wizard-add-site").addEventListener("click", () => {
        addProtectedSite(
          document.getElementById("wizard-site-url").value,
          document.getElementById("wizard-status-2"),
          () => {
            document.getElementById("wizard-site-url").value = ""
            loadWizardSites()
          },
        )
      })
  
      document.getElementById("wizard-next-2").addEventListener("click", () => {
        // Move to step 3
        document.getElementById("wizard-step-2").style.display = "none"
        document.getElementById("wizard-step-3").style.display = "block"
  
        // Update step indicator
        document.querySelector('.step[data-step="2"]').classList.remove("active")
        document.querySelector('.step[data-step="3"]').classList.add("active")
      })
  
      // Step 3: Completion
      document.getElementById("wizard-finish").addEventListener("click", () => {
        // Hide wizard, show main view
        document.getElementById("setup-wizard").style.display = "none"
        document.getElementById("main-view").style.display = "block"
  
        // Update UI to show account is set up
        document.getElementById("password-not-set").style.display = "none"
        document.getElementById("password-already-set").style.display = "block"
      })
    }
  })
  