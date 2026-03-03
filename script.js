// 1. Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyD8qNYHMhbH2CyAu8DCEJr3AcBz2MQbhx0",
    authDomain: "notelist-dfae8.firebaseapp.com",
    projectId: "notelist-dfae8",
    storageBucket: "notelist-dfae8.appspot.com",
    messagingSenderId: "503268461988",
    appId: "1:503268461988:web:ae9609d73f8b76bef28531",
    measurementId: "G-LX2148M3EF"
};

// 2. Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- 🔐 ENCRYPTION LOGIC ---
const SECRET_KEY = "BhatiTools_Super_Secret_Key_2026"; // Ye key kabhi kisi ko mat batana

function encryptData(text) {
    if(!text) return "";
    return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
}

function decryptData(ciphertext) {
    if(!ciphertext) return "";
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        
        // Agar data pehle se bina encryption ke save hai, toh purana data wapas bhej do
        if(!originalText) return ciphertext; 
        return originalText;
    } catch (e) {
        // Agar decrypt nahi ho paaya (purana unencrypted data), toh jaisa hai waisa dikhao
        return ciphertext; 
    }
}

// --- 🛠️ SAFE PARSE FUNCTION ---
function safeGetLocal(key) {
    try {
        let data = localStorage.getItem(key);
        if (!data || data === "") return [];
        let parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn(`Local data for ${key} was corrupted. Resetting...`);
        localStorage.setItem(key, "[]");
        return [];
    }
}

// 3. Theme & View Management Logic 
function setTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
    localStorage.setItem('user_theme', themeName);
}

function changeView(viewType) {
    const container = document.getElementById('notesHistory');
    if(container) {
        container.className = viewType + "-view";
        localStorage.setItem('note_view', viewType);
    }
}

// 4. Auth State Handler
auth.onAuthStateChanged((user) => {
    if (user) {
        let firstName = user.displayName ? user.displayName.split(' ')[0] : "User";
        document.getElementById('authSection').innerHTML = `
            <span style="color:var(--dark); margin-right:10px; font-weight:bold;">Hi, ${firstName}</span>
            <button onclick="auth.signOut().then(()=>location.reload())" class="btn" style="width:auto; padding:5px 10px; background:#e74c3c;">Logout</button>
        `;
    }
    setTheme(localStorage.getItem('user_theme') || 'default');
    changeView(localStorage.getItem('note_view') || 'grid');
    loadNotes();
    loadTodos();
});

// 5. Google Login
function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then(() => location.reload())
       .catch((error) => console.error("Login Error: ", error));
}

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

