import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
const tagline = document.querySelector("#tagline");
const sendBtn = document.querySelector(".sendBtn");
const userText = document.querySelector(".userText");
const chatContainer = document.querySelector(".chatContainer");
const typer = document.querySelector(".typer");
const actionBar = document.querySelector(".actionBar");
const modal = document.getElementById("loginPopup");
const loginBtn = document.getElementById("loginBtn");
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
  
  // FIX: Get selected model category
  const modelCategory = document.getElementById('modelCategory');
  const selectedModel = modelCategory ? modelCategory.value : 'text';
  
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
      body: JSON.stringify({ 
        message: text,
        promptType: selectedModel
      })
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
  
  const lastActualAiMessage = getLastPromptMessage();
  
  if (lastActualAiMessage) {
    const text = lastActualAiMessage.textContent;
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  } else {
    alert("No prompt to copy!");
  }})

if(loginBtn)
  {loginBtn.onclick = function() {
  modal.style.display = "flex";
}}
if(span){
span.onclick = function() {
  modal.style.display = "none";
}}

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

    if (!nameValue) {
      alert("Please give your prompt a name!");
      return;
    }

    const lastActualAiMessage = getLastPromptMessage();
    
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

function getLastPromptMessage() {
const allAiMessages = document.querySelectorAll(".aiMessage");
    
for (let i = allAiMessages.length - 1; i >= 0; i--) {
  if (!allAiMessages[i].classList.contains('info') && 
      !allAiMessages[i].classList.contains('error')) {
      return allAiMessages[i];
      }}
      return null;  }

 //voicefeature

const voiceBtn = document.querySelector(".voiceText");

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  alert("Speech recognition not supported");
  throw new Error("SpeechRecognition not supported");
}

const recognition = new SpeechRecognition();
recognition.lang = "en-US";
recognition.interimResults = true;
recognition.continuous = true;

let isListening = false;
let finalTranscript = "";

voiceBtn.addEventListener("click", () => {
  if (!isListening) {
    recognition.start();
    isListening = true;
    voiceBtn.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" fill=\"currentColor\" aria-hidden=\"true\">\n  <rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" fill=\"white\"/>\n</svg>";
    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }
      userText.value = finalTranscript + interimTranscript;
    }
  } else {
    recognition.stop();
    isListening = false;
    voiceBtn.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" width=\"22\" height=\"22\" fill=\"currentColor\" aria-hidden=\"true\">\n  <path d=\"M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2zM11 19h2v3h-2z\"/>\n</svg>";  
  }});

  const categoryModelSelect = document.getElementById("categoryModel");


function resizeSelect(el) {
  const temp = document.createElement("span");
  temp.style.visibility = "hidden";
  temp.style.position = "absolute";
  temp.style.whiteSpace = "nowrap";
  temp.style.font = getComputedStyle(el).font;
  temp.textContent = el.options[el.selectedIndex].text;

  document.body.appendChild(temp);
  el.style.width = temp.offsetWidth + 15+ "px";
  document.body.removeChild(temp);
}

resizeSelect(categoryModelSelect);
categoryModelSelect.addEventListener("change", () => resizeSelect(categoryModelSelect));
 
