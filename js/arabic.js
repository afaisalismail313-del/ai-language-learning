// ==========================================
// 1. MAIN ARABIC LEARNING CLASS
// ==========================================
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
                this.currentVoice = voices.find(v => v.lang.includes('ar')) || 
                                   voices.find(v => v.lang.includes('ar-SA')) || voices[0];
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
            console.error('Error loading lesson:', error);
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
            console.error('Error loading phrases:', error);
        }
    }
}

// ==========================================
// 2. BASIC TEXT & SPEECH FUNCTIONS
// ==========================================
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

// ==========================================
// 3. VOICE CONVERSATION TWO-WAY (ARABIC)
// ==========================================
let voiceRecognitionAr = null;
let isVoiceConversationActiveAr = false;
let isSpeakingAr = false;

function startVoiceConversationArabic() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('متصفحك لا يدعم التعرف على الصوت. استخدم Google Chrome!');
        return;
    }

    document.getElementById('btn-start-voice-ar').style.display = 'none';
    document.getElementById('btn-stop-voice-ar').style.display = 'flex';
    document.getElementById('voice-visualizer-ar').classList.add('active');
    
    isVoiceConversationActiveAr = true;
    updateVoiceStatusAr('listening', 'جاري الاستماع... تحدث الآن');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    voiceRecognitionAr = new SpeechRecognition();
    
    voiceRecognitionAr.lang = 'ar-SA';
    voiceRecognitionAr.continuous = true;
    voiceRecognitionAr.interimResults = false;
    
    voiceRecognitionAr.onstart = () => {
        console.log('Voice recognition (Arabic) started');
    };
    
    voiceRecognitionAr.onresult = (event) => {
        const lastResult = event.results[event.results.length - 1];
        const transcript = lastResult[0].transcript;
        
        if (lastResult.isFinal && transcript.trim()) {
            handleUserVoiceInputAr(transcript);
        }
    };
    
    voiceRecognitionAr.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
            updateVoiceStatusAr('listening', 'لم يتم اكتشاف صوت. حاول مرة أخرى');
        } else if (event.error === 'audio-capture') {
            updateVoiceStatusAr('error', 'لا يوجد ميكروفون');
        } else if (event.error === 'not-allowed') {
            updateVoiceStatusAr('error', 'تم رفض إذن الميكروفون');
        }
    };
    
    voiceRecognitionAr.onend = () => {
        if (isVoiceConversationActiveAr && !isSpeakingAr) {
            try {
                voiceRecognitionAr.start();
            } catch (e) {
                console.log('Restart recognition');
            }
        }
    };
    
    try {
        voiceRecognitionAr.start();
    } catch (e) {
        console.error('Error starting recognition:', e);
    }
    
    setTimeout(() => {
        aiSpeakAr("مرحباً! أنا جاهز للتحدث معك. ابدأ بالتحدث من فضلك!");
    }, 500);
}

function stopVoiceConversationArabic() {
    isVoiceConversationActiveAr = false;
    
    if (voiceRecognitionAr) {
        voiceRecognitionAr.stop();
        voiceRecognitionAr = null;
    }
    
    window.speechSynthesis.cancel();
    isSpeakingAr = false;
    
    document.getElementById('btn-start-voice-ar').style.display = 'flex';
    document.getElementById('btn-stop-voice-ar').style.display = 'none';
    document.getElementById('voice-visualizer-ar').classList.remove('active');
    
    updateVoiceStatusAr('idle', 'تم إيقاف المحادثة');
}

function handleUserVoiceInputAr(text) {
    if (!isVoiceConversationActiveAr) return;
    
    addConversationLogAr(text, 'user');
    updateVoiceStatusAr('processing', 'الذكاء الاصطناعي يعالج...');
    
    if (voiceRecognitionAr) {
        voiceRecognitionAr.stop();
    }
    
    setTimeout(() => {
        const response = generateSmartResponseAr(text);
        aiSpeakAr(response);
    }, 800);
}

function aiSpeakAr(text) {
    if (!isVoiceConversationActiveAr) return;
    
    isSpeakingAr = true;
    updateVoiceStatusAr('speaking', 'الذكاء الاصطناعي يتحدث...');
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.85; // Sedikit lebih lambat agar jelas untuk belajar
    
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(v => v.lang.includes('ar')) || 
                        voices.find(v => v.lang.includes('ar-SA')) || voices[0];
    if (arabicVoice) utterance.voice = arabicVoice;
    
    utterance.onend = () => {
        isSpeakingAr = false;
        updateVoiceStatusAr('listening', 'جاري الاستماع... دورك للتحدث');
        
        if (isVoiceConversationActiveAr && voiceRecognitionAr) {
            setTimeout(() => {
                try {
                    voiceRecognitionAr.start();
                } catch (e) {
                    console.log('Auto restart');
                }
            }, 500);
        }
    };
    
    window.speechSynthesis.speak(utterance);
}

function generateSmartResponseAr(userText) {
    const responses = {
        'مرحبا': 'أهلاً وسهلاً! كيف حالك اليوم؟',
        'كيف حالك': 'أنا بخير، شكراً! وأنت؟ ماذا فعلت اليوم؟',
        'اسمي': 'تشرفت بمعرفتك! اسم جميل. من أين أنت؟',
        'شكرا': 'على الرحب والسعة! هل هناك شيء آخر تريد التحدث عنه؟',
        'طقس': 'الطقس موضوع مثير! هل تفضل الأيام المشمسة أم الممطرة؟',
        'طعام': 'الطعام رائع! ما هو طبقك المفضل؟',
        'عمل': 'العمل مهم! أخبرني المزيد عن ما تفعله.',
        'تعلم': 'التعلم رائع! أنت تبلي بلاءً حسناً. ما الموضوع الذي يهمك؟',
        'مع السلامة': 'مع السلامة! كان سعيداً التحدث معك. أراك المرة القادمة!'
    };
    
    for (let key in responses) {
        if (userText.includes(key)) {
            return responses[key];
        }
    }
    
    const genericResponses = [
        'هذا مثير للاهتمام! أخبرني المزيد.',
        'أفهم! ماذا أيضاً تريد أن تشارك؟',
        'رائع! هل يمكنك التوضيح أكثر؟',
        'ممتاز! كيف يجعلك هذا تشعر؟',
        'جميل! ما رأيك في ذلك؟'
    ];
    
    return genericResponses[Math.floor(Math.random() * genericResponses.length)];
}

function addConversationLogAr(text, sender) {
    const log = document.getElementById('conversation-log-ar');
    const entry = document.createElement('div');
    entry.className = `log-entry ${sender}-entry`;
    
    const icon = sender === 'user' ? 'fa-user' : 'fa-robot';
    entry.innerHTML = `
        <i class="fas ${icon}"></i>
        <p>${text}</p>
    `;
    
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
    
    if (window.app && sender === 'user') {
        window.app.addWords(text.split(' ').length);
    }
}

function updateVoiceStatusAr(state, message) {
    const indicator = document.getElementById('status-indicator-ar');
    if (!indicator) return;
    
    const dot = indicator.querySelector('.status-dot');
    const textEl = indicator.querySelector('.status-text');
    
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
    window.arabicApp = new ArabicLearning();
});