async function saveNote() {
    const title = document.getElementById('noteTitle').value;
    const text = document.getElementById('noteText').value;
    const color = document.getElementById('noteText').style.backgroundColor || '#fff';
    const user = auth.currentUser;

    if(!title || !text) return alert("Heading aur content bharein!");

    // 🔐 Encrypting Title and Text
    const note = { 
        title: encryptData(title), 
        text: encryptData(text), 
        date: new Date().toLocaleString(), 
        color,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (user) {
        await db.collection("users").doc(user.uid).collection("notes").add(note);
    } else {
        let notes = safeGetLocal('notes_data');
        notes.unshift(note);
        localStorage.setItem('notes_data', JSON.stringify(notes));
    }
    
    document.getElementById('noteTitle').value = "";
    document.getElementById('noteText').value = "";
    loadNotes();
}

async function loadNotes() {
    const container = document.getElementById('notesHistory');
    if(!container) return; 
    
    const user = auth.currentUser;
    let notes = []; 

    if (user) {
        const snapshot = await db.collection("users").doc(user.uid).collection("notes").orderBy("timestamp", "desc").get();
        notes = snapshot.docs.map(doc => ({...doc.data(), id: doc.id}));
    } else {
        notes = safeGetLocal('notes_data');
    }

    container.innerHTML = notes.map((n, i) => `
        <div class="history-item card" style="background: ${n.color}" onclick="this.classList.toggle('expanded')">
            <button class="del-btn" style="float:right; cursor:pointer; font-size: 18px; color: red; background: none; border: none;" onclick="event.stopPropagation(); deleteNote('${user ? n.id : i}')">✖</button>
            <h4>${decryptData(n.title)}</h4>
            <small>${n.date}</small>
            <p>${decryptData(n.text)}</p>
        </div>
    `).join('');
}

async function deleteNote(id) {
    const user = auth.currentUser;
    if (confirm("Kya aap note delete karna chahte hain?")) {
        if (user) {
            await db.collection("users").doc(user.uid).collection("notes").doc(id).delete();
        } else {
            let notes = safeGetLocal('notes_data');
            notes.splice(id, 1);
            localStorage.setItem('notes_data', JSON.stringify(notes));
        }
        loadNotes();
    }
}

// --- Checklist Logic ---
async function addTodo() {
    const input = document.getElementById('todoInput');
    const task = input.value;
    const user = auth.currentUser;

    if(!task) return;

    // 🔐 Encrypting Task
    if(user) {
        await db.collection("users").doc(user.uid).collection("todos").add({
            task: encryptData(task), done: false, timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } else {
        let todos = safeGetLocal('todos_data');
        todos.push({ task: encryptData(task), done: false });
        localStorage.setItem('todos_data', JSON.stringify(todos));
    }
    input.value = "";
    loadTodos();
}

async function loadTodos() {
    const list = document.getElementById('todoList');
    if(!list) return;

    const user = auth.currentUser;
    let todos = [];

    if(user) {
        const snap = await db.collection("users").doc(user.uid).collection("todos").orderBy("timestamp").get();
        todos = snap.docs.map(doc => ({...doc.data(), id: doc.id}));
    } else {
        todos = safeGetLocal('todos_data');
    }

    list.innerHTML = todos.map((t, i) => `
        <div style="display:flex; align-items:center; margin:10px 0; padding:10px; background:#f9f9f9; border-radius:5px;">
            <input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggleTodo('${user ? t.id : i}', ${!t.done})" style="margin-right:10px; width: 20px; height: 20px;">
            <span style="flex:1; font-size: 16px; text-decoration: ${t.done ? 'line-through' : 'none'}">${decryptData(t.task)}</span>
        </div>
    `).join('');
}

async function toggleTodo(id, state) {
    const user = auth.currentUser;
    if(user) {
        await db.collection("users").doc(user.uid).collection("todos").doc(id).update({done: state});
    } else {
        let todos = safeGetLocal('todos_data');
        todos[id].done = state;
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
    const display = document.getElementById('monthDisplay');
    if(!grid || !display) return;

    grid.querySelectorAll('.cal-date').forEach(el => el.remove());

    const year = currentNavDate.getFullYear();
    const month = currentNavDate.getMonth();
    display.innerText = currentNavDate.toLocaleString('default', { month: 'long' }) + " " + year;

    let events = []; 
    if (auth.currentUser) {
        const snap = await db.collection("users").doc(auth.currentUser.uid).collection("events").get();
        events = snap.docs.map(doc => doc.data().date);
    } else {
        let localEvents = safeGetLocal('events_data');
        events = localEvents.map(e => e.date);
    }

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = "cal-date";
        empty.style.background = "transparent";
        grid.appendChild(empty);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const hasEvent = events.includes(dateStr);
        const isToday = (d === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear());
        
        const dayDiv = document.createElement('div');
        dayDiv.className = `cal-date ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}`;
        if(hasEvent) dayDiv.style.border = "2px solid var(--primary)";
        dayDiv.innerText = d;
        dayDiv.onclick = () => addEvent(dateStr);
        grid.appendChild(dayDiv);
    }
}

async function addEvent(dateStr) {
    let existingEventTitle = "";
    let existingDocId = null;
    
    // 1. Pehle check karo ki is date par koi event already save hai ya nahi
    if (auth.currentUser) {
        const snap = await db.collection("users").doc(auth.currentUser.uid).collection("events").where("date", "==", dateStr).get();
        if (!snap.empty) {
            existingEventTitle = decryptData(snap.docs[0].data().title);
            existingDocId = snap.docs[0].id;
        }
    } else {
        let events = safeGetLocal('events_data');
        let ev = events.find(e => e.date === dateStr);
        if (ev) existingEventTitle = decryptData(ev.title);
    }

    // 2. User ko prompt dikhao
    const title = prompt(`Event for ${dateStr} (Khali chhodne par delete ho jayega):`, existingEventTitle);
    
    if (title === null) return; 

    // 3. Save, Update ya Delete logic
    if (title.trim() === "") {
        if (auth.currentUser && existingDocId) {
            await db.collection("users").doc(auth.currentUser.uid).collection("events").doc(existingDocId).delete();
        } else {
            let events = safeGetLocal('events_data');
            events = events.filter(e => e.date !== dateStr);
            localStorage.setItem('events_data', JSON.stringify(events));
        }
        alert("Event Deleted! 🗑️");
    } else {
        // 🔐 Encrypting Event Title
        let encryptedTitle = encryptData(title);
        
        if (auth.currentUser) {
            if (existingDocId) {
                await db.collection("users").doc(auth.currentUser.uid).collection("events").doc(existingDocId).update({ title: encryptedTitle });
            } else {
                await db.collection("users").doc(auth.currentUser.uid).collection("events").add({ title: encryptedTitle, date: dateStr });
            }
        } else {
            let events = safeGetLocal('events_data');
            let idx = events.findIndex(e => e.date === dateStr);
            if (idx > -1) events[idx].title = encryptedTitle; 
            else events.push({ title: encryptedTitle, date: dateStr }); 
            localStorage.setItem('events_data', JSON.stringify(events));
        }
        alert("Event Saved Successfully! ✅");
    }
    renderCalendar();
}

// --- Backup Logic ---
function downloadBackup() {
    const data = {
        notes: safeGetLocal('notes_data'),
        todos: safeGetLocal('todos_data'),
        events: safeGetLocal('events_data')
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "BhatiTools_Backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// Initial Run
window.onload = () => {
    renderCalendar();
};
