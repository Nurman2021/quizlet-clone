export class QuestionService {
    /**
     * Generate multiple choice questions
     * @param {Array} flashcards - Array of flashcard objects
     * @param {Object} options - Configuration options
     * @returns {Array} Generated questions
     */
    static generateMultipleChoice(flashcards, options = {}) {
        const {
            maxOptions = 4,
            questionType = 'definition', // 'definition' or 'term'
            filterStarred = false,
            shuffleQuestions = true,
            dynamicOptions = true // Auto-adjust options based on available cards
        } = options;

        // Early return for invalid input
        if (!flashcards?.length) {
            console.warn('QuestionService: No flashcards provided');
            return [];
        }

        // Filter starred if requested - create new array to avoid mutations
        let availableCards = filterStarred
            ? flashcards.filter(card => card.is_starred)
            : [...flashcards]; // Create a copy to avoid mutations

        if (availableCards.length === 0) {
            console.warn('QuestionService: No cards available after filtering');
            return [];
        }

        // Shuffle questions if requested
        if (shuffleQuestions) {
            availableCards = availableCards.sort(() => Math.random() - 0.5);
        }

        return availableCards.map((card, index) => {
            // Determine correct answer based on question type
            const correctAnswer = questionType === 'definition' ? card.definition : card.term;
            const questionText = questionType === 'definition' ? card.term : card.definition;

            let options = [correctAnswer];

            // Get other cards for wrong answers - create new array to avoid mutations
            const otherCards = flashcards.filter(c => c.id !== card.id);

            // Dynamic options based on available cards
            const actualMaxOptions = dynamicOptions
                ? Math.min(maxOptions, flashcards.length)
                : maxOptions;

            // Generate wrong answers
            const shuffledOtherCards = [...otherCards].sort(() => Math.random() - 0.5);

            for (let i = 0; i < shuffledOtherCards.length && options.length < actualMaxOptions; i++) {
                const wrongAnswer = questionType === 'definition'
                    ? shuffledOtherCards[i].definition
                    : shuffledOtherCards[i].term;

                if (!options.includes(wrongAnswer)) {
                    options.push(wrongAnswer);
                }
            }

            // Shuffle final options
            options = options.sort(() => Math.random() - 0.5);

            return {
                id: `question-${card.id}-${index}`, // Make ID more unique
                type: 'multiple_choice',
                question: questionText, // Changed from questionText for consistency
                correctAnswer: correctAnswer,
                options: options,
                flashcard_id: card.id,
                term: card.term,
                definition: card.definition,
                userAnswer: null,
                isCorrect: false,
                isAnswered: false,
                timeSpent: 0,
                attempts: 0,
                startTime: null
            };
        });
    }

    /**
     * Generate matching pairs for match component
     * @param {Array} flashcards - Array of flashcard objects
     * @param {Object} options - Configuration options
     * @returns {Object} Generated matching data
     */
    static generateMatching(flashcards, options = {}) {
        const {
            filterStarred = false,
            shufflePairs = true,
            maxPairs = 6
        } = options;

        if (!flashcards?.length) return { terms: [], definitions: [] };

        let availableCards = filterStarred
            ? flashcards.filter(card => card.is_starred)
            : flashcards;

        // Limit to maxPairs
        if (availableCards.length > maxPairs) {
            availableCards = availableCards.slice(0, maxPairs);
        }

        const terms = availableCards.map((card, index) => ({
            id: `term-${card.id}`,
            text: card.term,
            flashcard_id: card.id,
            matched: false,
            position: index
        }));

        const definitions = availableCards.map((card, index) => ({
            id: `def-${card.id}`,
            text: card.definition,
            flashcard_id: card.id,
            matched: false,
            position: index
        }));

        // Shuffle if requested
        if (shufflePairs) {
            terms.sort(() => Math.random() - 0.5);
            definitions.sort(() => Math.random() - 0.5);
        }

        return {
            terms,
            definitions,
            totalPairs: availableCards.length,
            matches: [],
            startTime: Date.now()
        };
    }

    /**
     * Generate test questions with mixed types
     * @param {Array} flashcards - Array of flashcard objects
     * @param {Object} options - Configuration options
     * @returns {Array} Generated test questions
     */
    static generateTest(flashcards, options = {}) {
        const {
            questionTypes = ['multiple_choice', 'true_false', 'written'],
            questionCount = 10,
            filterStarred = false,
            difficulty = 'mixed' // 'easy', 'medium', 'hard', 'mixed'
        } = options;

        // Implementation for test generation
        // This would be more complex based on your test requirements
        return [];
    }
}