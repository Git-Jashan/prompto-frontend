const db = window.db;
const auth = window.auth;
const promptsList = document.getElementById('promptsList');

import { collection, getDocs, query, where, deleteDoc, doc, orderBy} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

onAuthStateChanged(auth, async (user) => {
    
    if (!user) {
        promptsList.innerHTML = "<p>Please log in to view your prompts.</p>";
        return;
    }

    promptsList.innerHTML = "<p>Loading collection...</p>";

    try {
        const q = query(
            collection(db, "prompts"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        promptsList.innerHTML = ""; 

        if (querySnapshot.empty) {
            promptsList.innerHTML = "<p>No prompts found.</p>";
            return;
        }

        querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            const docId = docSnapshot.id; 
            
            let dateStr = "Just now";
            if (data.createdAt && data.createdAt.toDate) {
                dateStr = data.createdAt.toDate().toLocaleDateString();
            }

            const card = document.createElement('div');
            card.className = 'prompt-card';
            
            card.innerHTML = `
                <div class="prompt-header">
                    <h3>${data.name}</h3>
                    <span class="prompt-tag">${data.tag || "Uncategorized"}</span>
                </div>
                <div style="font-size: 0.8rem; color: #888; margin-bottom: 8px;">Saved on: ${dateStr}</div>
                <div class="prompt-text">${data.content}</div>
                
                <div style="margin-top:15px; display:flex; gap:10px;">
                    <button class="copy-btn" style="padding: 8px 12px; cursor:pointer; background-color:black;color:white;border-radius:4px;">Copy</button>
                    <button class="delete-btn" style="padding: 8px 12px; cursor:pointer; background:#ff4d4d; color:white; border:none; border-radius:4px;">Delete</button>
                </div>
            `;
            
            const copyBtn = card.querySelector('.copy-btn');
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(data.content);
                alert("Copied!");
            });

            const deleteBtn = card.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', async () => {
                if (confirm("Are you sure you want to delete this prompt?")) {
                    try {
                        await deleteDoc(doc(db, "prompts", docId));
                        card.remove(); 
                    } catch (err) {
                        console.error("Error deleting:", err);
                        alert("Failed to delete.");
                    }
                }
            });

            promptsList.appendChild(card);
        });

    } catch (err) {
        console.error("Error fetching prompts:", err);
        promptsList.innerHTML = `<p>Error: ${err.message}</p>`;
    }
});