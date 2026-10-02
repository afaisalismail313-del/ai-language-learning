// ==========================================
// 1. MAIN ENGLISH LEARNING CLASS
// ==========================================
class EnglishLearning {
    constructor() {
        this.synth = window.speechSynthesis;
        this.currentVoice = null;
        this.init();
    }

    init() {
        this.loadVoices();
        this.loadDailyLesson();
        this.loadPhrases();
    }

    loadVoices() {
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => {
                const voices = this.synth.getVoices();
                this.currentVoice = voices.find(v => v.lang.includes('en-US')) || voices[0];
            };
        }
    }

    async loadDailyLesson() {
        try {
            const response = await fetch('../data/english-lessons.json');
            const data = await response.json();
            const today = new Date().getDay();
            const lesson = data.lessons[today % data.lessons.length];
            
            document.getElementById('lesson-title').textContent = lesson.title;
            document.getElementById('lesson-text').textContent = lesson.description;
            
            const vocabList = document.getElementById('vocabulary-list');
            vocabList.innerHTML = '';
            
            lesson.vocabulary.forEach(word => {
                const item = document.createElement('div');
                item.className = 'vocab-item';
                item.innerHTML = `
                    <div>
                        <div class="vocab-word">${word.word}</div>
                        <div class="vocab-meaning">${word.meaning}</div>
                    </div>
                    <button class="btn btn-primary" onclick="speakWord('${word.word}')">
                        <i class="fas fa-volume-up"></i>
                    </button>
                `;
                vocabList.appendChild(item);
            });
        } catch (error) {
            console.error('Error loading lesson:', error);
        }
    }

    async loadPhrases() {
        try {
            const response = await fetch('../data/english-phrases.json');
            const data = await response.json();
            const grid = document.getElementById('phrases-grid');
            grid.innerHTML = '';
            
            data.phrases.forEach(phrase => {
                const card = document.createElement('div');
                card.className = 'phrase-card';
                card.onclick = () => speakText(phrase.text);
                card.innerHTML = `
                    <div class="phrase-text">${phrase.text}</div>
                    <div class="phrase-translation">${phrase.translation}</div>
                `;
                grid.appendChild(card);
            });
        } catch (error) {
            console.error('Error loading phrases:', error);
        }
    }
}

// ==========================================
// 2. BASIC TEXT & SPEECH FUNCTIONS
// ==========================================
function speakText(text) {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
}

function speakWord(word) {
    speakText(word);
}

function sendMessage() {
    const input = document.getElementById('user-input');
    const message = input.value.trim();
    if (!message) return;
    
    addMessage(message, 'user');
    input.value = '';
    
    setTimeout(() => {
        const responses = [
            "Great! Keep practicing!",
            "Excellent work!",
            "Perfect! Continue learning.",
            "Well done!"
        ];
        const response = responses[Math.floor(Math.random() * responses.length)];
        addMessage(response, 'ai');
        speakText(response);
        
        if (window.app) {
            window.app.addWords(message.split(' ').length);
        }
    }, 1000);
}

function addMessage(text, sender) {
    const chat = document.getElementById('chat-messages');
    const msg = document.createElement('div');
    msg.className = `message ${sender}-message`;
    msg.innerHTML = `
        <div class="message-avatar"><i class="fas fa-${sender === 'ai' ? 'robot' : 'user'}"></i></div>
        <div class="message-content"><p>${text}</p></div>
    `;
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
}

function startLesson() {
    document.querySelector('.conversation-section').scrollIntoView({ behavior: 'smooth' });
}

// ==========================================
// 3. VOICE CONVERSATION TWO-WAY (BARU)
// ==========================================
let voiceRecognition = null;
let isVoiceConversationActive = false;
let isSpeaking = false;

function startVoiceConversation() {
    // Cek dukungan browser
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Browser Anda tidak mendukung Speech Recognition. Gunakan Google Chrome!');
        return;
    }

    // Sembunyikan tombol start, tampilkan stop
    document.getElementById('btn-start-voice').style.display = 'none';
    document.getElementById('btn-stop-voice').style.display = 'flex';
    
    // Aktifkan visualizer
    document.getElementById('voice-visualizer').classList.add('active');
    
    isVoiceConversationActive = true;
    updateVoiceStatus('listening', 'Mendengarkan... Silakan bicara');

    // Setup Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    voiceRecognition = new SpeechRecognition();
    
    voiceRecognition.lang = 'en-US';
    voiceRecognition.continuous = true;  // Terus mendengarkan
    voiceRecognition.interimResults = false;
    
    voiceRecognition.onstart = () => {
        console.log('Voice recognition started');
    };
    
    voiceRecognition.onresult = (event) => {
        const lastResult = event.results[event.results.length - 1];
        const transcript = lastResult[0].transcript;
        
        if (lastResult.isFinal && transcript.trim()) {
            handleUserVoiceInput(transcript);
        }
    };
    
    voiceRecognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
            updateVoiceStatus('listening', 'Tidak ada suara terdeteksi. Coba lagi...');
        } else if (event.error === 'audio-capture') {
            updateVoiceStatus('error', 'Tidak ada mikrofon terdeteksi');
        } else if (event.error === 'not-allowed') {
            updateVoiceStatus('error', 'Izin mikrofon ditolak. Periksa pengaturan browser.');
        }
    };
    
    voiceRecognition.onend = () => {
        // Auto restart jika masih dalam mode percakapan dan AI tidak sedang bicara
        if (isVoiceConversationActive && !isSpeaking) {
            try {
                voiceRecognition.start();
            } catch (e) {
                console.log('Restart recognition');
            }
        }
    };
    
    try {
        voiceRecognition.start();
    } catch (e) {
        console.error('Error starting recognition:', e);
    }
    
    // Sambutan awal dari AI
    setTimeout(() => {
        aiSpeak("Hello! I'm ready to have a conversation with you. Please start speaking!");
    }, 500);
}

