class LanguageLearningApp {
    constructor() {
        this.init();
    }

    init() {
        this.loadProgress();
        this.updateStats();
    }

    loadProgress() {
        this.streakDays = parseInt(localStorage.getItem('streakDays') || 0);
        this.lessonsCompleted = parseInt(localStorage.getItem('lessonsCompleted') || 0);
        this.wordsLearned = parseInt(localStorage.getItem('wordsLearned') || 0);
    }

    updateStats() {
        const streakEl = document.getElementById('streak-days');
        const lessonsEl = document.getElementById('lessons-completed');
        const wordsEl = document.getElementById('words-learned');

        if (streakEl) streakEl.textContent = this.streakDays;
        if (lessonsEl) lessonsEl.textContent = this.lessonsCompleted;
        if (wordsEl) wordsEl.textContent = this.wordsLearned;
    }

    saveProgress() {
        localStorage.setItem('streakDays', this.streakDays);
        localStorage.setItem('lessonsCompleted', this.lessonsCompleted);
        localStorage.setItem('wordsLearned', this.wordsLearned);
    }

    addWords(count) {
        this.wordsLearned += count;
        this.saveProgress();
        this.updateStats();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new LanguageLearningApp();
});
