document.getElementById('fill-form').addEventListener('click', function() {
    const optionsURL = chrome.runtime.getURL('options.html');
    window.open(optionsURL, '_blank');
  });
