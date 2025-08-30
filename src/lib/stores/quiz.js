// src/lib/stores/quiz.js
import { writable, derived } from 'svelte/store';

export const quizStore = writable({
    // Quiz Configuration
    setId: null,
    flashcards: [],
    mode: 'flashcard', // 'flashcard' | 'test'

    // Test Mode Settings
    testSettings: {
        instantFeedback: true,
        shuffleCards: false,
        questionTypes: ['multiple_choice', 'true_false', 'written'],
        repeatIncorrect: true
    },

    // Current State
    currentIndex: 0,
    isFlipped: false,
    showAnswer: false,

    // Progress Tracking
    responses: [], // { cardId, userAnswer, isCorrect, timeSpent, status: 'answered'|'skipped'|'pending' }
    wrongAnswers: [], // Cards to repeat
    skippedCards: [], // Cards to retry

    // Session Info
    sessionStartTime: null,
    cardStartTime: null,
    isCompleted: false
});

// Derived stores for computed values
export const currentCard = derived(
    quizStore,
    ($quiz) => $quiz.flashcards[$quiz.currentIndex] || null
);

export const progress = derived(
    quizStore,
    ($quiz) => {
        const total = $quiz.flashcards.length;
        const answered = $quiz.responses.filter(r => r.status === 'answered').length;
        const skipped = $quiz.responses.filter(r => r.status === 'skipped').length;
        const correct = $quiz.responses.filter(r => r.isCorrect).length;

        return {
            total,
            answered,
            skipped,
            correct,
            incorrect: answered - correct,
            percentage: total > 0 ? Math.round((answered / total) * 100) : 0,
            accuracy: answered > 0 ? Math.round((correct / answered) * 100) : 0
        };
    }
);

// Quiz Actions
export const quizActions = {
    // Initialize quiz
    initializeQuiz(flashcards, mode = 'flashcard', settings = {}) {
        quizStore.update(quiz => ({
            ...quiz,
            flashcards: settings.shuffleCards ? shuffle(flashcards) : flashcards,
            mode,
            testSettings: { ...quiz.testSettings, ...settings },
            currentIndex: 0,
            responses: [],
            wrongAnswers: [],
            skippedCards: [],
            sessionStartTime: new Date(),
            cardStartTime: new Date(),
            isCompleted: false,
            isFlipped: false,
            showAnswer: false
        }));
    },

    // Flashcard Mode Actions
    flipCard() {
        quizStore.update(quiz => ({
            ...quiz,
            isFlipped: !quiz.isFlipped
        }));
    },

    markCard(difficulty) {
        quizStore.update(quiz => {
            const cardId = quiz.flashcards[quiz.currentIndex]?.id;
            const timeSpent = new Date() - quiz.cardStartTime;

            const response = {
                cardId,
                difficulty, // 'easy' | 'medium' | 'hard' | 'again'
                timeSpent,
                status: 'reviewed',
                timestamp: new Date()
            };

            return {
                ...quiz,
                responses: [...quiz.responses, response]
            };
        });

        this.nextCard();
    },

    // Test Mode Actions
    answerQuestion(userAnswer, questionType) {
        quizStore.update(quiz => {
            const currentCard = quiz.flashcards[quiz.currentIndex];
            const timeSpent = new Date() - quiz.cardStartTime;
            let isCorrect = false;

            // Check answer based on question type
            switch (questionType) {
                case 'multiple_choice':
                    if (currentCard.options) {
                        const correctOption = currentCard.options.find(opt => opt.isCorrect);
                        isCorrect = userAnswer === correctOption?.text;
                    }
                    break;
                case 'true_false':
                    // Assume back_text contains 'true' or 'false'
                    isCorrect = userAnswer.toLowerCase() === currentCard.back_text.toLowerCase();
                    break;
                case 'written':
                    // Simple string comparison (can be enhanced)
                    isCorrect = userAnswer.trim().toLowerCase() === currentCard.back_text.trim().toLowerCase();
                    break;
            }

            const response = {
                cardId: currentCard.id,
                userAnswer,
                correctAnswer: currentCard.back_text,
                isCorrect,
                timeSpent,
                status: 'answered',
                questionType,
                timestamp: new Date()
            };

            // Add to wrong answers if incorrect (for repetition)
            const newWrongAnswers = isCorrect ?
                quiz.wrongAnswers :
                [...quiz.wrongAnswers, currentCard];

            return {
                ...quiz,
                responses: [...quiz.responses, response],
                wrongAnswers: newWrongAnswers,
                showAnswer: quiz.testSettings.instantFeedback
            };
        });
    },

    skipQuestion() {
        quizStore.update(quiz => {
            const currentCard = quiz.flashcards[quiz.currentIndex];
            const timeSpent = new Date() - quiz.cardStartTime;

            const response = {
                cardId: currentCard.id,
                userAnswer: null,
                isCorrect: false,
                timeSpent,
                status: 'skipped',
                timestamp: new Date()
            };

            return {
                ...quiz,
                responses: [...quiz.responses, response],
                skippedCards: [...quiz.skippedCards, currentCard]
            };
        });

        this.nextCard();
    },

    // Navigation
    nextCard() {
        quizStore.update(quiz => {
            let nextIndex = quiz.currentIndex + 1;

            // If we've reached the end, check for wrong answers to repeat
            if (nextIndex >= quiz.flashcards.length) {
                if (quiz.mode === 'test' && quiz.testSettings.repeatIncorrect && quiz.wrongAnswers.length > 0) {
                    // Add wrong answers back to the queue
                    const remainingCards = [...quiz.skippedCards, ...quiz.wrongAnswers];
                    return {
                        ...quiz,
                        flashcards: [...quiz.flashcards, ...remainingCards],
                        wrongAnswers: [],
                        skippedCards: [],
                        currentIndex: quiz.flashcards.length,
                        cardStartTime: new Date(),
                        isFlipped: false,
                        showAnswer: false
                    };
                } else {
                    // Quiz completed
                    return {
                        ...quiz,
                        isCompleted: true
                    };
                }
            }

            return {
                ...quiz,
                currentIndex: nextIndex,
                cardStartTime: new Date(),
                isFlipped: false,
                showAnswer: false
            };
        });
    },

    previousCard() {
        quizStore.update(quiz => ({
            ...quiz,
            currentIndex: Math.max(0, quiz.currentIndex - 1),
            cardStartTime: new Date(),
            isFlipped: false,
            showAnswer: false
        }));
    },

    goToCard(index) {
        quizStore.update(quiz => ({
            ...quiz,
            currentIndex: index,
            cardStartTime: new Date(),
            isFlipped: false,
            showAnswer: false
        }));
    },

    // Settings
    updateSettings(newSettings) {
        quizStore.update(quiz => ({
            ...quiz,
            testSettings: { ...quiz.testSettings, ...newSettings }
        }));
    },

    // Star/Favorite cards
    toggleStar(cardId) {
        // This would also update the database
        quizStore.update(quiz => ({
            ...quiz,
            flashcards: quiz.flashcards.map(card =>
                card.id === cardId ? { ...card, is_starred: !card.is_starred } : card
            )
        }));
    }
};

// Utility functions
function shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}