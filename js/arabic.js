class ArabicLearning {
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
                this.currentVoice = voices.find(v => v.lang.includes('ar')) || voices[0];
            };
        }
    }

    async loadDailyLesson() {
        try {
            const response = await fetch('../data/arabic-lessons.json');
            const data = await response.json();
            const today = new Date().getDay();
            const lesson = data.lessons[today % data.lessons.length];
            
            document.getElementById('lesson-title-ar').textContent = lesson.title;
            document.getElementById('lesson-text-ar').textContent = lesson.description;
            
            const vocabList = document.getElementById('vocabulary-list-ar');
            vocabList.innerHTML = '';
            
            lesson.vocabulary.forEach(word => {
                const item = document.createElement('div');
                item.className = 'vocab-item';
                item.innerHTML = `
                    <div>
                        <div class="vocab-word">${word.word}</div>
                        <div class="vocab-meaning">${word.meaning}</div>
                    </div>
                    <button class="btn btn-primary" onclick="speakWordArabic('${word.word}')">
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
            const response = await fetch('../data/arabic-phrases.json');
            const data = await response.json();
            const grid = document.getElementById('phrases-grid-ar');
            grid.innerHTML = '';
            
            data.phrases.forEach(phrase => {
                const card = document.createElement('div');
                card.className = 'phrase-card';
                card.onclick = () => speakTextArabic(phrase.text);
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

function speakTextArabic(text) {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
}

function speakWordArabic(word) {
    speakTextArabic(word);
}

function sendMessageArabic() {
    const input = document.getElementById('user-input-ar');
    const message = input.value.trim();
    if (!message) return;
    
    addMessageArabic(message, 'user');
    input.value = '';
    
    setTimeout(() => {
        const responses = [
            "ممتاز! استمر!",
            "رائع! عمل جيد",
            "أحسنت! واصل التعلم",
            "عمل ممتاز!"
        ];
        const response = responses[Math.floor(Math.random() * responses.length)];
        addMessageArabic(response, 'ai');
        speakTextArabic(response);
        
        if (window.app) {
            window.app.addWords(message.split(' ').length);
        }
    }, 1000);
}

function addMessageArabic(text, sender) {
    const chat = document.getElementById('chat-messages-ar');
    const msg = document.createElement('div');
    msg.className = `message ${sender}-message`;
    msg.innerHTML = `
        <div class="message-avatar"><i class="fas fa-${sender === 'ai' ? 'robot' : 'user'}"></i></div>
        <div class="message-content"><p>${text}</p></div>
    `;
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
}

function startLessonArabic() {
    document.querySelector('.conversation-section').scrollIntoView({ behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
    window.arabicApp = new ArabicLearning();
});
