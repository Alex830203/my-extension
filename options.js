document.getElementById('options-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const reporter = document.getElementById('reporter').value;
  const title = document.getElementById('title').value;
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;
  const createdAt = new Date().toISOString(); // 創建時間 (ISO 格式)

  chrome.storage.sync.get({ entries: [] }, (data) => {
    const newEntry = { reporter, title, date, time, createdAt };
    const updatedEntries = [newEntry, ...data.entries]; // 頭插入新資料

    chrome.storage.sync.set({ entries: updatedEntries }, () => {
      alert('設定已儲存！');
      displayEntries(); // 更新表格
    });
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  const currentDate = now.toISOString().slice(0, 10); // YYYY-MM-DD format

  document.getElementById('date').value = currentDate;
  document.getElementById('time').value = currentTime;

  displayEntries(); // 顯示儲存的表格
});

// 顯示儲存的表格，並依創建時間降序排列
function displayEntries() {
  const tableBody = document.getElementById('entries-table');
  tableBody.innerHTML = ''; // 清空表格

  chrome.storage.sync.get({ entries: [] }, (data) => {
    // 依創建時間降序排列
    const sortedEntries = data.entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    sortedEntries.forEach((entry, index) => {
      const row = document.createElement('tr');
      const createdAtInTaipei = convertToTaipeiTime(entry.createdAt); // 轉換為台北時間

      row.innerHTML = `
        <td>${index + 1}</td> <!-- 顯示編號 -->
        <td>${entry.reporter}</td>
        <td class="title">${entry.title}</td>
        <td>${entry.date}</td>
        <td>${entry.time}</td>
        <td>${createdAtInTaipei}</td> <!-- 顯示創建時間 (台灣時間) -->
        <td>
          <button class="btn-submit" data-index="${index}">送單</button>
          <button class="delete-btn" data-index="${index}">刪除</button>
        </td>
      `;

      tableBody.appendChild(row);
    });
  });
}

// 將時間轉換為台灣時間 (UTC+8)
function convertToTaipeiTime(utcTime) {
  const date = new Date(utcTime);
  const taipeiOffset = 0 * 60; // 台灣時區 (UTC+8)
  const taipeiTime = new Date(date.getTime() + taipeiOffset * 60 * 1000); // 調整時間

  const hours = taipeiTime.getHours().toString().padStart(2, '0');
  const minutes = taipeiTime.getMinutes().toString().padStart(2, '0');
  const year = taipeiTime.getFullYear();
  const month = (taipeiTime.getMonth() + 1).toString().padStart(2, '0');
  const day = taipeiTime.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 綁定刪除按鈕的事件
document.getElementById('entries-table').addEventListener('click', (event) => {
  // 刪除按鈕的處理
  if (event.target.classList.contains('delete-btn')) {
    const index = parseInt(event.target.getAttribute('data-index'), 10); // 取得對應的資料索引

    chrome.storage.sync.get({ entries: [] }, (data) => {
      // 使用filter過濾掉要刪除的資料
      const updatedEntries = data.entries.filter((_, i) => i !== index);

      chrome.storage.sync.set({ entries: updatedEntries }, () => {
        alert('項目已刪除！');
        displayEntries(); // 更新表格
      });
    });
  }

  // 送單按鈕的處理
  if (event.target.classList.contains('btn-submit')) {
    const index = parseInt(event.target.getAttribute('data-index'), 10);

    chrome.storage.sync.get({ entries: [] }, (data) => {
      console.log("data:", data); // 顯示從存儲中獲取的資料
      const entry = data.entries[index];
      console.log("entry:", entry); // 顯示從存儲中獲取的資料

      // 發送資料給 content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab) {
          console.log("Active tab ID:", activeTab.id);  // 確保頁面已被選中
          chrome.tabs.sendMessage(activeTab.id, { action: "fill_form", data: { test: "Testing log message" } }, (response) => {
            if (chrome.runtime.lastError) {
              console.error("錯誤發生:", chrome.runtime.lastError); // 打印錯誤訊息
            } else if (response?.success) {
              console.log("填寫表單成功：", response.message);
            } else {
              console.error("送單失敗：", response?.message || "未知錯誤");
            }
          });
        } else {
          console.error("無法獲取活動標籤頁");
        }
      });        
    });
  }
});

// 自動填入表單資料
function fillFormWithEntry(entry) {
  document.getElementById('reporter').value = entry.reporter;
  document.getElementById('title').value = entry.title;
  document.getElementById('date').value = entry.date;
  document.getElementById('time').value = entry.time;
}