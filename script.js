let currentNavDate = new Date(); // Global variable to track month

function changeMonth(val) {
    currentNavDate.setMonth(currentNavDate.getMonth() + val);
    renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById('calGrid');
    grid.querySelectorAll('.cal-date').forEach(el => el.remove());
    
    const year = currentNavDate.getFullYear();
    const month = currentNavDate.getMonth();
    
    document.getElementById('monthDisplay').innerText = currentNavDate.toLocaleString('default', { month: 'long' });
    document.getElementById('yearDisplay').innerText = year;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Get Events from Storage
    const savedEvents = JSON.parse(localStorage.getItem('cal_events') || "[]");

    for (let i = 0; i < firstDay; i++) {
        grid.innerHTML += `<div class="cal-date" style="border:none"></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const hasEvent = savedEvents.some(e => e.date === dateString);
        
        const isToday = (d === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()) ? 'today' : '';
        
        const eventDot = hasEvent ? `<div class="event-dot"></div>` : '';
        
        grid.innerHTML += `
            <div class="cal-date ${isToday}" onclick="showDayEvents('${dateString}')">
                ${d} ${eventDot}
            </div>`;
    }
}

function addEvent() {
    const title = document.getElementById('eventTitle').value;
    const date = document.getElementById('eventDate').value; // Format: YYYY-MM-DD
    
    if(!title || !date) return alert("Kripya Title aur Date bharein!");

    let events = JSON.parse(localStorage.getItem('cal_events') || "[]");
    events.push({ title, date });
    localStorage.setItem('cal_events', JSON.stringify(events));
    
    document.getElementById('eventTitle').value = "";
    document.getElementById('eventStatus').innerText = "Event Saved Successfully!";
    renderCalendar(); // Refresh calendar to show dot
}

function showDayEvents(dateStr) {
    const events = JSON.parse(localStorage.getItem('cal_events') || "[]");
    const dayEvents = events.filter(e => e.date === dateStr);
    
    if(dayEvents.length > 0) {
        alert(`Events on ${dateStr}:\n` + dayEvents.map(e => "- " + e.title).join("\n"));
    } else {
        alert("Is din koi event nahi hai.");
    }
}
