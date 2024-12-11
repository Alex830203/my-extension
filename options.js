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

let currentPage = 1; // 當前頁面
const entriesPerPage = 10; // 每頁顯示的條目數

// 顯示儲存的表格，並依創建時間降序排列
function displayEntries() {
  const tableBody = document.getElementById('entries-table');
  tableBody.innerHTML = ''; // 清空表格

  chrome.storage.sync.get({ entries: [] }, (data) => {
    const sortedEntries = data.entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // 計算分頁資料
    const totalEntries = sortedEntries.length;
    const totalPages = Math.ceil(totalEntries / entriesPerPage);
    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = currentPage * entriesPerPage;
    const entriesToDisplay = sortedEntries.slice(startIndex, endIndex); // 取出對應頁面的資料

    entriesToDisplay.forEach((entry, index) => {
      const row = document.createElement('tr');
      const createdAtInTaipei = convertToTaipeiTime(entry.createdAt);

      // 將標題中的關鍵字轉換為超連結
      const titleWithLink = convertTitleToLink(entry.title);

      row.innerHTML = `
        <td>${startIndex + index + 1}</td> <!-- 顯示編號 -->
        <td>${entry.reporter}</td>
        <td class="title">${titleWithLink}</td> <!-- 顯示帶超連結的標題 -->
        <td>${entry.date}</td>
        <td>${entry.time}</td>
        <td>${createdAtInTaipei}</td>
        <td>
          <button class="btn-submit" data-index="${startIndex + index}">送單</button>
          <button class="delete-btn" data-index="${startIndex + index}">刪除</button>
        </td>
      `;

      tableBody.appendChild(row);
    });

    // 更新分頁顯示
    updatePagination(totalPages);
  });
}

// 將標題中的關鍵字轉換為超連結
function convertTitleToLink(title) {
  const regex = /\[([A-Za-z0-9\-]+)\]/; // 使用正則表達式匹配類似 [PCPP-122] 的部分
  const match = title.match(regex);

  if (match && match[1]) {
    const ticketId = match[1];
    const jiraUrl = `https://slphc.atlassian.net/browse/${ticketId}`; // 构建 Jira URL
    return title.replace(regex, `<a href="${jiraUrl}" target="_blank">${match[0]}</a>`); // 替換為超連結
  }

  return title; // 如果沒有匹配到票號，返回原始標題
}

// 更新分頁顯示
function updatePagination(totalPages) {
  const paginationContainer = document.getElementById('pagination');
  paginationContainer.innerHTML = ''; // 清空分頁容器

  // 顯示上一頁按鈕
  if (currentPage > 1) {
    const prevButton = document.createElement('button');
    prevButton.innerText = '上一頁';
    prevButton.onclick = () => {
      currentPage--;
      displayEntries(); // 更新資料
    };
    paginationContainer.appendChild(prevButton);
  }

  // 顯示下一頁按鈕
  if (currentPage < totalPages) {
    const nextButton = document.createElement('button');
    nextButton.innerText = '下一頁';
    nextButton.onclick = () => {
      currentPage++;
      displayEntries(); // 更新資料
    };
    paginationContainer.appendChild(nextButton);
  }

  // 顯示頁碼
  const pageNumber = document.createElement('span');
  pageNumber.innerText = `第 ${currentPage} 頁 / 共 ${totalPages} 頁`;
  paginationContainer.appendChild(pageNumber);
}

document.getElementById("search").addEventListener("input", function () {
  const filter = this.value.toLowerCase(); // 獲取搜尋字串
  const rows = document.querySelectorAll("#entries-table tr"); // 獲取所有表格列

  rows.forEach((row) => {
    const cells = row.querySelectorAll("td"); // 獲取每列中的所有儲存格
    const match = Array.from(cells).some((cell) =>
      cell.textContent.toLowerCase().includes(filter)
    ); // 檢查是否有儲存格包含搜尋字串

    row.style.display = match ? "" : "none"; // 根據匹配結果顯示或隱藏列
  });
});

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
      chrome.tabs.query({ active: false, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab) {
          console.log("Tab title:", activeTab.title);  // 確保頁面已被選中
          chrome.tabs.sendMessage(activeTab.id, { action: "fill_form", data: entry }, (response) => {
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
