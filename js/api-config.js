function showMessage(msg, type) {
  var box = document.getElementById('msgBox');
  if (!box) {
    box = document.createElement('div');
    box.id = 'msgBox';
    box.style.cssText = 'display:none;position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:99999;min-width:300px;max-width:600px;padding:12px 20px;border-radius:8px;font-weight:500;text-align:center;box-shadow:0 4px 15px rgba(0,0,0,0.2);font-family:inherit;';
    document.body.appendChild(box);
  }
  box.textContent = msg;
  box.style.display = 'block';
  var colors = {success:'#d4edda',danger:'#f8d7da',warning:'#fff3cd',info:'#d1ecf1'};
  var textColors = {success:'#155724',danger:'#721c24',warning:'#856404',info:'#0c5460'};
  box.style.background = colors[type] || colors.danger;
  box.style.color = textColors[type] || textColors.danger;
  box.style.border = '1px solid ' + (type === 'success' ? '#c3e6cb' : type === 'warning' ? '#ffeeba' : type === 'info' ? '#bee5eb' : '#f5c6cb');
  setTimeout(function(){ box.style.display = 'none'; }, 5000);
}

(function () {
  'use strict';
  var API_HOST = 'http://127.0.0.1:8000';
  var origFetch = window.fetch;
  window.fetch = function (input, init) {
    if (typeof input === 'string' && (input.startsWith('/api/') || input.startsWith('/api'))) {
      input = API_HOST + input;
    } else if (input && input.url && input.url.startsWith('/api/')) {
      input = new Request(API_HOST + input.url, input);
    }
    return origFetch.call(window, input, init);
  };
})();
