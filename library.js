const db = window.db;
const auth = window.auth;
const promptsList = document.getElementById('promptsList');
const promptsGrid = document.getElementById('promptsGrid');

import { 
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  orderBy,
  addDoc,
  serverTimestamp,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const exploreBtn = document.getElementById('exploreBtn');
const savedBtn = document.getElementById('savedBtn');

exploreBtn.addEventListener('click', () => {
  document.getElementById('exploreSection').style.display = 'flex';
  document.getElementById('savedSection').style.display = 'none';
  exploreBtn.classList.add('active');
  savedBtn.classList.remove('active');
});

savedBtn.addEventListener('click', async () => {
  document.getElementById('exploreSection').style.display = 'none';
  document.getElementById('savedSection').style.display = 'flex';
  savedBtn.classList.add('active');
  exploreBtn.classList.remove('active');
  
  await loadSavedPrompts();
});

const uploadPrompt = document.getElementById('uploadPrompt');
const uploadPromptBox = document.getElementById('uploadPromptBox');
const cancelBtn = document.querySelector('.cancelUpload');
const confirmBtn = document.querySelector('.confirmUpload');

uploadPrompt.addEventListener('click', () => { 
  uploadPromptBox.style.display = 'flex';
});

if (cancelBtn) {
  cancelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    uploadPromptBox.style.display = 'none';
  });
}

window.addEventListener('click', (event) => {
  if (event.target === uploadPromptBox) {
    uploadPromptBox.style.display = 'none';
  }
});

if (confirmBtn) {
  confirmBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const user = window.auth?.currentUser;

    if (!user) {
      alert("You must be logged in to upload!");
      return;
    }

    let authorName = user.displayName;
    if (!authorName && user.email) {
      const emailPrefix = user.email.split('@')[0];
      authorName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    } else if (!authorName) {
      authorName = "Anonymous";
    }
    
    const nameInput = document.getElementById('uploadPromptName');
    const bodyInput = document.getElementById('uploadPromptBody');
    const categoryInput = document.getElementById('uploadPromptCategory');

    const promptName = nameInput.value.trim();
    const promptBody = bodyInput.value.trim();
    const promptCategory = categoryInput.value;

    if (!promptName) {
      alert("Please enter a prompt name!");
      return;
    }
    if (!promptBody) {
      alert("Please enter prompt content!");
      return;
    }
    if (!promptCategory) {
      alert("Please select a category!");
      return;
    }

    try {  
      await addDoc(collection(db, "promptsMedia"), {
        title: promptName,
        category: promptCategory,
        content: promptBody,
        createdAt: serverTimestamp(),
        userId: user.uid,
        author: authorName,
        userEmail: user.email,
        likes: 0,
        likedBy: [] // FIX: Add likedBy array from the start
      });
      
      console.log("Prompt uploaded successfully!");
      alert("Prompt uploaded successfully!");

      nameInput.value = "";
      categoryInput.value = "";
      bodyInput.value = "";
      uploadPromptBox.style.display = 'none';
      
      await loadExplorePrompts();
      
    } catch (err) {
      console.error("Error saving prompt:", err);
      alert("Failed to save prompt: " + err.message);
    }
  });
}