function stopVoiceConversation() {
    isVoiceConversationActive = false;
    
    if (voiceRecognition) {
        voiceRecognition.stop();
        voiceRecognition = null;
    }
    
    window.speechSynthesis.cancel();
    isSpeaking = false;
    
    // Tampilkan tombol start, sembunyikan stop
    document.getElementById('btn-start-voice').style.display = 'flex';
    document.getElementById('btn-stop-voice').style.display = 'none';
    
    // Nonaktifkan visualizer
    document.getElementById('voice-visualizer').classList.remove('active');
    
    updateVoiceStatus('idle', 'Percakapan dihentikan');
}

function handleUserVoiceInput(text) {
    if (!isVoiceConversationActive) return;
    
    // Tambahkan ke log percakapan
    addConversationLog(text, 'user');
    
    // Update status
    updateVoiceStatus('processing', 'AI sedang memproses...');
    
    // Hentikan recognition sementara saat AI berbicara
    if (voiceRecognition) {
        voiceRecognition.stop();
    }
    
    // Generate respons AI
    setTimeout(() => {
        const response = generateSmartResponse(text);
        aiSpeak(response);
    }, 800);
}

function aiSpeak(text) {
    if (!isVoiceConversationActive) return;
    
    isSpeaking = true;
    updateVoiceStatus('speaking', 'AI sedang berbicara...');
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;  // Sedikit lebih lambat agar mudah dipahami untuk belajar
    utterance.pitch = 1;
    
    // Cari voice English terbaik
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.includes('en-US')) || voices[0];
    if (englishVoice) utterance.voice = englishVoice;
    
    utterance.onend = () => {
        isSpeaking = false;
        updateVoiceStatus('listening', 'Mendengarkan... Giliran Anda bicara');
        
        // Restart recognition setelah AI selesai bicara
        if (isVoiceConversationActive && voiceRecognition) {
            setTimeout(() => {
                try {
                    voiceRecognition.start();
                } catch (e) {
                    console.log('Auto restart recognition');
                }
            }, 500);
        }
    };
    
    utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        isSpeaking = false;
        updateVoiceStatus('listening', 'Mendengarkan...');
    };
    
    window.speechSynthesis.speak(utterance);
}

function generateSmartResponse(userText) {
    const lowerText = userText.toLowerCase();
    
    // Respons berdasarkan konteks kata kunci
    if (lowerText.includes('hello') || lowerText.includes('hi')) {
        return "Hello there! How are you doing today?";
    }
    else if (lowerText.includes('how are you')) {
        return "I'm doing great, thank you! How about you? What did you do today?";
    }
    else if (lowerText.includes('my name is') || lowerText.includes('i am')) {
        return "Nice to meet you! That's a wonderful name. Where are you from?";
    }
    else if (lowerText.includes('thank you') || lowerText.includes('thanks')) {
        return "You're welcome! Is there anything else you'd like to talk about?";
    }
    else if (lowerText.includes('weather')) {
        return "The weather is an interesting topic! Do you prefer sunny or rainy days?";
    }
    else if (lowerText.includes('food') || lowerText.includes('eat') || lowerText.includes('hungry')) {
        return "Food is great! What's your favorite dish? I'd love to hear about it.";
    }
    else if (lowerText.includes('work') || lowerText.includes('job') || lowerText.includes('busy')) {
        return "Work is important! Tell me more about what you do. What do you enjoy about it?";
    }
    else if (lowerText.includes('learn') || lowerText.includes('study') || lowerText.includes('english')) {
        return "Learning is wonderful! You're doing great practicing English. What topic interests you most?";
    }
    else if (lowerText.includes('bye') || lowerText.includes('goodbye') || lowerText.includes('see you')) {
        return "Goodbye! It was nice talking to you. See you next time!";
    }
    else if (lowerText.includes('help')) {
        return "Of course! I'm here to help. What would you like to know?";
    }
    else {
        // Respons generik yang mendorong percakapan berlanjut
        const genericResponses = [
            "That's interesting! Tell me more about it.",
            "I see! What else would you like to share?",
            "Great! Can you elaborate on that?",
            "Wonderful! How does that make you feel?",
            "Nice! What do you think about that?",
            "I understand. What would you like to talk about next?"
        ];
        return genericResponses[Math.floor(Math.random() * genericResponses.length)];
    }
}

function addConversationLog(text, sender) {
    const log = document.getElementById('conversation-log');
    const entry = document.createElement('div');
    entry.className = `log-entry ${sender}-entry`;
    
    const icon = sender === 'user' ? 'fa-user' : 'fa-robot';
    entry.innerHTML = `
        <i class="fas ${icon}"></i>
        <p>${text}</p>
    `;
    
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
    
    // Update progress belajar
    if (window.app && sender === 'user') {
        window.app.addWords(text.split(' ').length);
    }
}

function updateVoiceStatus(state, message) {
    const indicator = document.getElementById('status-indicator');
    const dot = indicator.querySelector('.status-dot');
    const textEl = indicator.querySelector('.status-text');
    
    // Reset classes
    dot.className = 'status-dot';
    
    if (state === 'listening') {
        dot.classList.add('listening');
    } else if (state === 'speaking') {
        dot.classList.add('speaking');
    }
    
    textEl.textContent = message;
}

// ==========================================
// 4. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    window.englishApp = new EnglishLearning();
});
