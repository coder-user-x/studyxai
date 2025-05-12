const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

const LOCAL_STORAGE_KEY = 'studyxaiChatHistory';

// Load history from local storage on page load
document.addEventListener('DOMContentLoaded', () => {
    loadChatHistory();
});

function loadChatHistory() {
    const history = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (history) {
        const messages = JSON.parse(history);
         // Clear initial welcome message before loading history IF history exists
         if (messages.length > 0) {
             chatBox.innerHTML = ''; // Remove the default HTML welcome message
         }
        messages.forEach(msg => {
            displayMessage(msg.text, msg.sender);
        });
        // Scroll to the bottom after loading
        chatBox.scrollTop = chatBox.scrollHeight;
    } else {
         // If no history, the initial message from index.html is already there.
         // Just scroll to the bottom if needed.
         chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// Function to display a message in the chat box
function displayMessage(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);
    messageElement.innerHTML = `<p>${text}</p>`; // Use innerHTML for potential formatting if needed later
    chatBox.appendChild(messageElement);
    // Scroll to the bottom
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Function to save a message to local storage
function saveMessage(text, sender) {
    const history = localStorage.getItem(LOCAL_STORAGE_KEY);
    const messages = history ? JSON.parse(history) : [];
     // Check if the *initial* welcome message is still there before pushing
    if (messages.length === 0 && chatBox.querySelector('.ai-message p')?.textContent === "Hello! I'm StudyxAi. How can I help you study today?") {
         // If so, add the initial message to the history before adding the new one
         messages.push({ text: "Hello! I'm StudyxAi. How can I help you study today?", sender: 'ai' });
    }
    messages.push({ text, sender });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
}


// Function to send message to backend API
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return; // Don't send empty messages

    // Display user message immediately
    displayMessage(message, 'user');
    saveMessage(message, 'user'); // Save user message

    // Clear input field
    userInput.value = '';
    sendBtn.disabled = true; // Disable button while waiting

    try {
        // Fetch from the backend API endpoint
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.message;

        // Display AI response
        displayMessage(aiResponse, 'ai');
        saveMessage(aiResponse, 'ai'); // Save AI response

    } catch (error) {
        console.error("Error sending message:", error);
        displayMessage("Sorry, I encountered an error. Please try again.", 'ai');
        saveMessage("Sorry, I encountered an error. Please try again.", 'ai'); // Optionally save the error message
    } finally {
        sendBtn.disabled = false; // Re-enable button
    }
}

// Event listeners
sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent default form submission behavior
        sendMessage();
    }
});

