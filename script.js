// --- 1. CALENDAR LOGIC ---
const calendarGrid = document.getElementById('calendar-grid');
const monthDisplay = document.getElementById('monthDisplay');

function renderCalendar() {
    const date = new Date();
    const month = date.getMonth();
    const year = date.getFullYear();

    monthDisplay.innerText = date.toLocaleString('default', { month: 'long' }) + " " + year;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    calendarGrid.innerHTML = ""; // Clear old dates

    // Blank spaces for previous month days
    for (let i = 0; i < firstDay; i++) {
        calendarGrid.innerHTML += `<div></div>`;
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === date.getDate() ? 'class="today"' : '';
        calendarGrid.innerHTML += `<div ${isToday}>${day}</div>`;
    }
}

// --- 2. CHECKLIST LOGIC ---
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTask');
const todoList = document.getElementById('todoList');

addTaskBtn.onclick = () => {
    if (taskInput.value === "") return;
    
    const li = document.createElement('li');
    li.innerHTML = `
        <input type="checkbox">
        <span>${taskInput.value}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    todoList.appendChild(li);
    taskInput.value = "";
};

// --- 3. NOTEPAD AUTO-SAVE ---
const noteInput = document.getElementById('noteInput');
const saveBtn = document.getElementById('saveBtn');

// Load saved note on startup
noteInput.value = localStorage.getItem('savedNote') || "";

saveBtn.onclick = () => {
    localStorage.setItem('savedNote', noteInput.value);
    alert("Note saved successfully!");
};

// Initialize
renderCalendar();
