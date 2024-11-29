// content.js
if (window.location.hostname === "slphc.atlassian.net") {
  console.log("Content script loaded on allowed domain.");
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "fill_form") {
      console.log("Received fill_form event with data:", message.data);
      sendResponse({ success: true, message: "Log printed on target page." });
    }
    return true;  // 允許異步處理消息
  });
}
