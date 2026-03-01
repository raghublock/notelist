let currentNavDate = new Date(); // Mahina track karne ke liye

// --- Navigation ---
function openScreen(screenId, btn) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active-screen'));
    document.querySelectorAll('.nav-tabs button').forEach(b => b.classList.remove('active'));
    document.getElementById(screenId).classList.add('active-screen');
    btn.classList.add('active');
    if(screenId === 'calendar') renderCalendar();
}

// --- Notepad Logic ---
function setNoteColor(color) {
    document.getElementById('noteText').style.backgroundColor = color;
}

function saveNote() {
    const title = document.getElementById('noteTitle').value;
    const text = document.getElementById('noteText').value;
    const color = document.getElementById('noteText').style.backgroundColor || '#fff';
    if(!title || !text) return alert("Heading aur content bharein!");

    const note = { title, text, date: new Date().toLocaleString(), color };
    let notes = JSON.parse(localStorage.getItem('notes_data') || "[]");
    notes.unshift(note);
    localStorage.setItem('notes_data', JSON.stringify(notes));
    
    document.getElementById('noteTitle').value = "";
    document.getElementById('noteText').value = "";
    loadNotes();
}

function loadNotes() {
    const container = document.getElementById('notesHistory');
    let notes = JSON.parse(localStorage.getItem('notes_data') || "[]");
    container.innerHTML = notes.map((n, i) => `
        <div class="history-item" style="background: ${n.color}">
            <button class="del-btn" onclick="deleteNote(${i})">×</button>
            <h4>${n.title}</h4>
            <small>${n.date}</small>
            <p>${n.text}</p>
        </div>
    `).join('');
}

function deleteNote(i) {
    let notes = JSON.parse(localStorage.getItem('notes_data') || "[]");
    notes.splice(i, 1);
    localStorage.setItem('notes_data', JSON.stringify(notes));
    loadNotes();
}

// --- Checklist Logic ---
function addTodo() {
    const input = document.getElementById('todoInput');
    if(!input.value) return;
    let todos = JSON.parse(localStorage.getItem('todos_data') || "[]");
    todos.push({ text: input.value, done: false });
    localStorage.setItem('todos_data', JSON.stringify(todos));
    input.value = "";
    loadTodos();
}

function loadTodos() {
    const container = document.getElementById('todoList');
    let todos = JSON.parse(localStorage.getItem('todos_data') || "[]");
    container.innerHTML = todos.map((t, i) => `
        <div class="todo-item">
            <span>${t.text}</span>
            <button onclick="deleteTodo(${i})" style="color:red; border:none; background:none; cursor:pointer;">Delete</button>
        </div>
    `).join('');
}

function deleteTodo(i) {
    let todos = JSON.parse(localStorage.getItem('todos_data') || "[]");
    todos.splice(i, 1);
    localStorage.setItem('todos_data', JSON.stringify(todos));
    loadTodos();
}

// --- Calendar Logic (Advanced) ---
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
    
    // Events fetch karein
    const events = JSON.parse(localStorage.getItem('cal_events') || "[]");

    for (let i = 0; i < firstDay; i++) {
        grid.innerHTML += `<div class="cal-date" style="background:transparent; cursor:default;"></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const hasEvent = events.some(e => e.date === dateStr);
        const isToday = (d === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()) ? 'today' : '';
        
        const dot = hasEvent ? `<div class="event-dot"></div>` : '';
        
        grid.innerHTML += `
            <div class="cal-date ${isToday}" onclick="showEvent('${dateStr}')">
                ${d} ${dot}
            </div>`;
    }
}

function addEvent() {
    const title = document.getElementById('eventTitle').value;
    const date = document.getElementById('eventDate').value;
    if(!title || !date) return alert("Event details bharein!");

    let events = JSON.parse(localStorage.getItem('cal_events') || "[]");
    events.push({ title, date });
    localStorage.setItem('cal_events', JSON.stringify(events));
    
    document.getElementById('eventTitle').value = "";
    alert("Event Save ho gaya!");
    renderCalendar();
}

function showEvent(dateStr) {
    const events = JSON.parse(localStorage.getItem('cal_events') || "[]");
    const dayEvents = events.filter(e => e.date === dateStr);
    if(dayEvents.length > 0) {
        alert(`Events on ${dateStr}:\n` + dayEvents.map(e => "- " + e.title).join("\n"));
    } else {
        alert("Is din koi event nahi hai.");
    }
}

// On Page Load
window.onload = () => {
    loadNotes();
    loadTodos();
    renderCalendar();
};
