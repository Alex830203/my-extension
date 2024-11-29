if (window.location.hostname === "slphc.atlassian.net") {
  console.log("Content script loaded on allowed domain.");

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "fill_form") {
      console.log("Received data:", message.data);

      try {
        // 1. 點擊按鈕 id="createGlobalItem"
        const createButton = document.getElementById("createGlobalItem");
        if (createButton) {
          createButton.click();
          console.log("Button 'createGlobalItem' clicked.");

          // 2. 模擬填寫表單
          setTimeout(() => {
            // 填寫 summary-field
            const summaryField = document.getElementById("summary-field");
            if (summaryField) {
              summaryField.value = message.data.title || "";
              summaryField.dispatchEvent(new Event("input", { bubbles: true }));
              console.log("Field 'summary-field' filled successfully.");
            } else {
              throw new Error("無法找到表單欄位 'summary-field'。");
            }

            // 填寫 assignee-field
            const assigneeField = document.getElementById("assignee-field");
            if (assigneeField) {
              assigneeField.focus(); // 聚焦輸入框

              const reporterName = message.data.reporter || "";
              if (reporterName) {
                // 模擬鍵盤輸入
                reporterName.split("").forEach((char) => {
                  const keyEvent = new KeyboardEvent("keydown", { key: char });
                  assigneeField.dispatchEvent(keyEvent);
                  assigneeField.value += char; // 模擬輸入字符
                  assigneeField.dispatchEvent(new Event("input", { bubbles: true }));
                });

                // 模擬按下 Enter 鍵
                setTimeout(() => {
                  const enterEvent = new KeyboardEvent("keydown", { key: "Enter", code: "Enter" });
                  assigneeField.dispatchEvent(enterEvent);
                  assigneeField.dispatchEvent(new Event("blur", { bubbles: true })); // 失去焦點
                  console.log("Assignee field submitted with Enter key.");
                }, 5000); // 確保輸入完成後按下 Enter

                console.log(`Field 'assignee-field' filled with value: ${reporterName}`);
              } else {
                throw new Error("未提供 'reporter' 值。");
              }
            } else {
              throw new Error("無法找到表單欄位 'assignee-field'。");
            }

            sendResponse({ success: true, message: "表單已成功填寫。" });
          }, 5000); // 延遲 5 秒以確保表單元素已加載
        } else {
          throw new Error("Button 'createGlobalItem' not found.");
        }
      } catch (error) {
        console.error("Error:", error);
        sendResponse({ success: false, message: error.message });
      }
    }

    return true; // 表示 sendResponse 是非同步的
  });
}
