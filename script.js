// 1. Firebase Configuration (Wahi jo aapne console se nikaala)
const firebaseConfig = {
    apiKey: "AIzaSyD8qNYHMhbH2CyAu8DCEJr3AcBz2MQbhx0",
    authDomain: "notelist-dfae8.firebaseapp.com",
    projectId: "notelist-dfae8",
    storageBucket: "notelist-dfae8.appspot.com",
    messagingSenderId: "503268461988",
    appId: "1:503268461988:web:ae9609d73f8b76bef28531",
    measurementId: "G-LX2148M3EF"
};

// 2. Initialize Firebase (Compat Mode)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// 3. Google Login Function (Ensure 'g' is small)
function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            alert("Namaste " + result.user.displayName + "!");
            // Login hone ke baad automatic refresh taaki cloud data dikhne lage
            location.reload(); 
        })
        .catch((error) => {
            console.error("Login Error: ", error);
            alert("Login fail ho gaya. Console check karein.");
        });
}

// 4. Auth State Handler (Ye login/logout detect karega)
auth.onAuthStateChanged((user) => {
    if (user) {
        // Agar user login hai, toh uska naam button ki jagah dikhao
        document.getElementById('authSection').innerHTML = `
            <span style="color:white; margin-right:10px;">Hi, ${user.displayName.split(' ')[0]}</span>
            <button onclick="auth.signOut().then(()=>location.reload())" class="btn" style="width:auto; padding:5px 10px; background:#e74c3c;">Logout</button>
        `;
    }
    // Har bar data load karein
    loadNotes();
    loadTodos();
});
// Google Login Function
function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then((result) => {
        alert("Namaste " + result.user.displayName + "!");
        // Refresh karne ki bajaye cloud se load ho jayega state change handler se
    }).catch((error) => {
        console.error("Login Error: ", error);
    });
}

// --- Navigation ---
function openScreen(screenId, btn) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active-screen'));
    document.querySelectorAll('.nav-tabs button').forEach(b => b.classList.remove('active'));
    document.getElementById(screenId).classList.add('active-screen');
    btn.classList.add('active');
    if(screenId === 'calendar') renderCalendar();
}

// --- Notepad Logic (Cloud Sync) ---
function setNoteColor(color) {
    document.getElementById('noteText').style.backgroundColor = color;
}