// FIX #2: Complete rewrite of loadExplorePrompts
async function loadExplorePrompts(categoryFilter = 'All', searchTerm = '') {
  if (!promptsGrid) return;
  
  promptsGrid.innerHTML = "<p>Loading prompts...</p>";

  try {
    let q;
    
    if (categoryFilter === 'All' || !categoryFilter) {
      q = query(
        collection(db, "promptsMedia"),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(
        collection(db, "promptsMedia"),
        where("category", "==", categoryFilter),
        orderBy("createdAt", "desc")
      );
    }

    const querySnapshot = await getDocs(q);
    promptsGrid.innerHTML = ""; 

    if (querySnapshot.empty) {
      promptsGrid.innerHTML = "<p>No prompts found. Be the first to share one!</p>";
      return;
    }

    let prompts = [];
    querySnapshot.forEach((docSnapshot) => {
      prompts.push({
        id: docSnapshot.id,
        ...docSnapshot.data()
      });
    });

    if (searchTerm) {
      prompts = prompts.filter(prompt => 
        prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (prompts.length === 0) {
      promptsGrid.innerHTML = "<p>No prompts match your search.</p>";
      return;
    }

    // FIX: Define currentUser ONCE before loop
    const currentUser = window.auth?.currentUser;

    prompts.forEach((data) => {
      let dateStr = "Just now";
      if (data.createdAt && data.createdAt.toDate) {
        dateStr = data.createdAt.toDate().toLocaleDateString();
      }

      // FIX: Initialize likedBy array if it doesn't exist
      if (!data.likedBy) {
        data.likedBy = [];
      }

      const card = document.createElement('div');
      card.className = 'prompt-card';
      
      // Keep your exact HTML structure with SVG
      card.innerHTML = `
        <div class="prompt-header">
          <h3>${escapeHtml(data.title)}</h3>
          <span class="prompt-tag">${escapeHtml(data.category)}</span>
        </div>
        <div style="font-size: 0.8rem; color: #888; margin-bottom: 8px;">
          By ${escapeHtml(data.author)} • ${dateStr}
        </div>
        <div class="prompt-text" style="display:flex; flex-wrap:wrap; height: 250px; overflow-y:auto; width:99%; overflow-x:hidden;">${escapeHtml(data.content)}</div>
        
        <div style="margin-top:15px; display:flex; gap:10px;">
          <button class="copy-btn" style="padding: 8px 12px; cursor:pointer; background-color:black;color:white;border-radius:4px;border:none;">Copy</button>
          <span class="like-wrapper" style="display:flex; align-items:center; gap:2px; color:white; padding:8px; border-radius:4px; cursor:pointer; background-color:black;">
            <button class="like-btn" style="background:none; color:white; font-size:14px; border:none; cursor:pointer; font-weight:900;">
              <svg width="13" height="13" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M16.5 3 c-1.74 0-3.41.81-4.5 2.09 C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5 c0 3.78 3.4 6.86 8.55 11.54 L12 21.35 l1.45-1.31 C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3z" fill="none" stroke="white" stroke-width="2" stroke-linejoin="round"/>
              </svg>
            </button>
            <span class="like-count" style="margin-left:4px;">${data.likes || 0}</span>
          </span>
        </div>
      `;
      
      // Copy button handler
      const copyBtn = card.querySelector('.copy-btn');
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(data.content);
        alert("Prompt copied!");
      });

      // FIX: Clean like button handler - NO DUPLICATES
      const likeWrapper = card.querySelector('.like-wrapper');
      const likeSvgPath = likeWrapper.querySelector('svg path');
      const likeCountSpan = likeWrapper.querySelector('.like-count');
      
      // Check if current user has liked this prompt
      let liked = currentUser ? data.likedBy.includes(currentUser.uid) : false;
      let currentLikes = data.likes || 0;

      // Set initial heart state
      if (liked) {
        likeSvgPath.setAttribute('fill', 'white'); // Filled heart
      } else {
        likeSvgPath.setAttribute('fill', 'none'); // Outline heart
      }

      // Like button click handler
      likeWrapper.addEventListener('click', async () => {
        // Check login
        if (!currentUser) {
          alert("Please log in to like prompts!");
          return;
        }

        const promptRef = doc(db, "promptsMedia", data.id);

        try {
          if (!liked) {
            // Like the prompt
            await updateDoc(promptRef, {
              likes: increment(1),
              likedBy: arrayUnion(currentUser.uid)
            });
            currentLikes++;
            liked = true;
            likeSvgPath.setAttribute('fill', 'white'); // Fill heart
          } else {
            // Unlike the prompt
            await updateDoc(promptRef, {
              likes: increment(-1),
              likedBy: arrayRemove(currentUser.uid)
            });
            currentLikes--;
            liked = false;
            likeSvgPath.setAttribute('fill', 'none'); // Outline heart
          }

          // Update count display
          likeCountSpan.textContent = currentLikes;
          
        } catch (err) {
          console.error("Like update failed:", err);
          alert("Failed to update like. Please try again.");
        }
      });

      promptsGrid.appendChild(card);
    });

  } catch (err) {
    console.error("Error fetching prompts:", err);
    promptsGrid.innerHTML = `<p style="color: red;">Error loading prompts: ${err.message}</p>`;
  }
}

async function loadSavedPrompts() {
  const user = window.auth?.currentUser;

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
      promptsList.innerHTML = "<p>No saved prompts yet. Generate and save your first prompt!</p>";
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
          <h3>${escapeHtml(data.name)}</h3>
          <span class="prompt-tag">${escapeHtml(data.tag || "Uncategorized")}</span>
        </div>
        <div style="font-size: 0.8rem; color: #888; margin-bottom: 8px;">Saved on: ${dateStr}</div>
        <div class="prompt-text">${escapeHtml(data.content)}</div>
        
        <div style="margin-top:15px; display:flex; gap:10px;">
          <button class="copy-btn" style="padding: 8px 12px; cursor:pointer; background-color:black;color:white;border-radius:4px;border:none;">Copy</button>
          <button class="saveUpload-btn" style="padding: 8px 12px; cursor:pointer; background-color:#00BFFF;color:white;border-radius:4px;border:none;">Upload</button>
          <button class="delete-btn" style="padding: 8px 12px; cursor:pointer; background:#F40009; color:white; border:none; border-radius:4px;">Delete</button>
        </div>
      `;
      
      const copyBtn = card.querySelector('.copy-btn');
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(data.content);
        alert("Copied!");
      });
      
      const saveUploadBtn = card.querySelector('.saveUpload-btn');
      saveUploadBtn.addEventListener('click', function () {
        uploadPromptBox.style.display = 'flex';
        document.getElementById('uploadPromptName').value = data.name;
        document.getElementById('uploadPromptBody').value = data.content;
      });

      const deleteBtn = card.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', async () => {
        if (confirm("Are you sure you want to delete this prompt?")) {
          try {
            await deleteDoc(doc(db, "prompts", docId));
            card.remove(); 
            alert("Prompt deleted!");
          } catch (err) {
            console.error("Error deleting:", err);
            alert("Failed to delete: " + err.message);
          }
        }
      });

      promptsList.appendChild(card);
    });

  } catch (err) {
    console.error("Error fetching prompts:", err);
    promptsList.innerHTML = `<p style="color: red;">Error: ${err.message}</p>`;
  }
}

const searchInput = document.getElementById('searchInput');
const categorySelect = document.getElementById('promptCategory');

if (searchInput) {
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const searchTerm = e.target.value;
      const category = categorySelect.value || 'All';
      loadExplorePrompts(category, searchTerm);
    }, 300);
  });
}

if (categorySelect) {
  categorySelect.addEventListener('change', (e) => {
    const category = e.target.value;
    const searchTerm = searchInput.value;
    loadExplorePrompts(category, searchTerm);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("User logged in:", user.email);
    await loadExplorePrompts();
  } else {
    console.log("User logged out");
    await loadExplorePrompts();

    if (promptsList) {
      promptsList.innerHTML = "<p>Please log in to view your saved prompts.</p>";
    }
  }
});