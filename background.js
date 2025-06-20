// Listen for tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
    try {
      // Get protected sites from storage
      const result = await chrome.storage.sync.get(["protected_sites"]);
      const sites = result.protected_sites || ["https://web.whatsapp.com/"];
  
        // Check if current URL matches any protected site
        const shouldProtect = sites.some((site) => {
          try {
          const siteUrl = new URL(site);
          const tabUrl = new URL(tab.url);
  
            // Compare hostname only (ignore pathname for broader protection)
            return (
              tabUrl.hostname === siteUrl.hostname ||
              tabUrl.hostname.endsWith(`.${siteUrl.hostname}`) ||
              siteUrl.hostname.endsWith(`.${tabUrl.hostname}`)
          );
          } catch (e) {
          console.error('URL parsing error:', e);
          return false;
          }
      });
  
      // If current site should be protected, inject content script and SHA256
        if (shouldProtect) {
        console.log('Protecting site:', tab.url);
        try {
          // First inject SHA256
          await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["sha256.min.js"]
          });
          
          // Then inject content script
          await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["content.js"]
          });
          
          console.log('Scripts injected successfully');
        } catch (err) {
          console.error('Script injection error:', err);
        }
        }
    } catch (err) {
      console.error('Error in background script:', err);
    }
    }
});
  
  // Listen for installation
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
      // Set default protected sites
      chrome.storage.sync.set({
        protected_sites: ["https://web.whatsapp.com/"],
      })
  
      // Open options page for initial setup
      chrome.runtime.openOptionsPage()
    }
  })
  
  // Listen for messages from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "openPopup" && message.view) {
      // Store the view to open
      chrome.storage.sync.set({ pg_open_view: message.view }, () => {
        // Open the extension popup
        chrome.action.openPopup()
      })
    }
  })

// Service Worker for AstraLock
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'send_otp_email') {
    console.log('Attempting to send OTP email to:', request.toEmail);
    
    const sendEmailWithRetry = async (retryCount = 0) => {
      try {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            service_id: 'service_h9a8bgc',
            template_id: 'template_zuuk2t1',
            user_id: 'lKQMX4p-cSyYhv0-7',
            template_params: {
              to_email: request.toEmail,
              verification_code: request.otp,
              to_name: request.toEmail.split('@')[0]
            }
          })
        });

        console.log('EmailJS API Response:', {
          status: response.status,
          statusText: response.statusText
        });

        if (response.ok) {
          console.log('Email sent successfully to:', request.toEmail);
          sendResponse({ success: true });
          return;
        }

        const errorText = await response.text();
        console.error('EmailJS API Error Response:', errorText);

        // If we haven't exceeded retry attempts and it's a retryable error
        if (retryCount < 2 && response.status >= 500) {
          console.log(`Retrying email send (attempt ${retryCount + 1})...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          return sendEmailWithRetry(retryCount + 1);
        }

        throw new Error(`EmailJS API Error: ${errorText}`);
      } catch (error) {
        console.error('Email sending error:', error);
        
        // If it's a network error and we haven't exceeded retry attempts
        if (error.name === 'TypeError' && retryCount < 2) {
          console.log(`Retrying email send (attempt ${retryCount + 1})...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          return sendEmailWithRetry(retryCount + 1);
        }

        sendResponse({ 
          success: false, 
          error: error.message || 'Failed to send email. Please try again.'
        });
      }
    };

    // Start the email sending process
    sendEmailWithRetry();
    return true; // Keep the message channel open for async response
  }
});
  