async function saveNote() {
    const title = document.getElementById('noteTitle').value;
    const text = document.getElementById('noteText').value;
    const color = document.getElementById('noteText').style.backgroundColor || '#fff';
    const user = auth.currentUser;

    if(!title || !text) return alert("Heading aur content bharein!");

    const note = { 
        title, 
        text, 
        date: new Date().toLocaleString(), 
        color,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (user) {
        await db.collection("users").doc(user.uid).collection("notes").add(note);
        alert("Note Cloud par save ho gaya!");
    } else {
        let notes = JSON.parse(localStorage.getItem('notes_data') || "[]");
        notes.unshift(note);
        localStorage.setItem('notes_data', JSON.stringify(notes));
    }
    
    document.getElementById('noteTitle').value = "";
    document.getElementById('noteText').value = "";
    loadNotes();
}

async function loadNotes() {
    const container = document.getElementById('notesHistory');
    const user = auth.currentUser;
    let notes = [];

    if (user) {
        const snapshot = await db.collection("users").doc(user.uid).collection("notes").orderBy("timestamp", "desc").get();
        notes = snapshot.docs.map(doc => ({...doc.data(), id: doc.id}));
    } else {
        notes = JSON.parse(localStorage.getItem('notes_data') || "[]");
    }

    container.innerHTML = notes.map((n, i) => `
        <div class="history-item" style="background: ${n.color}">
            <button class="del-btn" onclick="deleteNote('${user ? n.id : i}')">×</button>
            <h4>${n.title}</h4>
            <small>${n.date}</small>
            <p>${n.text}</p>
        </div>
    `).join('');
}

async function deleteNote(id) {
    const user = auth.currentUser;
    if (user) {
        await db.collection("users").doc(user.uid).collection("notes").doc(id).delete();
    } else {
        let notes = JSON.parse(localStorage.getItem('notes_data') || "[]");
        notes.splice(id, 1);
        localStorage.setItem('notes_data', JSON.stringify(notes));
    }
    loadNotes();
}

// --- Checklist Logic ---
async function addTodo() {
    const input = document.getElementById('todoInput');
    const user = auth.currentUser;
    if(!input.value) return;

    const task = { text: input.value, done: false, date: new Date().toISOString() };

    if (user) {
        await db.collection("users").doc(user.uid).collection("todos").add(task);
    } else {
        let todos = JSON.parse(localStorage.getItem('todos_data') || "[]");
        todos.push(task);
        localStorage.setItem('todos_data', JSON.stringify(todos));
    }
    input.value = "";
    loadTodos();
}

async function loadTodos() {
    const container = document.getElementById('todoList');
    const user = auth.currentUser;
    let todos = [];

    if (user) {
        const snapshot = await db.collection("users").doc(user.uid).collection("todos").get();
        todos = snapshot.docs.map(doc => ({...doc.data(), id: doc.id}));
    } else {
        todos = JSON.parse(localStorage.getItem('todos_data') || "[]");
    }

    container.innerHTML = todos.map((t, i) => `
        <div class="todo-item">
            <span>${t.text}</span>
            <button onclick="deleteTodo('${user ? t.id : i}')" style="color:red; border:none; background:none; cursor:pointer;">Delete</button>
        </div>
    `).join('');
}

async function deleteTodo(id) {
    const user = auth.currentUser;
    if (user) {
        await db.collection("users").doc(user.uid).collection("todos").doc(id).delete();
    } else {
        let todos = JSON.parse(localStorage.getItem('todos_data') || "[]");
        todos.splice(id, 1);
        localStorage.setItem('todos_data', JSON.stringify(todos));
    }
    loadTodos();
}

// --- Calendar Logic ---
let currentNavDate = new Date();

function changeMonth(val) {
    currentNavDate.setMonth(currentNavDate.getMonth() + val);
    renderCalendar();
}

async function renderCalendar() {
    const grid = document.getElementById('calGrid');
    grid.querySelectorAll('.cal-date').forEach(el => el.remove());

    const year = currentNavDate.getFullYear();
    const month = currentNavDate.getMonth();
    const user = auth.currentUser;

    document.getElementById('monthDisplay').innerText = currentNavDate.toLocaleString('default', { month: 'long' });
    document.getElementById('yearDisplay').innerText = year;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let events = [];
    if (user) {
        const snapshot = await db.collection("users").doc(user.uid).collection("events").get();
        events = snapshot.docs.map(doc => doc.data());
    } else {
        events = JSON.parse(localStorage.getItem('cal_events') || "[]");
    }

    for (let i = 0; i < firstDay; i++) {
        grid.innerHTML += `<div class="cal-date" style="background:transparent; cursor:default;"></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const hasEvent = events.some(e => e.date === dateStr);
        const isToday = (d === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()) ? 'today' : '';
        const dot = hasEvent ? `<div class="event-dot"></div>` : '';
        
        grid.innerHTML += `<div class="cal-date ${isToday}" onclick="showEvent('${dateStr}')">${d} ${dot}</div>`;
    }
}

async function addEvent() {
    const title = document.getElementById('eventTitle').value;
    const date = document.getElementById('eventDate').value;
    const user = auth.currentUser;
    if(!title || !date) return alert("Event details bharein!");

    const eventData = { title, date };

    if (user) {
        await db.collection("users").doc(user.uid).collection("events").add(eventData);
    } else {
        let events = JSON.parse(localStorage.getItem('cal_events') || "[]");
        events.push(eventData);
        localStorage.setItem('cal_events', JSON.stringify(events));
    }
    
    document.getElementById('eventTitle').value = "";
    alert("Event Save ho gaya!");
    renderCalendar();
}

async function showEvent(dateStr) {
    const user = auth.currentUser;
    let events = [];
    if (user) {
        const snapshot = await db.collection("users").doc(user.uid).collection("events").where("date", "==", dateStr).get();
        events = snapshot.docs.map(doc => doc.data());
    } else {
        const allEvents = JSON.parse(localStorage.getItem('cal_events') || "[]");
        events = allEvents.filter(e => e.date === dateStr);
    }

    if(events.length > 0) {
        alert(`Events on ${dateStr}:\n` + events.map(e => "- " + e.title).join("\n"));
    } else {
        alert("Is din koi event nahi hai.");
    }
}

// Initial Run
window.onload = () => {
    loadNotes();
    loadTodos();
    renderCalendar();
};


