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

// 4. Auth State Handler (Sync & Restore)
auth.onAuthStateChanged((user) => {
    if (user) {
        // Fix: Split array display issue solved
        let firstName = user.displayName ? user.displayName.split(' ')[0] : "User";
        document.getElementById('authSection').innerHTML = `
            <span style="color:white; margin-right:10px;">Hi, ${firstName}</span>
            <button onclick="auth.signOut().then(()=>location.reload())" class="btn" style="width:auto; padding:5px 10px; background:#e74c3c;">Logout</button>
        `;
    }
    // Fix: Broken OR operator fixed
    setTheme(localStorage.getItem('user_theme') || 'default');
    changeView(localStorage.getItem('note_view') || 'grid');
    loadNotes();
    // Note: loadTodos() function is called here but missing in your script. You might need to add it later!
    if(typeof loadTodos === 'function') loadTodos(); 
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
        title, text, date: new Date().toLocaleString(), color,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (user) {
        await db.collection("users").doc(user.uid).collection("notes").add(note);
    } else {
        // Fix: Broken OR operator and JSON syntax
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
    if(!container) return; // safety check
    
    const user = auth.currentUser;
    let notes = []; // Fix: Syntax Error resolved

    if (user) {
        const snapshot = await db.collection("users").doc(user.uid).collection("notes").orderBy("timestamp", "desc").get();
        notes = snapshot.docs.map(doc => ({...doc.data(), id: doc.id}));
    } else {
        // Fix: Broken OR operator and JSON syntax
        notes = JSON.parse(localStorage.getItem('notes_data') || "[]");
    }

    container.innerHTML = notes.map((n, i) => `
        <div class="history-item card" style="background: ${n.color}">
            <button class="del-btn" onclick="deleteNote('${user ? n.id : i}')">×</button>
            <h4>${n.title}</h4>
            <small>${n.date}</small>
            <p>${n.text}</p>
        </div>
    `).join('');
}

async function deleteNote(id) {
    const user = auth.currentUser;
    if (confirm("Kya aap note delete karna chahte hain?")) {
        if (user) {
            await db.collection("users").doc(user.uid).collection("notes").doc(id).delete();
        } else {
            // Fix: Broken OR operator and JSON syntax
            let notes = JSON.parse(localStorage.getItem('notes_data') || "[]");
            notes.splice(id, 1);
            localStorage.setItem('notes_data', JSON.stringify(notes));
        }
        loadNotes();
    }
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

    let events = []; // Fix: Syntax Error resolved
    if (auth.currentUser) {
        const snap = await db.collection("users").doc(auth.currentUser.uid).collection("events").get();
        events = snap.docs.map(doc => doc.data().date);
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
        dayDiv.innerText = d;
        dayDiv.onclick = () => addEvent(dateStr);
        grid.appendChild(dayDiv);
    }
}

async function addEvent(dateStr) {
    const title = prompt(`Enter event for ${dateStr}:`);
    if(!title) return;
    
    if (auth.currentUser) {
        await db.collection("users").doc(auth.currentUser.uid).collection("events").add({ title, date: dateStr });
        alert("Event saved to Cloud! ✅");
    } else {
        alert("Pehle login karein cloud par save karne ke liye!");
    }
    renderCalendar();
}

// Initial Run
window.onload = () => {
    renderCalendar();
};
