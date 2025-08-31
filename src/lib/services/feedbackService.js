// src/lib/services/feedbackService.js
import { ProgressService } from './progressService.js';
import { toast } from '$lib/stores/toast.js';

export class FeedbackService {
    /**
     * Process answer and provide feedback
     * @param {Object} question - Question object
     * @param {string} userAnswer - User's answer
     * @param {string} setId - Flashcard set ID
     * @param {string} mode - Study mode ('learn', 'test', 'match')
     * @param {Object} options - Feedback options
     * @returns {Object} Feedback result
     */
    static processAnswer(question, userAnswer, setId, mode = 'learn', options = {}) {
        const {
            autoProgress = false,
            progressDelay = 1500,
            recordProgress = true,
            showCorrectAnswer = true
        } = options;

        // Ensure we have a valid question object
        if (!question || typeof question !== 'object') {
            console.error('FeedbackService: Invalid question object provided');
            return {
                isCorrect: false,
                feedbackMessage: 'Invalid question',
                feedbackType: 'error',
                timeSpent: 0,
                shouldAutoProgress: false,
                progressDelay: progressDelay,
                correctAnswer: '',
                userAnswer,
                attempts: 1
            };
        }

        const isCorrect = userAnswer === question.correctAnswer;
        const startTime = question.startTime || Date.now();
        const timeSpent = Date.now() - startTime;

        // Update question object (but be careful about mutations)
        try {
            question.userAnswer = userAnswer;
            question.isCorrect = isCorrect;
            question.isAnswered = true;
            question.timeSpent = timeSpent;
            question.attempts = (question.attempts || 0) + 1;
        } catch (error) {
            console.warn('FeedbackService: Could not update question object:', error);
        }

        // Record progress if enabled
        if (recordProgress && question.flashcard_id && setId) {
            try {
                ProgressService.recordAttempt(
                    question.flashcard_id,
                    setId,
                    mode,
                    isCorrect,
                    timeSpent,
                    userAnswer
                );
            } catch (error) {
                console.error('FeedbackService: Error recording progress:', error);
            }
        }

        // Generate feedback message
        let feedbackMessage = '';
        let feedbackType = '';

        if (isCorrect) {
            feedbackMessage = 'Correct!';
            feedbackType = 'success';
        } else {
            feedbackMessage = showCorrectAnswer
                ? `Incorrect. The correct answer is: ${question.correctAnswer}`
                : 'Incorrect.';
            feedbackType = 'error';
        }

        return {
            isCorrect,
            feedbackMessage,
            feedbackType,
            timeSpent,
            shouldAutoProgress: autoProgress && isCorrect,
            progressDelay: progressDelay,
            correctAnswer: question.correctAnswer,
            userAnswer,
            attempts: question.attempts || 1
        };
    }

    /**
     * Show feedback to user
     * @param {Object} feedbackResult - Result from processAnswer
     * @param {Function} onComplete - Callback when feedback is complete
     */
    static showFeedback(feedbackResult, onComplete = null) {
        const { feedbackType, feedbackMessage, shouldAutoProgress, progressDelay } = feedbackResult;

        // Auto progress if enabled
        if (shouldAutoProgress && onComplete) {
            setTimeout(() => {
                onComplete(feedbackResult);
            }, progressDelay);
        }

        return feedbackResult;
    }

    /**
     * Calculate study session results
     * @param {Array} questions - Array of answered questions
     * @returns {Object} Session statistics
     */
    static calculateSessionResults(questions) {
        const totalQuestions = questions.length;
        const answeredQuestions = questions.filter(q => q.isAnswered);
        const correctAnswers = questions.filter(q => q.isCorrect);
        const incorrectAnswers = questions.filter(q => q.isAnswered && !q.isCorrect);

        const totalTime = questions.reduce((total, q) => total + (q.timeSpent || 0), 0);
        const averageTime = totalQuestions > 0 ? totalTime / totalQuestions : 0;

        const accuracy = answeredQuestions.length > 0
            ? (correctAnswers.length / answeredQuestions.length) * 100
            : 0;

        return {
            totalQuestions,
            answeredQuestions: answeredQuestions.length,
            correctAnswers: correctAnswers.length,
            incorrectAnswers: incorrectAnswers.length,
            accuracy: Math.round(accuracy),
            totalTime,
            averageTime: Math.round(averageTime),
            completionRate: Math.round((answeredQuestions.length / totalQuestions) * 100)
        };
    }
}
