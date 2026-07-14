/* ============================================================
   AI Solutions — Homepage AI Chatbot (index.html only)
   ✅ Uses REAL Google Gemini AI via backend server at localhost:5000
   ============================================================ */

(function () {
  'use strict';

  const wrap       = document.getElementById('aiChatbotWrap');
  const panel      = document.getElementById('aiChatbotPanel');
  const fab        = document.getElementById('chatbotFab');
  const hint       = document.getElementById('chatbotHint');
  const hintClose  = document.getElementById('chatbotHintClose');
  const messagesEl = document.getElementById('chatbotMessages');
  const form       = document.getElementById('chatbotForm');
  const input      = document.getElementById('chatbotInput');
  const sendBtn    = document.getElementById('chatbotSend');
  const quickEl    = document.getElementById('chatbotQuick');

  const HINT_STORAGE_KEY = 'aiSolutionsHiBubbleDismissed';
  const CONVERSATION_ID = 'homepage_widget';

  if (!wrap || !panel || !fab || !messagesEl) return;

  let isTyping = false;
  let chatOpen = false;
  let welcomeShown = false;

  /**
   * Try sending message to a given backend URL
   */
  async function tryBackend(url, userMessage) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        conversation_id: CONVERSATION_ID
      })
    });
    if (!response.ok) {
      console.warn('Backend returned status', response.status, 'from', url);
    }
    let data;
    try {
      data = await response.json();
    } catch (e) {
      const text = await response.text().catch(() => '');
      console.warn('Backend non-JSON response from', url, ':', text.slice(0, 200));
      return null;
    }
    if (data.success && data.response) return data.response;
    console.warn('Backend unexpected response from', url, ':', JSON.stringify(data).slice(0, 200));
    return null;
  }

  /**
   * Send message to AI backend (tries same origin, then Node.js on 5500)
   */
  async function sendToAI(userMessage) {
    const backends = [
      '/api/chat/',
      'http://localhost:5500/api/chat',
    ];
    for (const url of backends) {
      try {
        const result = await tryBackend(url, userMessage);
        if (result) return result;
      } catch (e) {
        console.warn('Backend unreachable:', url, e.message);
      }
    }
    console.error('All AI backends failed — see warnings above for details');
    return 'Sorry, the AI service is temporarily unavailable. Please try again later.';
  }

  // === Hint Management ===

  function isHintDismissed() {
    return hint && (hint.classList.contains('ai-chatbot-hint--dismissed') ||
      sessionStorage.getItem(HINT_STORAGE_KEY) === '1');
  }

  function dismissHint(persist) {
    if (!hint) return;
    hideHintVisual();
    if (persist) {
      hint.classList.add('ai-chatbot-hint--dismissed');
      try {
        sessionStorage.setItem(HINT_STORAGE_KEY, '1');
      } catch (e) { /* ignore */ }
    }
  }

  function showHint() {
    if (!hint || isHintDismissed() || chatOpen) return;
    hint.classList.add('ai-chatbot-hint--visible');
    hint.setAttribute('aria-hidden', 'false');
    wrap.classList.add('ai-chatbot-wrap--hint');
  }

  function hideHintVisual() {
    if (!hint) return;
    hint.classList.remove('ai-chatbot-hint--visible');
    hint.setAttribute('aria-hidden', 'true');
    wrap.classList.remove('ai-chatbot-wrap--hint');
  }

  function scheduleHint() {
    setTimeout(showHint, 2000);
  }

  if (hint && sessionStorage.getItem(HINT_STORAGE_KEY) === '1') {
    hint.classList.add('ai-chatbot-hint--dismissed');
  } else {
    if (document.readyState === 'complete') {
      scheduleHint();
    } else {
      window.addEventListener('load', scheduleHint);
    }
  }

  // === Chat UI Functions ===

  function isOpen() {
    return chatOpen;
  }

  function toggleOpen() {
    if (isOpen()) {
      close();
    } else {
      open();
    }
  }

  function open() {
    if (isOpen() || !wrap) return;
    chatOpen = true;
    wrap.classList.add('ai-chatbot-wrap--open');
    panel.setAttribute('aria-hidden', 'false');
    dismissHint(false);
    showWelcome();
    if (input) input.focus();
  }

  function close() {
    if (!isOpen() || !wrap) return;
    chatOpen = false;
    wrap.classList.remove('ai-chatbot-wrap--open');
    panel.setAttribute('aria-hidden', 'true');
  }

  /**
   * Display message in chat
   */
  function addMessage(text, isBot) {
    const msg = document.createElement('div');
    msg.className = 'ai-chatbot__msg ' + (isBot ? 'ai-chatbot__msg--bot' : 'ai-chatbot__msg--user');
    msg.textContent = text;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  /**
   * Show typing indicator
   */
  function showTyping() {
    const typing = document.createElement('div');
    typing.className = 'ai-chatbot__msg ai-chatbot__msg--typing';
    typing.innerHTML = '<div class="ai-chatbot__typing-dots"><span></span><span></span><span></span></div>';
    typing.id = 'chatbot-typing';
    messagesEl.appendChild(typing);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  /**
   * Hide typing indicator
   */
  function hideTyping() {
    const typing = document.getElementById('chatbot-typing');
    if (typing) typing.remove();
  }

  /**
   * Show welcome message
   */
  function showWelcome() {
    if (welcomeShown || messagesEl.children.length > 0) return;
    welcomeShown = true;
    addMessage('Hello! I\'m the AI-powered assistant for AI Solutions. Ask me anything about our services, pricing, demos, or events – I\'ll respond like a real AI chatbot.', true);
  }

  /**
   * Handle form submission
   */
  async function handleSubmit(e) {
    e.preventDefault();
    const message = input.value.trim();
    if (!message || isTyping) return;

    // Show user message
    addMessage(message, false);
    input.value = '';
    isTyping = true;
    if (sendBtn) sendBtn.disabled = true;
    if (input) input.disabled = true;

    // Show AI is thinking
    showTyping();

    // Get real AI response
    const response = await sendToAI(message);

    // Hide typing, show response
    hideTyping();
    addMessage(response, true);
    
    isTyping = false;
    if (sendBtn) sendBtn.disabled = false;
    if (input) input.disabled = false;
    if (input) input.focus();
  }

  // === Event Listeners ===

  if (fab) {
    fab.addEventListener('click', toggleOpen);
  }

  if (hintClose) {
    hintClose.addEventListener('click', function(e) {
      e.stopPropagation();
      dismissHint(true);
    });
  }

  if (form) {
    form.addEventListener('submit', handleSubmit);
  }

  // Quick button support
  if (quickEl) {
    quickEl.addEventListener('click', function(e) {
      const chip = e.target.closest('[data-prompt]');
      if (!chip) return;
      const prompt = chip.getAttribute('data-prompt');
      if (prompt) {
        input.value = prompt;
        form.dispatchEvent(new Event('submit'));
      }
    });
  }

  // Escape key to close
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isOpen()) {
      close();
    }
  });

  // Show welcome when opening
  if (wrap) {
    wrap.addEventListener('click', function() {
      if (isOpen()) showWelcome();
    });
  }

})();
