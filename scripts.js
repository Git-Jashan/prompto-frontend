const tagline = document.querySelector("#tagline");
const sendBtn = document.querySelector(".sendBtn");
const userText = document.querySelector(".userText");
const chatContainer = document.querySelector(".chatContainer");
const typer = document.querySelector(".typer");
const actionBar = document.querySelector(".actionBar");
const modal = document.getElementById("loginPopup");
const loginBtn = document.getElementById("openLoginBtn");
const span = document.getElementsByClassName("close-btn")[0];

sendBtn.addEventListener("click", sendMessage);

userText.addEventListener("keydown", (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});
async function sendMessage() {
  const text = userText.value.trim();
  if (text === "") return;
  
  const user = window.auth?.currentUser;
  if (!user) {
    alert("Please log in to use Prompto!");
    modal.style.display = "flex";
    return;
  }
  
  if (chatContainer.children.length === 0) {
    tagline.classList.add("hidden");
    chatContainer.classList.add("active");
  }
  
  addMessageToUI(text, "user");
  userText.value = "";
  
  const thinking = document.createElement("div");
  thinking.classList.add("thinking");
  thinking.textContent = "Thinking...";
  chatContainer.appendChild(thinking);
  sendBtn.disabled = true;
  
  try {
    const idToken = await user.getIdToken();
    
    const response = await fetch('https://prompto-backend-z85i.onrender.com/api/prompt-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ message: text })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      if (data.limitReached) {
        addMessageToUI(data.error, "error");
        sendBtn.disabled = true;
        userText.disabled = true;
        userText.placeholder = "Daily limit reached. Come back tomorrow!";
      } else {
        addMessageToUI(data.error || "Error: Could not connect to server", "error");
      }
      return;
    }
    
    addMessageToUI(data.reply, "ai");
    
    if (data.isFinalGeneration) {
      bringAction();
      
      if (data.remainingPrompts !== undefined) {
        const infoMsg = `✓ Prompt generated! You have ${data.remainingPrompts} prompts remaining today.`;
        addMessageToUI(infoMsg, "info");
      }
    }
    
  } catch (error) {
    console.error("Error:", error);
    addMessageToUI("Error: Could not connect to server", "error");
  } finally {
    sendBtn.disabled = false;
    const thinkingEl = document.querySelector('.thinking');
    if (thinkingEl) thinkingEl.remove();
  }
}

function addMessageToUI(text, sender) {
  const msgDiv = document.createElement("div");
  
  if (sender === "user") {
    msgDiv.classList.add("userMessage");
  } else if (sender === "ai") {
    msgDiv.classList.add("aiMessage");
  } else if (sender === "error") {
    msgDiv.classList.add("aiMessage", "error");
    msgDiv.style.color = "#ff0000ff";
  } else if (sender === "info") {
    msgDiv.classList.add("aiMessage", "info");
    msgDiv.style.color = "#74f474ff";
  }
  
  msgDiv.textContent = text;
  chatContainer.appendChild(msgDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function bringAction() {
  typer.classList.add("hidden");
  actionBar.classList.add("active");
}

document.querySelector(".newChat").addEventListener("click", async () => {
  const user = window.auth?.currentUser;
  
  if (user) {
    try {
      const idToken = await user.getIdToken();
      
      await fetch('https://prompto-backend-z85i.onrender.com/api/reset-conversation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
    } catch (error) {
      console.error("Reset error:", error);
    }
  }
  location.reload();
});

document.querySelector(".copyBtn").addEventListener("click", () => {

const allAiMessages = document.querySelectorAll(".aiMessage");
  
  let lastActualAiMessage = null;
  for (let i = allAiMessages.length - 1; i >= 0; i--) {
    if (!allAiMessages[i].classList.contains('info') && 
        !allAiMessages[i].classList.contains('error')) {
      lastActualAiMessage = allAiMessages[i];
      break;
    }
  }
  if (lastActualAiMessage) {
    const text = lastActualAiMessage.textContent;
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  } else {
    alert("No prompt to copy!");
  }})

if(loginBtn){loginBtn.onclick = function() {
  modal.style.display = "flex";
}
}
span.onclick = function() {
  modal.style.display = "none";
}

window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}

const saveDialog = document.getElementById('saveDialog');
const confirmBtn = document.getElementById('confirmBtn');
const promptName = document.getElementById('promptName');
const promptTag = document.getElementById('promptTag');
const cancelBtn = document.getElementById('cancelBtn');

document.addEventListener('click', (e) => {
  if (e.target && e.target.classList.contains('saveBtn')) {
    e.preventDefault();
    
    if (saveDialog) {
      saveDialog.showModal();
      if (promptName) promptName.focus();
    }
  }
});

if (cancelBtn) {
  cancelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (saveDialog) {
      saveDialog.close();
    }
  });
}

