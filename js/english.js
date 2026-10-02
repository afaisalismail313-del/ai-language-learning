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
            console.error('Error:', error);
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
            console.error('Error:', error);
        }
    }
}

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

document.addEventListener('DOMContentLoaded', () => {
    window.englishApp = new EnglishLearning();
});
