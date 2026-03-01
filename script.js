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
    if(!title || !text) return alert("Heading aur text dono bharein!");
    
    const note = { title, text, date: new Date().toLocaleString(), color: document.getElementById('noteText').style.backgroundColor };
    let notes = JSON.parse(localStorage.getItem('notes') || "[]");
    notes.unshift(note);
    localStorage.setItem('notes', JSON.stringify(notes));
    
    document.getElementById('noteTitle').value = "";
    document.getElementById('noteText').value = "";
    loadNotes();
}

function loadNotes() {
    const container = document.getElementById('notesHistory');
    let notes = JSON.parse(localStorage.getItem('notes') || "[]");
    container.innerHTML = notes.map((n, i) => `
        <div class="history-item" style="background: ${n.color || '#fff'}">
            <button class="del-btn" onclick="deleteNote(${i})">×</button>
            <h4>${n.title}</h4>
            <small>${n.date}</small>
            <p>${n.text}</p>
        </div>
    `).join('');
}

function deleteNote(i) {
    let notes = JSON.parse(localStorage.getItem('notes') || "[]");
    notes.splice(i, 1);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();
}

// --- Checklist Logic ---
function addTodo() {
    const input = document.getElementById('todoInput');
    if(!input.value) return;
    let todos = JSON.parse(localStorage.getItem('todos') || "[]");
    todos.push({ text: input.value, done: false });
    localStorage.setItem('todos', JSON.stringify(todos));
    input.value = "";
    loadTodos();
}

function loadTodos() {
    const container = document.getElementById('todoList');
    let todos = JSON.parse(localStorage.getItem('todos') || "[]");
    container.innerHTML = todos.map((t, i) => `
        <div class="todo-item">
            <span><input type="checkbox" ${t.done?'checked':''} onclick="toggleTodo(${i})"> ${t.text}</span>
            <button onclick="deleteTodo(${i})" style="color:red; border:none; background:none; cursor:pointer;">Delete</button>
        </div>
    `).join('');
}

function toggleTodo(i) {
    let todos = JSON.parse(localStorage.getItem('todos') || "[]");
    todos[i].done = !todos[i].done;
    localStorage.setItem('todos', JSON.stringify(todos));
}

function deleteTodo(i) {
    let todos = JSON.parse(localStorage.getItem('todos') || "[]");
    todos.splice(i, 1);
    localStorage.setItem('todos', JSON.stringify(todos));
    loadTodos();
}

// --- Calendar Logic ---
function renderCalendar() {
    const grid = document.getElementById('calGrid');
    grid.querySelectorAll('.cal-date').forEach(el => el.remove());
    
    const now = new Date();
    document.getElementById('monthDisplay').innerText = now.toLocaleString('default', { month: 'long' });
    document.getElementById('yearDisplay').innerText = now.getFullYear();

    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        grid.innerHTML += `<div class="cal-date" style="border:none"></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const isToday = d === now.getDate() ? 'today' : '';
        grid.innerHTML += `<div class="cal-date ${isToday}">${d}</div>`;
    }
}

function addEvent() {
    const title = document.getElementById('eventTitle').value;
    const date = document.getElementById('eventDate').value;
    if(!title || !date) return alert("Details bharein");
    alert("Event Saved: " + title + " on " + date);
}

window.onload = () => {
    loadNotes();
    loadTodos();
    renderCalendar();
};
