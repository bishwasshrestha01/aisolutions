/* ============================================================
   AI Solutions — Event Registration Page
   ============================================================ */

(function () {
  'use strict';

  let UPCOMING_EVENTS = [];

  function loadEventsFromDatabase() {
    // Fetch events from database via API
    fetch('/api/events')
      .then(function(response) {
        return response.json();
      })
      .then(function(events) {
        if (!Array.isArray(events)) {
          events = [];
        }
        
        // Filter to only show upcoming events
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        UPCOMING_EVENTS = events.filter(function(e) {
          const eventDate = new Date(e.date + 'T12:00:00');
          eventDate.setHours(0, 0, 0, 0);
          return eventDate >= now;
        });
        
        // Sort by date (earliest first)
        UPCOMING_EVENTS.sort(function(a, b) {
          return new Date(a.date) - new Date(b.date);
        });
        
        // Populate the dropdown
        populateEventSelect();
      })
      .catch(function(error) {
        console.error('Error loading events:', error);
        UPCOMING_EVENTS = [];
        populateEventSelect();
      });
  }

  // Load events when page loads
  loadEventsFromDatabase();

  const formEl = document.getElementById('registrationForm');
  const eventSelectEl = document.getElementById('regEvent');
  const formSuccessEl = document.getElementById('formSuccess');

  function formatDate(iso) {
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function getEventIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('event') || '';
  }

  function populateEventSelect() {
    if (!eventSelectEl) return;
    
    if (UPCOMING_EVENTS.length === 0) {
      eventSelectEl.innerHTML = '<option value="">No upcoming events available</option>';
      return;
    }
    
    eventSelectEl.innerHTML = '<option value="">Select an event</option>' +
      UPCOMING_EVENTS.map(function (e) {
        return '<option value="' + e.id + '">' + e.title + ' — ' + formatDate(e.date) + '</option>';
      }).join('');

    document.getElementById('regName').addEventListener('input', function () {
      document.getElementById('regNameError').classList.add('d-none');
    });
    document.getElementById('regEmail').addEventListener('input', function () {
      document.getElementById('regEmailError').classList.add('d-none');
    });
    document.getElementById('regPhone').addEventListener('input', function () {
      document.getElementById('regPhoneError').classList.add('d-none');
    });
    // Country dropdown selection
    document.getElementById('regPhoneCountryList').addEventListener('click', function (e) {
      var item = e.target.closest('.dropdown-item');
      if (item) {
        e.preventDefault();
        var code = item.getAttribute('data-code');
        document.getElementById('regPhoneCode').value = code;
        document.getElementById('regPhoneDropdownText').textContent = code;
        document.getElementById('regPhoneError').classList.add('d-none');
      }
    });
    // Country dropdown selection
    document.getElementById('regCountrySelect').addEventListener('hide.bs.dropdown', function (e) {
      if (e.clickEvent) {
        var item = e.clickEvent.target.closest('.dropdown-item');
        if (item) {
          document.getElementById('regCountry').value = item.textContent.trim();
          document.getElementById('regCountryText').textContent = item.textContent.trim();
        }
      }
    });
    document.getElementById('regEvent').addEventListener('change', function () {
      document.getElementById('regEventError').classList.add('d-none');
    });
    document.getElementById('regAgreeContact').addEventListener('change', function () {
      document.getElementById('regAgreeError').classList.add('d-none');
    });
    const preselect = getEventIdFromUrl();
    if (preselect) eventSelectEl.value = preselect;
  }

  if (formEl) {
    formEl.addEventListener('submit', function (e) {
      e.preventDefault();
      
      // Validate all required fields
      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      var phone = document.getElementById('regPhoneCode').value + ' ' + document.getElementById('regPhone').value.trim();
      var phoneInput = document.getElementById('regPhone').value.trim();
      const country = document.getElementById('regCountry').value;
      const event = document.getElementById('regEvent').value.trim();
      const wantsUpdates = document.getElementById('regUpdates').checked;
      
      // Hide all inline errors
      var allErrors = ['regNameError','regEmailError','regPhoneError','regCountryError','regEventError','regAgreeError'];
      allErrors.forEach(function(id) {
        document.getElementById(id).classList.add('d-none');
      });

      var hasError = false;
      if (!name) { document.getElementById('regNameError').classList.remove('d-none'); hasError = true; }
      if (!email) { document.getElementById('regEmailError').classList.remove('d-none'); hasError = true; }
      if (!phoneInput) { document.getElementById('regPhoneError').classList.remove('d-none'); hasError = true; }
      if (!country) { document.getElementById('regCountryError').classList.remove('d-none'); hasError = true; }
      if (!event) { document.getElementById('regEventError').classList.remove('d-none'); hasError = true; }

      if (hasError) return;
      
      // Validate email domain (allowed: gmail, yahoo, outlook, hotmail, icloud, any .edu)
      var allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
      var emailParts = email.split('@');
      var domain = emailParts.length === 2 ? emailParts[1].toLowerCase() : '';
      var isEdu = /\.edu$/.test(domain);
      var emailError = document.getElementById('regEmailError');
      if (!domain || (!isEdu && allowedDomains.indexOf(domain) === -1)) {
        emailError.classList.remove('d-none');
        return;
      }
      emailError.classList.add('d-none');
      
      // Validate phone (digits only)
      var phoneRegex = /^\d+$/;
      var phoneError = document.getElementById('regPhoneError');
      if (!phoneRegex.test(phoneInput)) {
        phoneError.classList.remove('d-none');
        return;
      }
      phoneError.classList.add('d-none');
      
      // Validate agree to be contacted
      var agreeChecked = document.getElementById('regAgreeContact').checked;
      var agreeError = document.getElementById('regAgreeError');
      if (!agreeChecked) {
        agreeError.classList.remove('d-none');
        return;
      }
      agreeError.classList.add('d-none');
      
      // Get event title for display
      const selectedEventOption = document.getElementById('regEvent').options[document.getElementById('regEvent').selectedIndex];
      const eventTitle = selectedEventOption ? selectedEventOption.text : '';
      
      // Prepare data for API with ALL form fields
      const registrationData = {
        event_id: event,
        event_title: eventTitle,
        user_email: email,
        full_name: name,
        phone: phone,
        country: country,
        wants_updates: wantsUpdates
      };
      
      console.log('Registering with data:', registrationData);
      
      // Save to database via API
      fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registrationData)
      })
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        console.log('Registration response:', data);
        if (data.success || data.id) {
          sessionStorage.setItem('regId', data.id || '');
          sessionStorage.setItem('regEvent', eventTitle);
          sessionStorage.setItem('regName', name);
          sessionStorage.setItem('regEmail', email);
          sessionStorage.setItem('regPhone', phone);
          sessionStorage.setItem('regCountry', country);
          window.location.href = 'confirmation.html?type=registration';
        } else {
          showMessage('Error registering: ' + (data.error || 'Unknown error'), 'danger');
        }
      })
      .catch(function(error) {
        console.error('Error:', error);
        alert('Error registering. Please try again.');
      });
    });
  }

  populateEventSelect();
})();
