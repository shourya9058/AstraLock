// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
      // Check if the URL is in the protected sites list
      chrome.storage.sync.get(["protected_sites"], (result) => {
        const sites = result.protected_sites || ["https://web.whatsapp.com/"]
  
        // Check if current URL matches any protected site
        const shouldProtect = sites.some((site) => {
          try {
            const siteUrl = new URL(site)
            const tabUrl = new URL(tab.url)
  
            // Compare hostname only (ignore pathname for broader protection)
            return (
              tabUrl.hostname === siteUrl.hostname ||
              tabUrl.hostname.endsWith(`.${siteUrl.hostname}`) ||
              siteUrl.hostname.endsWith(`.${tabUrl.hostname}`)
            )
          } catch (e) {
            return false
          }
        })
  
        // If current site should be protected, inject content script
        if (shouldProtect) {
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["content.js"],
          })
        }
      })
    }
  })
  
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
  