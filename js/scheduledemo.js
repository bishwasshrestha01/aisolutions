/* ============================================================
   AI Solutions — Schedule Demo
   ============================================================ */

(function () {
  'use strict';

  const STORAGE_KEY = 'aiSolutionsDemoBooking';
  const COMPANY_EMAIL = 'support@aisolutions.com';

  const SERVICE_LABELS = {
    'ai-virtual-assistant': 'AI Virtual Assistant Development',
    'chatbot-integration': 'Chatbot Integration',
    'business-automation': 'Business Automation Tools',
    'software-prototyping': 'Software Prototyping',
    'custom-ai-solution': 'Custom AI Solutions',
    'customer-support': 'Customer Support Solutions'
  };

  let formEl = null;

  function generateBookingId() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return 'DEMO-' + date + '-' + rand;
  }

  function formatDisplayDateTime(isoLocal) {
    if (!isoLocal) return '—';
    const d = new Date(isoLocal);
    if (Number.isNaN(d.getTime())) return isoLocal;
    return d.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function toGoogleCalendarDates(isoLocal) {
    const start = new Date(isoLocal);
    const end = new Date(start.getTime() + 45 * 60 * 1000);
    const fmt = function (d) {
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    return fmt(start) + '/' + fmt(end);
  }

  function buildGoogleCalendarUrl(booking) {
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: 'AI Solutions Demo — ' + booking.service,
      dates: toGoogleCalendarDates(booking.preferredDateTime),
      details: [
        'Booking ID: ' + booking.id,
        'Name: ' + booking.fullName,
        'Email: ' + booking.email,
        'Phone: ' + booking.phone,
        'Country: ' + booking.country,
        'Service: ' + booking.service,
        booking.message ? 'Message: ' + booking.message : ''
      ].filter(Boolean).join('\n'),
      location: 'Online — AI Solutions',
      ctz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kathmandu'
    });
    return 'https://calendar.google.com/calendar/render?' + params.toString();
  }

  function buildIcsContent(booking) {
    const start = new Date(booking.preferredDateTime);
    const end = new Date(start.getTime() + 45 * 60 * 1000);
    const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const dt = function (d) {
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    const desc = [
      'Booking ID: ' + booking.id,
      'Service: ' + booking.service,
      'Contact: ' + booking.fullName + ' (' + booking.email + ')'
    ].join('\\n');

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AI Solutions//Schedule Demo//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:' + booking.id + '@aisolutions.com',
      'DTSTAMP:' + stamp,
      'DTSTART:' + dt(start),
      'DTEND:' + dt(end),
      'SUMMARY:AI Solutions Demo — ' + booking.service,
      'DESCRIPTION:' + desc,
      'LOCATION:Online — AI Solutions',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  }

  function sendConfirmationEmail(booking) {
    const subject = encodeURIComponent('Demo Confirmation — ' + booking.id);
    const body = encodeURIComponent(
      'Hi ' + booking.fullName + ',\n\n' +
      'Thank you for scheduling a demo with AI Solutions.\n\n' +
      'BOOKING DETAILS\n' +
      '────────────────\n' +
      'Reference: ' + booking.id + '\n' +
      'Service: ' + booking.service + '\n' +
      'Preferred time: ' + booking.preferredDateTimeDisplay + '\n' +
      'Country: ' + booking.country + '\n\n' +
      (booking.message ? 'Your Message:\n' + booking.message + '\n\n' : '') +
      'Our team will contact you shortly to confirm your session.\n\n' +
      '— AI Solutions\n' +
      'support@aisolutions.com | +44 191 555 0140'
    );

    const mailtoUser = 'mailto:' + encodeURIComponent(booking.email) +
      '?subject=' + subject + '&body=' + body;

    const notifyCompany = 'mailto:' + encodeURIComponent(COMPANY_EMAIL) +
      '?subject=' + encodeURIComponent('New Demo Request — ' + booking.id) +
      '&body=' + encodeURIComponent(
        'New demo booking received.\n\n' +
        'Reference: ' + booking.id + '\n' +
        'Name: ' + booking.fullName + '\n' +
        'Email: ' + booking.email + '\n' +
        'Phone: ' + booking.phone + '\n' +
        'Country: ' + booking.country + '\n' +
        'Service: ' + booking.service + '\n' +
        'Preferred: ' + booking.preferredDateTimeDisplay + '\n' +
        (booking.message ? 'Message: ' + booking.message : '')
      );

    try {
      window.open(notifyCompany, '_blank');
      setTimeout(function () {
        window.open(mailtoUser, '_blank');
      }, 400);
    } catch (_) {
      /* mailto may be blocked; thank-you page still shows confirmation */
    }
  }

  function collectBooking(form) {
    const serviceKey = form.service.value;
    const preferred = form.preferredDateTime.value;
    const phoneCode = document.getElementById('demoPhoneCode').value;
    return {
      id: generateBookingId(),
      fullName: form.fullName.value.trim(),
      email: form.email.value.trim(),
      phone: phoneCode + ' ' + form.phone.value.trim(),
      country: document.getElementById('demoCountryText').textContent,
      service: SERVICE_LABELS[serviceKey] || serviceKey,
      serviceKey: serviceKey,
      preferredDateTime: preferred,
      preferredDateTimeDisplay: formatDisplayDateTime(preferred),
      message: form.message.value.trim(),
      agreedContact: form.agreeContact.checked,
      submittedAt: new Date().toISOString(),
      calendarUrl: '',
      icsContent: ''
    };
  }

  // Initialize form when DOM is ready
  function initializeForm() {
    formEl = document.getElementById('scheduleDemoForm');
    
    if (!formEl) {
      console.error('Schedule demo form not found');
      return;
    }

    const dateTimeEl = document.getElementById('demoDateTime');
    if (dateTimeEl) {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      dateTimeEl.min = now.toISOString().slice(0, 16);
    }

    // Pre-fill service from URL param (set by services.html links)
    var serviceMatch = window.location.search.match(/[?&]service=([^&]+)/);
    var serviceVal = serviceMatch ? decodeURIComponent(serviceMatch[1]) : sessionStorage.getItem('pendingDemoService');
    
    if (serviceVal) {
      sessionStorage.removeItem('pendingDemoService');
      var serviceSelect = document.getElementById('demoService');
      
      if (serviceSelect) {
        console.log('Service value from URL/session:', serviceVal);
        console.log('Available options:', Array.from(serviceSelect.options).map(function(opt) { return opt.value; }));
        
        // Try to set the value directly
        serviceSelect.value = serviceVal;
        console.log('After setting value, selected value is:', serviceSelect.value);
        
        // Force a change event to ensure UI updates
        var event = new Event('change', { bubbles: true });
        serviceSelect.dispatchEvent(event);
      }
    }

    document.getElementById('demoEmail').addEventListener('input', function () {
      document.getElementById('demoEmailError').classList.add('d-none');
    });
    document.getElementById('demoMessage').addEventListener('input', function () {
      document.getElementById('demoMessageError').classList.add('d-none');
    });
    document.getElementById('demoPhone').addEventListener('input', function () {
      document.getElementById('demoPhoneError').classList.add('d-none');
    });
    // Country dropdown selection (actual country)
    document.getElementById('demoCountrySelect').addEventListener('hide.bs.dropdown', function (e) {
      if (e.clickEvent) {
        var item = e.clickEvent.target.closest('.dropdown-item');
        if (item) {
          document.getElementById('demoCountry').value = item.textContent.trim();
          document.getElementById('demoCountryText').textContent = item.textContent.trim();
        }
      }
    });
    // Country dropdown selection (phone code)
    document.getElementById('demoPhoneCountryList').addEventListener('click', function (e) {
      var item = e.target.closest('.dropdown-item');
      if (item) {
        e.preventDefault();
        var code = item.getAttribute('data-code');
        document.getElementById('demoPhoneCode').value = code;
        document.getElementById('demoPhoneDropdownText').textContent = code;
        document.getElementById('demoPhoneError').classList.add('d-none');
      }
    });
    formEl.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!formEl.checkValidity()) {
        formEl.classList.add('was-validated');
        return;
      }

      // Validate email domain (allowed: gmail, yahoo, outlook, hotmail, icloud, any .edu)
      var allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
      var emailVal = document.getElementById('demoEmail').value.trim();
      var emailParts = emailVal.split('@');
      var domain = emailParts.length === 2 ? emailParts[1].toLowerCase() : '';
      var isEdu = /\.edu$/.test(domain);
      var emailError = document.getElementById('demoEmailError');
      if (!domain || (!isEdu && allowedDomains.indexOf(domain) === -1)) {
        emailError.classList.remove('d-none');
        return;
      }
      emailError.classList.add('d-none');

      // Validate phone (digits only)
      var phoneInput = document.getElementById('demoPhone');
      var phoneVal = phoneInput.value.trim();
      var phoneCode = document.getElementById('demoPhoneCode').value;
      var phoneError = document.getElementById('demoPhoneError');
      var phoneRegex = /^\d+$/;
      if (!phoneRegex.test(phoneVal)) {
        phoneError.classList.remove('d-none');
        return;
      }
      phoneError.classList.add('d-none');

      const booking = collectBooking(formEl);
      booking.calendarUrl = buildGoogleCalendarUrl(booking);
      booking.icsContent = buildIcsContent(booking);

      // Save to sessionStorage for thank-you page
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
      
      // Save to database via API with ALL fields
      const demoRequest = {
        full_name: booking.fullName,
        email: booking.email,
        phone: booking.phone,
        country: booking.country,
        service: booking.service,
        preferred_date: booking.preferredDateTime,
        message: booking.message,
        agreed_contact: booking.agreedContact
      };
      
      console.log('Saving demo request:', demoRequest);
      
      fetch('/api/demo-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(demoRequest)
      })
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        console.log('Demo request saved:', data);
        window.location.href = 'confirmation.html';
      })
      .catch(function(error) {
        console.error('Error saving demo request:', error);
        window.location.href = 'confirmation.html';
      });
    });
  }

  // Ensure initialization on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeForm);
  } else {
    initializeForm();
  }

  /* Thank-you page - also wait for DOM to be ready */
  function initThankYouPageIfNeeded() {
    if (document.body.dataset.page === 'demo-thankyou') {
      initThankYouPage();
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThankYouPageIfNeeded);
  } else {
    initThankYouPageIfNeeded();
  }

  function initThankYouPage() {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.location.href = 'scheduledemo.html';
      return;
    }

    let booking;
    try {
      booking = JSON.parse(raw);
    } catch (_) {
      window.location.href = 'scheduledemo.html';
      return;
    }

    const fields = {
      bookingId: booking.id,
      fullName: booking.fullName,
      email: booking.email,
      phone: booking.phone,
      country: booking.country,
      service: booking.service,
      preferredDateTime: booking.preferredDateTimeDisplay,
      message: booking.message || '—',
      confirmEmail: booking.email
    };

    Object.keys(fields).forEach(function (key) {
      const el = document.getElementById('detail-' + key);
      if (el) el.textContent = fields[key];
    });

    const calendarBtn = document.getElementById('addToCalendarBtn');
    if (calendarBtn && booking.calendarUrl) {
      calendarBtn.href = booking.calendarUrl;
      calendarBtn.target = '_blank';
      calendarBtn.rel = 'noopener noreferrer';
    }

    const icsBtn = document.getElementById('downloadIcsBtn');
    if (icsBtn && booking.icsContent) {
      icsBtn.addEventListener('click', function () {
        const blob = new Blob([booking.icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = booking.id + '.ics';
        a.click();
        URL.revokeObjectURL(url);
      });
    }
  }
})();
