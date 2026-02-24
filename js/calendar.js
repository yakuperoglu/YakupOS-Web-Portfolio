/* ═══════════════════════════════════════════════
   CALENDAR.EXE — Calendar Application
   ═══════════════════════════════════════════════ */

(function () {
    'use strict';

    const calGrid = document.getElementById('cal-grid');
    const calMonthYear = document.getElementById('cal-month-year');
    const calPrev = document.getElementById('cal-prev');
    const calNext = document.getElementById('cal-next');
    const calTodayBtn = document.getElementById('cal-today-btn');
    const calEventsContainer = document.getElementById('cal-events');
    if (!calGrid) return;

    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    let currentMonth, currentYear, selectedDate;
    const today = new Date();

    // Sample events
    const events = {
        // Format: 'YYYY-MM-DD': [{time, title}]
    };

    // Generate some events dynamically
    (function generateEvents() {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();

        const sampleEvents = [
            { day: 5, time: '10:00', title: 'Team Standup' },
            { day: 10, time: '14:00', title: 'Code Review' },
            { day: 15, time: '09:30', title: 'Sprint Planning' },
            { day: 20, time: '11:00', title: 'Deploy v2.1' },
            { day: 25, time: '16:00', title: 'Mentoring Session' },
            { day: today.getDate(), time: '12:00', title: 'Lunch Break ☕' },
        ];

        sampleEvents.forEach(evt => {
            const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(evt.day).padStart(2, '0')}`;
            if (!events[key]) events[key] = [];
            events[key].push({ time: evt.time, title: evt.title });
        });
    })();

    function render() {
        calGrid.innerHTML = '';
        calMonthYear.textContent = `${MONTHS[currentMonth]} ${currentYear}`;

        // Day labels
        DAYS.forEach(d => {
            const label = document.createElement('div');
            label.className = 'cal-day-label';
            label.textContent = d;
            calGrid.appendChild(label);
        });

        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = document.createElement('div');
            day.className = 'cal-day other-month';
            day.textContent = daysInPrevMonth - i;
            calGrid.appendChild(day);
        }

        // Current month days
        for (let d = 1; d <= daysInMonth; d++) {
            const day = document.createElement('div');
            day.className = 'cal-day';
            day.textContent = d;

            const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

            if (d === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
                day.classList.add('today');
            }

            if (selectedDate && d === selectedDate.getDate() &&
                currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear()) {
                day.classList.add('selected');
            }

            if (events[dateKey]) {
                day.classList.add('has-event');
            }

            day.addEventListener('click', () => {
                selectedDate = new Date(currentYear, currentMonth, d);
                render();
                showEvents(dateKey, d);
            });

            calGrid.appendChild(day);
        }

        // Next month days (fill to 42 cells)
        const totalCells = firstDay + daysInMonth;
        const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let d = 1; d <= remaining; d++) {
            const day = document.createElement('div');
            day.className = 'cal-day other-month';
            day.textContent = d;
            calGrid.appendChild(day);
        }

        // Show events for selected or today
        if (selectedDate) {
            const key = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
            showEvents(key, selectedDate.getDate());
        } else {
            const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            showEvents(key, today.getDate());
        }
    }

    function showEvents(dateKey, dayNum) {
        if (!calEventsContainer) return;
        const evts = events[dateKey];

        let html = `<div class="cal-events-title">📅 ${MONTHS[currentMonth]} ${dayNum}</div>`;

        if (evts && evts.length) {
            evts.forEach(evt => {
                html += `<div class="cal-event-item">
                    <span class="cal-event-time">${evt.time}</span>
                    <span>${evt.title}</span>
                </div>`;
            });
        } else {
            html += '<div class="cal-no-events">No events scheduled</div>';
        }

        calEventsContainer.innerHTML = html;
    }

    calPrev.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        render();
    });

    calNext.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        render();
    });

    calTodayBtn.addEventListener('click', () => {
        currentMonth = today.getMonth();
        currentYear = today.getFullYear();
        selectedDate = null;
        render();
    });

    // Init
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();
    render();
})();
