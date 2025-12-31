import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAaoMYU2jiplvylFw6IYvBA5OP9UgjBWPg",
  authDomain: "prompto-7eb91.firebaseapp.com",
  projectId: "prompto-7eb91",
  storageBucket: "prompto-7eb91.firebasestorage.app",
  messagingSenderId: "425180100484",
  appId: "1:425180100484:web:947872c7dd65ecd4ae0fd1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

const modal = document.getElementById("loginPopup");
const closeSpan = document.querySelector(".close-btn");
const googleBtn = document.getElementById('googleBtn');
const emailLoginBtn = document.getElementById('emailLoginBtn');
const authButtons = document.getElementById('authButtons');
const loginBtn = document.getElementById('loginBtn');
const userProfile = document.getElementById('userProfile'); 
const userAvatar = document.getElementById('userAvatar');
const profileDropdown = document.getElementById('profileDropdown');
const dropdownEmail = document.getElementById('dropdownEmail');
const logoutBtn = document.getElementById('logoutBtn');

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User logged in:", user.email);

        if(authButtons) authButtons.style.display = 'none';
        if(userProfile) userProfile.style.display = 'flex';

        if(dropdownEmail) dropdownEmail.textContent = user.email;

        const photoURL = user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=0D8ABC&color=fff`;
        if(userAvatar) userAvatar.src = photoURL;

        user.getIdToken().then(token => {
            sendTokenToBackend(token);
        });

        if(modal) modal.style.display = "none";

    } else {
        console.log("User logged out");

        if(authButtons) authButtons.style.display = 'block'; 
        if(userProfile) userProfile.style.display = 'none';
    }
});

if(loginBtn) {
    loginBtn.onclick = () => {
        if(modal) modal.style.display = "flex";
    };
}

if(closeSpan) closeSpan.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; };


if(googleBtn) {
    googleBtn.addEventListener('click', () => {
        signInWithPopup(auth, provider)
            .catch((error) => {
                console.error(error);
                alert("Login Failed: " + error.message);
            });
    });
}

if(emailLoginBtn) {
    emailLoginBtn.addEventListener('click', () => {
        const email = document.getElementById('email').value;
        const pass = document.getElementById('password').value;
        signInWithEmailAndPassword(auth, email, pass)
            .catch((error) => {
                alert("Error: " + error.message);
            });
    });
}

if (userAvatar) {
    userAvatar.addEventListener('click', (e) => {
        e.stopPropagation(); 
        profileDropdown.classList.toggle('active');
    });
}

window.addEventListener('click', () => {
    if (profileDropdown && profileDropdown.classList.contains('active')) {
        profileDropdown.classList.remove('active');
    }
});

if (profileDropdown) {
    profileDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            alert("Logged Out");
            location.reload(); 
        }).catch((error) => {
            console.error("Logout Error:", error);
        });
    });
}

function sendTokenToBackend(idToken) {
    fetch('https://prompto-backend-z85i.onrender.com/api/get-secret-key', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + idToken }
    })
    .then(response => response.json())
    .then(data => console.log("Backend Connected."))
    .catch(err => console.error("Backend Error:", err));
}

window.db = db;
window.addDoc = addDoc;
window.collection = collection;
window.auth = auth;