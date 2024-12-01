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
          setTimeout(async () => {
            // 填寫 summary-field
            const summaryField = document.getElementById("summary-field");
            if (summaryField) {
              summaryField.value = message.data.title || "";
              summaryField.dispatchEvent(new Event("input", { bubbles: true }));
              console.log("Field 'summary-field' filled successfully.");
            } else {
              throw new Error("無法找到表單欄位 'summary-field'。");
            }

            // 處理時間欄位
            const dateFields = [
              { id: "customfield_10430-field", value: message.data.date },
              { id: "customfield_10431-field", value: message.data.date },
              { id: "customfield_10465-field", value: message.data.date },
              { id: "customfield_10438-field", value: message.data.date }
            ];

            const fillField = async (fieldId, value) => {
              return new Promise((resolve, reject) => {
                const field = document.getElementById(fieldId);
                if (field) {
                  field.focus();
                  field.value = value || "";
                  field.dispatchEvent(new Event("input", { bubbles: true }));
                  console.log(`Field '${fieldId}' filled with value: '${value}'.`);
                  resolve();
                } else {
                  reject(new Error(`無法找到表單欄位 '${fieldId}'。`));
                }
              });
            };

            // 填寫時間欄位
            for (const { id, value } of dateFields) {
              await fillField(id, value);
            }
            console.log("Time fields filled successfully.");

            // 處理三個選項欄位
            const fields = [
              { id: "assignee-field", value: message.data.reporter },
              { id: "customfield_10428-field", value: "cherry" },
              { id: "customfield_10440-field", value: "Ivory" }
            ];

            const fillOptionField = async (fieldId, value) => {
              return new Promise((resolve, reject) => {
                const field = document.getElementById(fieldId);
                if (field) {
                  field.focus();

                  if (value) {
                    let charIndex = 0;
                    const typeChar = () => {
                      if (charIndex < value.length) {
                        const char = value[charIndex];
                        field.value += char;
                        field.dispatchEvent(new Event("input", { bubbles: true }));

                        const keyEvent = new KeyboardEvent("keydown", { key: char, code: char });
                        field.dispatchEvent(keyEvent);

                        charIndex++;
                        setTimeout(typeChar, 50); // 每次輸入間隔 50 毫秒
                      } else {
                        // 等待輸入完成後檢查選項
                        setTimeout(() => {
                          const candidate = Array.from(document.querySelectorAll("span"))
                            .find(el => el.textContent === value);
                          if (candidate) {
                            candidate.click();
                            console.log(`Option '${value}' selected for field '${fieldId}'.`);
                            resolve(); // 完成當前欄位的操作
                          } else {
                            reject(new Error(`未找到匹配的選項 '${value}' for field '${fieldId}'。`));
                          }
                        }, 2000); // 等候選項渲染
                      }
                    };

                    typeChar();
                  } else {
                    reject(new Error(`未提供 '${fieldId}' 的值。`));
                  }
                } else {
                  reject(new Error(`無法找到表單欄位 '${fieldId}'。`));
                }
              });
            };

            // 處理三個選項欄位
            try {
              for (const { id, value } of fields) {
                await fillOptionField(id, value); // 等待每個欄位處理完成
              }

              console.log("All fields filled successfully.");
              sendResponse({ success: true, message: "表單已成功填寫。" });
            } catch (error) {
              console.error("Error:", error.message);
              sendResponse({ success: false, message: error.message });
            }
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