if (confirmBtn) {
  confirmBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const user = window.auth?.currentUser;

    if (!user) {
      alert("You must be logged in to save!");
      return;
    }

    const nameValue = promptName.value;
    const tagValue = promptTag.value || "Uncategorized";

    if (!nameValue.trim()) {
      alert("Please give your prompt a name!");
      return;
    }

    const allAiMessages = document.querySelectorAll(".aiMessage");
    
    let lastActualAiMessage = null;
    for (let i = allAiMessages.length - 1; i >= 0; i--) {
      if (!allAiMessages[i].classList.contains('info') && 
          !allAiMessages[i].classList.contains('error')) {
        lastActualAiMessage = allAiMessages[i];
        break;
      }
    }

    if (!lastActualAiMessage) {
      alert("Error: No AI prompt found to save.");
      return;
    }

    const promptContent = lastActualAiMessage.innerText;

    try {
      const idToken = await user.getIdToken();
      
      await addDoc(collection(db, "prompts"), {
        name: nameValue,
        tag: tagValue,
        content: promptContent,
        createdAt: new Date(),
        userId: user.uid,
        userEmail: user.email
      });

      console.log("Saved to Firebase successfully!");
      
      promptName.value = "";
      promptTag.value = "";
      saveDialog.close();

    } catch (err) {
      console.error("Firebase Save Error:", err);
      alert("Failed to save. Check console for details.");
    }
  });
}

const termsModal = document.getElementById('termsModal');
const privacyModal = document.getElementById('privacyModal');
const termsLink = document.getElementById('termsLink');
const privacyLink = document.getElementById('privacyLink');
const closeTerms = document.getElementById('closeTerms');
const closePrivacy = document.getElementById('closePrivacy');

if (termsLink) {
  termsLink.addEventListener('click', (e) => {
    e.preventDefault();
    termsModal.style.display = 'flex';
  });
}

if (privacyLink) {
  privacyLink.addEventListener('click', (e) => {
    e.preventDefault();
    privacyModal.style.display = 'flex';
  });
}

if (closeTerms) {
  closeTerms.addEventListener('click', () => {
    termsModal.style.display = 'none';
  });
}

if (closePrivacy) {
  closePrivacy.addEventListener('click', () => {
    privacyModal.style.display = 'none';
  });
}

window.addEventListener('click', (e) => {
  if (e.target === termsModal) {
    termsModal.style.display = 'none';
  }
  if (e.target === privacyModal) {
    privacyModal.style.display = 'none';
  }
});

// keyboard-handler.js
(function () {
  const vv = window.visualViewport;
  const inputBar = document.querySelector('.typer');
  const footer = document.querySelector('.footer');
  const chat = document.querySelector('.chatContainer.active');
  const input = document.querySelector('.userText');

  if (!inputBar || !chat) return;

  const GAP = 4; // pixels; 0–6 recommended

  function onKeyboardResize() {
    const keyboardHeight = Math.max(0, window.innerHeight - (vv ? vv.height : window.innerHeight));
    if (keyboardHeight > 0) {
      // keyboard open
      document.body.classList.add('keyboard-open');

      // move inputBar up; ensure we move almost full keyboard height leaving a tiny gap
      const translate = Math.max(0, keyboardHeight - GAP);
      inputBar.style.transition = 'transform 120ms linear';
      inputBar.style.transform = `translateY(-${translate}px)`;

      // move footer down so it won't sit between input and keyboard
      if (footer) footer.style.transform = `translateY(${inputBar.offsetHeight}px)`;

      // add bottom padding to messages so last message doesn't peek up into gap
      chat.style.paddingBottom = `${inputBar.offsetHeight + 6}px`;

      // optional: auto-scroll messages to bottom
      // chat.scrollTop = chat.scrollHeight;
    } else {
      // keyboard closed
      document.body.classList.remove('keyboard-open');
      inputBar.style.transform = '';
      inputBar.style.transition = '';

      if (footer) footer.style.transform = '';
      chat.style.paddingBottom = ''; // reset to CSS default
    }
  }

  if (vv) {
    vv.addEventListener('resize', onKeyboardResize);
    // some Android devices don't fire resize on keyboard close — also listen to blur
    window.addEventListener('resize', onKeyboardResize);
  } else {
    // Fallback: watch focus/blur on input only (less reliable)
    input.addEventListener('focus', () => {
      // guess a height if you must, or advise real-device testing
      inputBar.style.transform = 'translateY(-260px)';
    });
    input.addEventListener('blur', () => {
      inputBar.style.transform = '';
    });
  }

  // Ensure blur resets if send closes keyboard without firing resize
  if (input) {
    input.addEventListener('blur', () => setTimeout(onKeyboardResize, 60));
  }
})();
