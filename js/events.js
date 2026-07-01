/* ============================================================
   AI Solutions — Events Page
   ============================================================ */

(function () {
  'use strict';

  const VENUES = [
    {
      id: 'hq',
      name: 'AI Solutions HQ',
      address: 'Wearside Innovation Hub, Sunderland SR1 3DR',
      lat: 54.9078,
      lng: -1.3835,
      description: 'Our headquarters — home to workshops, demos, and team-led training sessions.'
    },
    {
      id: 'newcastle',
      name: 'Newcastle Conference Centre',
      address: 'Newcastle upon Tyne, NE1 4AD',
      lat: 54.9783,
      lng: -1.6178,
      description: 'Regional venue for seminars, roundtables, and enterprise training programmes.'
    },
    {
      id: 'ngc',
      name: 'National Glass Centre',
      address: 'Liberty Way, Sunderland SR6 0GL',
      lat: 54.9142,
      lng: -1.3654,
      description: 'Flagship venue for conferences, product launches, and the North East AI & Tech Summit.'
    }
  ];

  // Fetch events from database
  function loadEventsFromDatabase() {
    fetch('/api/events')
      .then(function(response) {
        return response.json();
      })
      .then(function(events) {
        if (!Array.isArray(events)) events = [];
        events.sort(function(a, b) {
          return new Date(a.date) - new Date(b.date);
        });
        EVENTS = events;
        renderEventsGrid();
        renderFeatured();
        renderVenues();
      })
      .catch(function(error) {
        console.error('API error, using hardcoded events:', error);
        EVENTS = [
    {
      id: 'intro-ai-dex',
      title: 'Introduction to AI for the Digital Workplace',
      type: 'Webinar',
      typeKey: 'webinar',
      category: 'business-webinars',
      date: '2026-06-20',
      time: '2:00 PM – 3:30 PM',
      duration: '90 min',
      location: 'Online (Zoom)',
      locationType: 'online',
      description: 'A beginner-friendly webinar on how AI tools improve the digital employee experience, reduce friction, and support smarter day-to-day work.',
      highlights: ['AI basics for HR & IT teams', 'Cost-saving automation ideas', 'Live Q&A with AI Solutions experts'],
      tools: ['AI Solutions Assistant', 'Workflow Automation Platform'],
      speaker: 'Sarah Mitchell',
      seats: 48,
      seatsLeft: 12,
      status: 'upcoming',
      featured: true
    },
    {
      id: 'workflow-workshop',
      title: 'Workflow Automation Hands-On Workshop',
      type: 'Workshop',
      typeKey: 'workshop',
      category: 'technical-workshops',
      date: '2026-07-05',
      time: '10:00 AM – 1:00 PM',
      duration: '3 hours',
      location: 'AI Solutions HQ, Sunderland',
      locationType: 'in-person',
      venueId: 'hq',
      description: 'Build and deploy your first automated workflow using AI Solutions\'s automation platform — no coding required.',
      highlights: ['Hands-on workflow building', 'Deploy a live automation', 'Best practices for SMEs'],
      tools: ['Automation Builder', 'Integrations Hub'],
      speaker: 'Andrew Clarke',
      seats: 25,
      seatsLeft: 7,
      status: 'upcoming',
      featured: false
    },
    {
      id: 'va-live-demo',
      title: 'AI Virtual Assistant Demo Webinar',
      type: 'Live Demo',
      typeKey: 'demo',
      category: 'ai-product-demos',
      date: '2026-07-18',
      time: '4:00 PM – 5:00 PM',
      duration: '60 min',
      location: 'Online (Google Meet)',
      locationType: 'online',
      description: 'Watch our AI virtual assistant handle real employee and customer inquiries, bookings, and support requests in a live environment.',
      highlights: ['Live chatbot demo', 'Integration walkthrough', 'ROI discussion for support teams'],
      tools: ['AI Virtual Assistant', 'Chatbot Widget'],
      speaker: 'Emma Walsh',
      seats: 100,
      seatsLeft: 34,
      status: 'upcoming',
      featured: false
    },
    {
      id: 'digital-transformation',
      title: 'Digital Transformation Seminar for SMEs',
      type: 'Training',
      typeKey: 'training',
      category: 'training-sessions',
      date: '2026-08-02',
      time: '9:00 AM – 12:00 PM',
      duration: '3 hours',
      location: 'Newcastle Conference Centre',
      locationType: 'in-person',
      venueId: 'newcastle',
      description: 'A half-day seminar for SMEs looking to understand the roadmap for digital transformation and AI adoption in the UK.',
      highlights: ['Digital maturity assessment', 'AI adoption roadmap', 'Case studies from UK businesses'],
      tools: ['AI Readiness Checklist', 'Strategy Templates'],
      speaker: 'James Richardson',
      seats: 40,
      seatsLeft: 18,
      status: 'upcoming',
      featured: false
    },
    {
      id: 'ai-analytics-webinar',
      title: 'AI Analytics: Turning Data into Decisions',
      type: 'Webinar',
      typeKey: 'webinar',
      category: 'business-webinars',
      date: '2026-08-15',
      time: '3:00 PM – 4:30 PM',
      duration: '90 min',
      location: 'Online (Zoom)',
      locationType: 'online',
      description: 'Learn how to use AI-powered analytics dashboards to track KPIs, forecast trends, and make smarter business decisions.',
      highlights: ['Dashboard design tips', 'Predictive analytics intro', 'Data-to-action frameworks'],
      tools: ['AI Analytics Dashboard', 'Reporting Suite'],
      speaker: 'David Brooks',
      seats: 60,
      seatsLeft: 22,
      status: 'upcoming',
      featured: false
    },
    {
      id: 'uk-ai-summit',
      title: 'North East AI & Tech Summit 2026',
      type: 'Product Launch',
      typeKey: 'demo',
      category: 'product-launch',
      date: '2026-09-10',
      time: '9:00 AM – 6:00 PM',
      duration: 'Full day',
      location: 'National Glass Centre, Sunderland',
      locationType: 'in-person',
      venueId: 'ngc',
      description: 'The North East\'s premier AI and technology conference bringing together industry leaders, enterprises, and innovators.',
      highlights: ['Keynote sessions', 'Product launches', 'Networking with AI leaders'],
      tools: ['Full AI Solutions Product Suite'],
      speaker: 'AI Solutions Leadership Team',
      seats: 500,
      seatsLeft: 156,
      status: 'upcoming',
      featured: false
    }
    ];
        renderEventsGrid();
        renderFeatured();
        renderVenues();
      });
  }

  let EVENTS = [];

  // Load events on page load
  document.addEventListener('DOMContentLoaded', function() {
    loadEventsFromDatabase();
  });

  // Refresh events when page becomes visible
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      loadEventsFromDatabase();
    }
  });

  const CATEGORY_LABELS = {
    'all': 'All Events',
    'ai-product-demos': 'AI Product Demos',
    'technical-workshops': 'Technical Workshops',
    'business-webinars': 'Business Webinars',
    'training-sessions': 'Training Sessions',
    'product-launch': 'Product Launch Events'
  };

  const TYPE_COLORS = {
    Webinar: 'blue',
    Workshop: 'mediumpurple',
    'Live Demo': 'mediumseagreen',
    Training: 'darkorange',
    Conference: 'indigo',
    'Technology Showcase': 'teal',
    'Product Launch': 'crimson'
  };

  const STATUS_STYLES = {
    upcoming: { bg: 'white', color: 'darkslategray', label: 'Upcoming' },
    live: { bg: 'lightgreen', color: 'mediumseagreen', label: 'Live' },
    completed: { bg: 'whitesmoke', color: 'slategray', label: 'Completed' }
  };

  let activeCategory = 'all';
  let activeTypeFilter = 'all';
  let searchQuery = '';

  const gridEl = document.getElementById('eventsGrid');
  const searchEl = document.getElementById('eventSearch');
  const featuredCountdownEl = document.getElementById('featuredCountdown');
  const venuesGridEl = document.getElementById('venuesGrid');

  function osmEmbedUrl(lat, lng) {
    const d = 0.018;
    return 'https://www.openstreetmap.org/export/embed.html?bbox=' +
      (lng - d) + '%2C' + (lat - d) + '%2C' + (lng + d) + '%2C' + (lat + d) +
      '&layer=mapnik&marker=' + lat + '%2C' + lng;
  }

  function googleMapsUrl(lat, lng, label) {
    const q = label ? encodeURIComponent(label) : lat + ',' + lng;
    return 'https://www.google.com/maps/search/?api=1&query=' + q;
  }

  function registerUrl(eventId) {
    return eventId ? 'register.html?event=' + encodeURIComponent(eventId) : 'register.html';
  }

  function formatDate(iso) {
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatShortDate(iso) {
    const d = new Date(iso + 'T12:00:00');
    return { day: d.getDate(), month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() };
  }

  function getTypeKey(eventType) {
    if (!eventType) return 'all';
    const typeMap = {
      'Webinar': 'webinar',
      'Workshop': 'workshop',
      'Live Demo': 'demo',
      'Training': 'training',
      'Conference': 'conference',
      'Technology Showcase': 'showcase',
      'Product Launch': 'launch'
    };
    return typeMap[eventType] || eventType.toLowerCase().replace(/\s+/g, '-');
  }

  function getFilteredEvents() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const filtered = EVENTS.filter(function (ev) {
      // Hide past events
      const eventDate = new Date(ev.date + 'T12:00:00');
      eventDate.setHours(0, 0, 0, 0);
      if (eventDate < now) return false;

      // Handle missing category/typeKey for admin-added events
      if (activeCategory !== 'all' && ev.category && ev.category !== activeCategory) return false;
      
      // For filtering, check either typeKey (hardcoded events) or derived key from type (admin-added events)
      const filterKey = ev.typeKey || getTypeKey(ev.type);
      if (activeTypeFilter !== 'all' && filterKey !== activeTypeFilter) return false;
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const hay = (ev.title + ' ' + (ev.description || '') + ' ' + ev.type + ' ' + (ev.speaker || '')).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    
    // Sort by date (earliest first)
    filtered.sort(function (a, b) {
      return new Date(a.date) - new Date(b.date);
    });
    
    return filtered;
  }

  function renderEventCard(ev) {
    const sd = formatShortDate(ev.date);
    const st = STATUS_STYLES[ev.status] || STATUS_STYLES.upcoming;
    const color = TYPE_COLORS[ev.type] || 'blue';
    
    // Handle missing fields gracefully for admin-added events
    const totalSeats = ev.total_seats || ev.capacity || ev.seats || 0;
    const availableSeats = ev.available_seats !== undefined ? ev.available_seats : (ev.seatsLeft !== undefined ? ev.seatsLeft : totalSeats);
    const highlights = ev.highlights || [];
    const tools = ev.tools || [];
    const duration = ev.duration || '';
    const locationType = ev.locationType || (ev.location && ev.location.toLowerCase().includes('online') ? 'online' : 'in-person');
    
    // Check if event date has passed
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const eventDate = new Date(ev.date + 'T12:00:00');
    eventDate.setHours(0, 0, 0, 0);
    const isPastEvent = eventDate < now;
    
    const seatsWarn = availableSeats > 0
      ? (availableSeats <= 15
        ? '<p class="mb-3" style="font-size:.78rem;color:crimson;"><i class="bi bi-exclamation-circle"></i> Only ' + availableSeats + ' seats left</p>'
        : '<p class="mb-3" style="font-size:.78rem;color:slategray;"><i class="bi bi-people"></i> ' + availableSeats + ' seats available</p>')
      : (totalSeats > 0 ? '<p class="mb-3" style="font-size:.78rem;color:crimson;"><i class="bi bi-x-circle"></i> Fully booked</p>' : '');

    const venue = ev.venueId ? VENUES.find(function (v) { return v.id === ev.venueId; }) : null;
    const mapLink = venue
      ? '<a href="' + googleMapsUrl(venue.lat, venue.lng, venue.address) + '" class="venue-link d-inline-block mb-3" target="_blank" rel="noopener noreferrer">' +
        '<i class="bi bi-map me-1"></i>View venue on map</a>'
      : (locationType === 'online'
        ? '<p class="mb-3" style="font-size:.78rem;color:slategray;"><i class="bi bi-globe2"></i> Join online from anywhere</p>'
        : '');

    const highlightsHtml = highlights.length > 0
      ? '<ul class="list-unstyled mb-3" style="font-size:.8rem;color:slategray;">' +
        highlights.map(function (h) { return '<li class="mb-1"><i class="bi bi-check2" style="color:blue;"></i> ' + h + '</li>'; }).join('') +
        '</ul>'
      : '';

    const toolsHtml = tools.length > 0
      ? '<p class="mb-1" style="font-size:.78rem;color:slategray;"><strong>Tools:</strong> ' + tools.join(', ') + '</p>'
      : '';

    const speakerHtml = ev.speaker
      ? '<p class="mb-3" style="font-size:.78rem;color:slategray;"><strong>Presenter:</strong> ' + ev.speaker + '</p>'
      : '';
    
    const seatsHtml = totalSeats > 0
      ? '<p class="mb-1" style="font-size:.78rem;color:slategray;"><i class="bi bi-chair"></i> <strong>Total Seats:</strong> ' + totalSeats + ' | <strong>Available:</strong> ' + availableSeats + '</p>'
      : '';

    // Create register button with conditional styling for past events
    const registerButtonHtml = isPastEvent
      ? '<button type="button" class="btn" style="background-color: white; color: slategray; border: 1px solid lightgray; cursor: not-allowed; opacity: 0.6;" disabled>Event Passed</button>'
      : '<a href="' + registerUrl(ev.id) + '" class="btn btn-indigo">Register</a>';

    return (
      '<div class="col-md-6 col-xl-4 event-card-item" data-id="' + ev.id + '">' +
        '<article class="event-card h-100 rounded-4 border overflow-hidden bg-white">' +
          '<div class="event-card-header px-4 py-3 d-flex align-items-center justify-content-between gap-2" style="background:' + color + ';">' +
            '<div class="d-flex align-items-center gap-3 text-white">' +
              '<div class="text-center"><div class="fw-bold" style="font-size:1.75rem;line-height:1;">' + sd.day + '</div>' +
              '<div style="font-size:.7rem;letter-spacing:.08em;">' + sd.month + '</div></div>' +
              '<span class="badge rounded-pill event-type-badge" style="font-size:.72rem;">' + ev.type + '</span>' +
            '</div>' +
            '<span class="badge rounded-pill event-status-badge' + (ev.status === 'upcoming' ? ' event-status-upcoming' : '') + '" style="font-size:.68rem;' +
              (ev.status !== 'upcoming' ? 'background:' + st.bg + ';color:' + st.color + ';' : '') + '">' + st.label + '</span>' +
          '</div>' +
          '<div class="p-4 d-flex flex-column h-100">' +
            '<h3 class="fw-bold mb-2" style="color:darkslategray;font-size:1.05rem;">' + ev.title + '</h3>' +
            '<p class="text-muted mb-3 flex-grow-1" style="font-size:.88rem;line-height:1.65;">' + (ev.description || '') + '</p>' +
            highlightsHtml +
            toolsHtml +
            seatsHtml +
            speakerHtml +
            '<div class="d-flex flex-wrap gap-2 text-muted mb-2" style="font-size:.82rem;">' +
              '<span><i class="bi bi-calendar3"></i> ' + formatDate(ev.date) + '</span>' +
              '<span><i class="bi bi-clock"></i> ' + (ev.time || '') + '</span>' +
            '</div>' +
            (duration ? '<div class="d-flex flex-wrap gap-2 text-muted mb-2" style="font-size:.82rem;">' +
              '<span><i class="bi bi-hourglass-split"></i> ' + duration + '</span>' +
              '<span><i class="bi bi-' + (locationType === 'online' ? 'camera-video' : 'geo-alt') + '"></i> ' + ev.location + '</span>' +
            '</div>' : '<div class="d-flex flex-wrap gap-2 text-muted mb-2" style="font-size:.82rem;">' +
              '<span><i class="bi bi-' + (locationType === 'online' ? 'camera-video' : 'geo-alt') + '"></i> ' + ev.location + '</span>' +
            '</div>') +
            seatsWarn +
            mapLink +
            '<div class="mt-auto pt-2">' +
              registerButtonHtml +
            '</div>' +
          '</div>' +
        '</article>' +
      '</div>'
    );
  }

  function renderEventsGrid() {
    if (!gridEl) return;
    const list = getFilteredEvents();
    if (!list.length) {
      gridEl.innerHTML = '<div class="col-12 text-center py-5 text-muted">No events match your filters. Try adjusting search or category.</div>';
      return;
    }
    gridEl.innerHTML = list.map(renderEventCard).join('');
  }

  function renderFeatured() {
    let eventOfMonthId = localStorage.getItem('eventOfMonth');
    let featured = null;
    
    if (eventOfMonthId) {
      featured = EVENTS.find(function (e) { return e.id === eventOfMonthId; });
    }
    
    // Get the featured section element
    const allFeaturedSections = Array.from(document.querySelectorAll('section')).filter(function(s) {
      return s.textContent.includes('Featured Event of the Month');
    });
    
    const titleEl = document.getElementById('featuredTitle');
    const metaEl = document.getElementById('featuredMeta');
    const descEl = document.getElementById('featuredDesc');
    const btnEl = document.getElementById('featuredRegisterBtn');
    const countdownEl = document.getElementById('featuredCountdown');
    
    // If no event of the month is selected, show placeholder message
    if (!featured) {
      if (titleEl) titleEl.textContent = 'No Feature Event This Month';
      if (metaEl) metaEl.textContent = '';
      if (descEl) descEl.textContent = '';
      if (btnEl) btnEl.style.display = 'none';
      if (countdownEl) countdownEl.innerHTML = '';
      return;
    }

    // Show button if we have a valid featured event
    if (btnEl) btnEl.style.display = 'inline-block';

    if (titleEl) titleEl.textContent = featured.title;
    if (metaEl) metaEl.textContent = formatDate(featured.date) + ' · ' + (featured.time || '') + ' · ' + featured.location;
    if (descEl) descEl.textContent = featured.description;
    if (btnEl) {
      btnEl.href = registerUrl(featured.id);
    }

    function updateCountdown() {
      if (!countdownEl) return;
      const target = new Date(featured.date + 'T14:00:00').getTime();
      const now = Date.now();
      let diff = Math.max(0, target - now);
      const days = Math.floor(diff / 86400000);
      diff -= days * 86400000;
      const hours = Math.floor(diff / 3600000);
      diff -= hours * 3600000;
      const mins = Math.floor(diff / 60000);
      countdownEl.innerHTML =
        '<div class="countdown-unit"><span>' + days + '</span><small>Days</small></div>' +
        '<div class="countdown-unit"><span>' + hours + '</span><small>Hours</small></div>' +
        '<div class="countdown-unit"><span>' + mins + '</span><small>Mins</small></div>';
    }
    updateCountdown();
    setInterval(updateCountdown, 60000);
  }

  function renderVenues() {
    if (!venuesGridEl) return;
    venuesGridEl.innerHTML = VENUES.map(function (v) {
      return (
        '<div class="col-md-4">' +
          '<article class="venue-card">' +
            '<div class="venue-map">' +
              '<iframe src="' + osmEmbedUrl(v.lat, v.lng) + '" loading="lazy" title="Map: ' + v.name + '" referrerpolicy="no-referrer-when-downgrade"></iframe>' +
            '</div>' +
            '<div class="p-4">' +
              '<h3 class="fw-bold mb-1" style="color:darkslategray;font-size:1rem;">' + v.name + '</h3>' +
              '<p class="text-muted mb-2" style="font-size:.82rem;"><i class="bi bi-geo-alt me-1"></i>' + v.address + '</p>' +
              '<p class="text-muted mb-3" style="font-size:.85rem;line-height:1.6;">' + v.description + '</p>' +
              '<a href="' + googleMapsUrl(v.lat, v.lng, v.address) + '" class="venue-link" target="_blank" rel="noopener noreferrer">' +
                '<i class="bi bi-signpost-2 me-1"></i>Get directions</a>' +
            '</div>' +
          '</article>' +
        '</div>'
      );
    }).join('');
  }



  /* Category & type filters */
  document.querySelectorAll('[data-category]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('[data-category]').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      activeCategory = btn.getAttribute('data-category');
      renderEventsGrid();
    });
  });

  document.querySelectorAll('[data-type-filter]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('[data-type-filter]').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      activeTypeFilter = btn.getAttribute('data-type-filter');
      renderEventsGrid();
    });
  });

  if (searchEl) {
    searchEl.addEventListener('input', function () {
      searchQuery = searchEl.value.trim();
      renderEventsGrid();
    });
  }

})();
