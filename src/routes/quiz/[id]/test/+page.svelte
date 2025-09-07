<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase.js';
	import { toast } from '$lib/stores/toast.js';
	import { X, ChevronDown, Settings, ArrowLeft } from 'lucide-svelte';
	import SettingsModal from '$lib/components/Settings.svelte';
	import TestResults from '$lib/components/TestResults.svelte';
	import TestNavigation from '$lib/components/TestNavigation.svelte';
	import { ProgressService } from '$lib/services/progressService.js';

	// Icons for navigation
	import flascardIcon from '$lib/images/flashcard-img.png';
	import learnIcon from '$lib/images/learn-img.png';
	import testIcon from '$lib/images/terst-img.png';
	import matchIcon from '$lib/images/match-img.png';

	let setId = $page.params.id;
	let flashcardSet = $state(null);
	let isLoading = $state(true);

	// Test states
	let showSetup = $state(true); // Aktifkan modal setup
	let showResults = $state(false);
	let testInProgress = $state(false); // Mulai dengan setup mode
	let testQuestions = $state([]);
	let currentQuestionIndex = $state(0);
	let testAnswers = $state({});
	let testConfig = $state({
		// Setup awal - gunakan modal untuk konfigurasi
		questionCount: 10,
		trueFalse: true,
		multipleChoice: true,
		matching: true,
		written: true,
		answerWith: 'both',
		useStarredOnly: false,
		instantFeedback: false
	});
	let showQuestionList = $state(true);
	let showNavigationDropdown = $state(false);

	onMount(async () => {
		await loadFlashcardSet();
	});

	function toggleNavigationDropdown() {
		showNavigationDropdown = !showNavigationDropdown;
	}

	async function loadFlashcardSet() {
		try {
			isLoading = true;

			const { data: set, error: setError } = await supabase
				.from('flashcard_sets')
				.select('*')
				.eq('id', setId)
				.single();

			if (setError) throw setError;

			const { data: cards, error: cardsError } = await supabase
				.from('flashcards')
				.select('*')
				.eq('set_id', setId)
				.order('created_at');

			if (cardsError) throw cardsError;

			flashcardSet = { ...set, flashcards: cards };
		} catch (error) {
			console.error('Error loading flashcard set:', error);
			toast.error('Failed to load flashcard set', error.message);
			goto(`/quiz/${setId}`);
		} finally {
			isLoading = false;
		}
	}

	function startTest(event) {
		testConfig = event.detail;

		// Validate flashcard set exists
		if (!flashcardSet?.flashcards?.length) {
			toast.error('No flashcards available for test');
			console.error('No flashcards available in set');
			return;
		}

		// Generate questions based on config
		generateQuestions();

		// Only proceed if questions were generated successfully
		if (testQuestions.length > 0) {
			showSetup = false;
			testInProgress = true;
			toast.info('Test started!');

			// Add scroll listener for updating current question index
			const handleScroll = () => {
				if (testInProgress) {
					updateCurrentQuestionFromScroll();
				}
			};

			window.addEventListener('scroll', handleScroll, { passive: true });
		} else {
			console.error('Failed to generate questions');
		}
	}

	function cancelSetup() {
		goto(`/quiz/${setId}`);
	}

	function generateQuestions() {
		if (!flashcardSet?.flashcards || !testConfig) return;

		let availableCards = flashcardSet.flashcards;

		// Filter starred cards jika diminta
		if (testConfig.useStarredOnly) {
			availableCards = availableCards.filter((card) => card.is_starred);

			if (availableCards.length === 0) {
				toast.error('No starred cards available for test');
				return;
			}
		}

		// Shuffle dan pilih cards
		const shuffledCards = [...availableCards].sort(() => Math.random() - 0.5);
		const selectedCards = shuffledCards.slice(
			0,
			Math.min(testConfig.questionCount, availableCards.length)
		);

		let questions = [];
		let questionId = 1;

		selectedCards.forEach((card) => {
			const questionTypes = [];
			if (testConfig.trueFalse) questionTypes.push('true_false');
			if (testConfig.multipleChoice) questionTypes.push('multiple_choice');
			if (testConfig.matching) questionTypes.push('matching');
			if (testConfig.written) questionTypes.push('written');

			// Select random question type from enabled types
			const selectedType = questionTypes[Math.floor(Math.random() * questionTypes.length)];

			// Generate question based on type and answerWith setting
			const question = generateQuestionByType(card, selectedType, questionId);
			if (question) {
				questions.push(question);
				questionId++;
			}
		});

		testQuestions = questions.slice(0, testConfig.questionCount);
		testAnswers = {};
		currentQuestionIndex = 0;

		if (testQuestions.length === 0) {
			toast.error('Failed to generate questions. Please try again.');
			return;
		}
	}

	function generateQuestionByType(card, type, id) {
		const isAskingForTerm =
			testConfig.answerWith === 'terms' ||
			(testConfig.answerWith === 'both' && Math.random() > 0.5);

		switch (type) {
			case 'true_false':
				// Untuk True/False, buat statement yang bisa benar atau salah
				const isCorrectStatement = Math.random() > 0.5;
				const statementTerm = isCorrectStatement ? card.term : generateWrongTerm(card);
				const statementDefinition = isCorrectStatement
					? card.definition
					: generateWrongDefinition(card);

				return {
					id: id,
					flashcard_id: card.id,
					type: 'true_false',
					term: statementTerm,
					definition: statementDefinition,
					question: `Is this statement correct?`,
					correctAnswer: isCorrectStatement ? 'True' : 'False',
					options: ['True', 'False'],
					isCorrectStatement: isCorrectStatement,
					originalTerm: card.term,
					originalDefinition: card.definition,
					isCorrect: false
				};

			case 'multiple_choice':
				// Check if card has custom MC setup
				if (card.has_multiple_choice && card.mc_options && card.mc_options.question) {
					return generateCustomMultipleChoiceQuestion(card, id);
				} else {
					return generateMultipleChoiceQuestion(card, isAskingForTerm, id);
				}

			case 'matching':
				return generateMatchingPairs(card, id);

			case 'written':
				return {
					id: id,
					type: 'written',
					term: card.term,
					definition: card.definition,
					question: isAskingForTerm ? card.definition : card.term,
					correctAnswer: isAskingForTerm ? card.term : card.definition,
					flashcard_id: card.id,
					isCorrect: false
				};

			default:
				return null;
		}
	}

	// Helper functions untuk True/False
	function generateWrongTerm(card) {
		const otherCards = flashcardSet.flashcards.filter((c) => c.id !== card.id);
		if (otherCards.length > 0) {
			const randomCard = otherCards[Math.floor(Math.random() * otherCards.length)];
			return randomCard.term;
		}
		return card.term + ' (wrong)';
	}

	function generateWrongDefinition(card) {
		const otherCards = flashcardSet.flashcards.filter((c) => c.id !== card.id);
		if (otherCards.length > 0) {
			const randomCard = otherCards[Math.floor(Math.random() * otherCards.length)];
			return randomCard.definition;
		}
		return card.definition + ' (wrong)';
	}

	// Generate custom MC question from card's mc_options
	function generateCustomMultipleChoiceQuestion(card, id) {
		const mcData = card.mc_options;

		// Extract text from option objects and shuffle
		const optionTexts = mcData.options.map((option) => option.text);
		const shuffledOptions = optionTexts.sort(() => Math.random() - 0.5);

		// Extract correct answers
		const correctAnswers = mcData.options
			.filter((option) => option.isCorrect)
			.map((option) => option.text);

		return {
			id: id,
			type: 'multiple_choice',
			term: card.term,
			definition: card.definition,
			question: mcData.question,
			correctAnswer: correctAnswers, // Array of correct answers
			options: shuffledOptions,
			flashcard_id: card.id,
			isCustomMC: true // Flag to identify custom MC questions
		};
	}

	function generateMultipleChoiceQuestion(card, isAskingForTerm, id) {
		const correctAnswer = isAskingForTerm ? card.term : card.definition;
		const otherCards = flashcardSet.flashcards.filter((c) => c.id !== card.id);
		const shuffledOthers = otherCards.sort(() => Math.random() - 0.5);

		let wrongOptions = [];
		for (let i = 0; i < Math.min(3, shuffledOthers.length); i++) {
			wrongOptions.push(isAskingForTerm ? shuffledOthers[i].term : shuffledOthers[i].definition);
		}

		// Fill with placeholder options if we don't have enough
		while (wrongOptions.length < 3) {
			wrongOptions.push(`Option ${wrongOptions.length + 1}`);
		}

		const allOptions = [correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5);

		return {
			id: id,
			type: 'multiple_choice',
			term: card.term,
			definition: card.definition,
			question: isAskingForTerm ? card.definition : card.term,
			correctAnswer: correctAnswer,
			options: allOptions,
			flashcard_id: card.id,
			isCorrect: false
		};
	}

	// Generate 2 vs 4 matching pairs
	function generateMatchingPairs(card, id) {
		// Get another random card untuk pair kedua
		const otherCards = flashcardSet.flashcards.filter((c) => c.id !== card.id);

		if (otherCards.length === 0) {
			// Fallback to simple matching if no other cards
			return generateSingleMatching(card, id);
		}

		const secondCard = otherCards[Math.floor(Math.random() * otherCards.length)];

		// Create left side (2 items to match)
		const leftItems = [
			{ id: 1, text: card.term, correctMatch: card.definition },
			{ id: 2, text: secondCard.term, correctMatch: secondCard.definition }
		];

		// Create right side (4 options including 2 correct + 2 distractors)
		const correctAnswers = [card.definition, secondCard.definition];
		const shuffledOthers = otherCards
			.filter((c) => c.id !== secondCard.id)
			.sort(() => Math.random() - 0.5);

		const distractors = [];
		for (let i = 0; i < Math.min(2, shuffledOthers.length); i++) {
			distractors.push(shuffledOthers[i].definition);
		}

		// Fill with placeholder if needed
		while (distractors.length < 2) {
			distractors.push(`Distractor ${distractors.length + 1}`);
		}

		const rightOptions = [...correctAnswers, ...distractors].sort(() => Math.random() - 0.5);

		return {
			id: id,
			type: 'matching',
			flashcard_id: card.id,
			leftItems: leftItems,
			rightOptions: rightOptions,
			correctMatches: {
				1: card.definition,
				2: secondCard.definition
			},
			userMatches: {},
			isCorrect: false
		};
	}

	// Fallback for single matching (when only one card available)
	function generateSingleMatching(card, id) {
		return {
			id: id,
			type: 'matching',
			flashcard_id: card.id,
			leftItems: [{ id: 1, text: card.term, correctMatch: card.definition }],
			rightOptions: [card.definition, 'Distractor 1', 'Distractor 2', 'Distractor 3'].sort(
				() => Math.random() - 0.5
			),
			correctMatches: {
				1: card.definition
			},
			userMatches: {},
			isCorrect: false
		};
	}

	function generateMatchingOptions(card, isAskingForTerm) {
		const correctAnswer = isAskingForTerm ? card.term : card.definition;
		const otherCards = flashcardSet.flashcards.filter((c) => c.id !== card.id);
		const shuffledOthers = otherCards.sort(() => Math.random() - 0.5);

		let options = [correctAnswer];
		for (let i = 0; i < Math.min(3, shuffledOthers.length); i++) {
			options.push(isAskingForTerm ? shuffledOthers[i].term : shuffledOthers[i].definition);
		}

		// Fill with placeholder options if we don't have enough
		while (options.length < 4) {
			options.push(`Option ${options.length}`);
		}

		return options.sort(() => Math.random() - 0.5);
	}

	function selectAnswer(questionId, answer, leftItemId = null) {
		const question = testQuestions.find((q) => q.id === questionId);

		if (question && question.type === 'matching' && leftItemId) {
			// Handle matching pairs
			question.userMatches[leftItemId] = answer;

			// Check if this specific match is correct for instant feedback
			if (testConfig?.instantFeedback) {
				const isCorrect = question.correctMatches[leftItemId] === answer;
				const leftItem = question.leftItems.find((item) => item.id === leftItemId);

				// Show feedback for this specific match
				if (isCorrect) {
					toast.success(`Correct match: ${leftItem.text}`);
				} else {
					toast.error(
						`Incorrect. ${leftItem.text} matches with ${question.correctMatches[leftItemId]}`
					);
				}
			}
		} else {
			// Handle other question types
			testAnswers[questionId] = answer;

			// If instant feedback is enabled, show feedback immediately
			if (testConfig?.instantFeedback) {
				if (question) {
					const isCorrect = checkAnswerCorrectness(question, answer);
					question.userAnswer = answer;
					question.showFeedback = true;
					question.isCorrectAnswer = isCorrect;

					// Show toast feedback
					if (isCorrect) {
						toast.success('Correct!');
					} else {
						// Handle multiple correct answers display
						let correctAnswerText;
						if (question.isCustomMC && Array.isArray(question.correctAnswer)) {
							correctAnswerText = question.correctAnswer.join(', ');
						} else {
							correctAnswerText = question.correctAnswer;
						}
						toast.error(`Incorrect. The correct answer(s): ${correctAnswerText}`);
					}
				}

				// Record progress for instant feedback only (avoid double recording)
				const questionObj = testQuestions.find((q) => q.id === questionId);
				if (questionObj && questionObj.flashcard_id && flashcardSet?.id) {
					ProgressService.recordAttempt(
						questionObj.flashcard_id,
						flashcardSet.id,
						'test',
						isCorrect,
						null,
						answer
					).catch(console.error);
				}
			}
		}
		// For non-instant feedback, we'll record all at once in finishTest()
	}

	function checkAnswerCorrectness(question, userAnswer) {
		if (question.type === 'true_false') {
			// Untuk True/False, cek apakah user answer sama dengan correct answer
			return userAnswer === question.correctAnswer;
		} else if (question.type === 'written') {
			return (
				userAnswer &&
				userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()
			);
		} else if (question.type === 'matching') {
			// For matching questions, check if all pairs are correctly matched
			const userMatches = question.userMatches;
			const correctMatches = question.correctMatches;

			// Check if all left items have been matched
			for (const leftId of Object.keys(correctMatches)) {
				if (!userMatches[leftId] || userMatches[leftId] !== correctMatches[leftId]) {
					return false;
				}
			}
			return true;
		} else if (question.type === 'multiple_choice' && question.isCustomMC) {
			// For custom MC questions, check against array of correct answers
			const correctAnswers = question.correctAnswer;
			if (Array.isArray(correctAnswers)) {
				return correctAnswers.includes(userAnswer);
			} else {
				return userAnswer === correctAnswers;
			}
		} else {
			return userAnswer === question.correctAnswer;
		}
	}

	async function finishTest() {
		// Calculate results first (synchronous, fast operation)
		let correctAnswers = 0;

		// Process all questions synchronously for UI updates
		testQuestions.forEach((question) => {
			const userAnswer = testAnswers[question.id];
			const isCorrect = checkAnswerCorrectness(question, userAnswer);
			question.isCorrect = isCorrect;
			if (isCorrect) correctAnswers++;
		});

		// Update UI immediately (don't wait for database operations)
		const testScore = (correctAnswers / testQuestions.length) * 100;
		testInProgress = false;
		showResults = true;
		toast.success(`Test completed! Score: ${testScore.toFixed(0)}%`);

		// Record progress in background (parallel, non-blocking)
		const progressPromises = testQuestions
			.filter(
				(question) => question.flashcard_id && flashcardSet?.id && !testConfig?.instantFeedback
			)
			.map((question) => {
				const userAnswer = testAnswers[question.id];
				return ProgressService.recordAttempt(
					question.flashcard_id,
					flashcardSet.id,
					'test',
					question.isCorrect,
					null, // responseTime
					userAnswer || '' // answerText
				).catch((error) => {
					console.error(`Error recording progress for question ${question.id}:`, error);
				});
			});
	}

	function retakeTest() {
		// Regenerate questions untuk test ulang
		generateQuestions();
		testAnswers = {};
		showResults = false;
		testInProgress = true;
	}

	function backToSetup() {
		// Kembali ke setup modal
		testAnswers = {};
		showResults = false;
		testInProgress = false;
		showSetup = true;
	}

	function exitTest() {
		goto(`/quiz/${setId}`);
	}

	function goToQuestion(event) {
		const targetIndex = event.detail;
		currentQuestionIndex = targetIndex;
		// Scroll to the question
		const questionElement = document.getElementById(`question-${testQuestions[targetIndex]?.id}`);
		if (questionElement) {
			questionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	function toggleQuestionList(event) {
		showQuestionList = event.detail;
	}

	// Get answered count for scroll mode
	let answeredCount = $derived(Object.keys(testAnswers).length);
	let allAnswered = $derived(answeredCount === testQuestions.length);

	// Update current question index based on scroll position
	function updateCurrentQuestionFromScroll() {
		const questionElements = document.querySelectorAll('[id^="question-"]');
		let currentIndex = 0;

		questionElements.forEach((element, index) => {
			const rect = element.getBoundingClientRect();
			// Check if the question is in the top half of the viewport
			if (rect.top <= window.innerHeight / 2 && rect.bottom > 0) {
				currentIndex = index;
			}
		});

		currentQuestionIndex = currentIndex;
	}

	// Settings modal state
	let showSettingsModal = $state(false);

	function openSettings() {
		showSettingsModal = true;
	}

	function handleSettingsApply(event) {
		const newConfig = event.detail;

		// Update test config
		testConfig = { ...testConfig, ...newConfig };

		// Regenerate questions with new config
		generateQuestions();

		// Reset answers
		testAnswers = {};

		showSettingsModal = false;
		toast.info('Test settings updated!');
	}

	function closeSettings() {
		showSettingsModal = false;
	}
</script>

<svelte:head>
	<title>Test - {flashcardSet?.title || 'Loading...'} - Quizcard</title>
</svelte:head>

<div class="min-h-screen bg-surface-50-950">
	<!-- Single Header for All States -->
	<header class="sticky top-0 z-20 border-b border-surface-300-700 preset-tonal-surface px-6 py-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center space-x-4">
				<button
					onclick={toggleNavigationDropdown}
					class="flex items-center preset-tonal-surface text-xs font-semibold"
					title="Switch mode"
				>
					<img src={testIcon} alt="flashcard" class="mr-2 h-5 w-5 object-contain" />
					Test
					<ChevronDown class="ml-2 h-4 w-4" />
				</button>

				{#if showNavigationDropdown}
					<div
						class="absolute top-full left-4 z-50 mt-2 w-30 rounded-lg border border-surface-300-700 bg-surface-100-900 shadow-lg"
					>
						<div class="grid grid-cols-1 gap-2 p-3">
							<a
								href="/quiz/{setId}/learn"
								class="btn flex-col rounded-xl preset-tonal px-4 py-3 text-center no-underline"
							>
								<img src={learnIcon} alt="learn" class="mx-auto h-6 w-6 object-contain" />
								<span class="text-xs font-semibold">Learn</span>
							</a>

							<a
								href="/quiz/{setId}/flashcard"
								class="btn flex-col rounded-xl preset-tonal px-4 py-3 text-center no-underline"
							>
								<img src={flascardIcon} alt="test" class="mx-auto h-6 w-6 object-contain" />
								<span class="text-xs font-semibold">Flashcard</span>
							</a>

							<a
								href="/quiz/{setId}/match"
								class="btn flex-col rounded-xl preset-tonal px-4 py-3 text-center no-underline"
							>
								<img src={matchIcon} alt="matchmaking" class="mx-auto h-6 w-6 object-contain" />
								<span class="text-xs font-semibold">Match</span>
							</a>
							<a
								href="/"
								class="btn flex-col rounded-xl preset-tonal px-4 py-3 text-center no-underline"
							>
								<span class="text-xs font-semibold">Home</span>
							</a>
						</div>
					</div>
				{/if}
			</div>

			<div class="flex flex-col items-center">
				{#if testInProgress}
					<div class="text-sm font-semibold">{answeredCount}/{testQuestions.length}</div>
				{:else if showResults}
					<div class="text-sm font-semibold text-success-500">Test Completed</div>
				{/if}
				<h1 class="text-lg font-semibold">{flashcardSet?.title || 'Loading...'}</h1>
			</div>

			<div class="flex items-center justify-center space-x-2">
				{#if testInProgress}
					<button
						onclick={openSettings}
						class="btn-icon btn-icon-lg preset-tonal-surface"
						title="Settings"
					>
						<Settings class="h-8 w-8" />
					</button>
				{/if}

				<button
					onclick={exitTest}
					class="btn-icon btn-icon-lg preset-tonal-surface"
					title="Back to Quiz"
				>
					{#if showResults}
						<ArrowLeft class="h-8 w-8" />
					{:else}
						<X class="h-8 w-8" />
					{/if}
				</button>
			</div>
		</div>
	</header>
	<!-- Main Content Area -->
	<main class="flex-1">
		{#if isLoading}
			<!-- Loading State -->
			<div class="flex h-full">
				<!-- Skeleton Question List -->
				<aside class="w-80 border-r border-surface-300-700 bg-surface-100-900 p-4">
					<div class="mb-4 h-6 w-32 animate-pulse rounded bg-surface-300-700"></div>
					<div class="space-y-2">
						{#each Array(8) as _}
							<div class="h-12 w-full animate-pulse rounded bg-surface-200-800"></div>
						{/each}
					</div>
				</aside>

				<!-- Skeleton Test Questions -->
				<div class="flex-1 p-6">
					<div class="mx-auto max-w-4xl space-y-8">
						{#each Array(3) as _}
							<div class="rounded-lg border border-surface-300-700 bg-surface-50-950 p-6">
								<div class="mb-4 h-6 w-3/4 animate-pulse rounded bg-surface-300-700"></div>
								<div class="space-y-3">
									{#each Array(4) as _}
										<div class="h-12 w-full animate-pulse rounded bg-surface-200-800"></div>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{:else if flashcardSet}
			<!-- Test Setup Modal -->
			<SettingsModal
				bind:show={showSetup}
				mode="test"
				maxQuestions={flashcardSet?.flashcards?.length || 20}
				{flashcardSet}
				on:apply-settings={startTest}
				on:close={cancelSetup}
			/>

			<!-- Settings Modal During Test -->
			<SettingsModal
				bind:show={showSettingsModal}
				mode="test"
				maxQuestions={flashcardSet?.flashcards?.length || 20}
				{flashcardSet}
				currentConfig={testConfig}
				on:apply-settings={handleSettingsApply}
				on:close={closeSettings}
			/>

			{#if testInProgress}
				<!-- Test Interface -->
				<div class="flex h-full">
					<!-- Navigation Sidebar -->
					<TestNavigation
						questions={testQuestions}
						{currentQuestionIndex}
						{testAnswers}
						{showQuestionList}
						showResults={false}
						on:go-to-question={goToQuestion}
						on:toggle-question-list={toggleQuestionList}
					/>

					<!-- Test Questions -->
					<div class="flex-1 overflow-auto">
						<div class="mx-auto max-w-4xl px-8 py-8">
							<div class="space-y-8">
								{#each testQuestions as question, index}
									<div
										id="question-{question.id}"
										class="rounded-lg border border-surface-300-700 bg-surface-100-900 p-6"
									>
										<!-- Question content remains the same -->
										<div class="mb-6">
											<div class="mb-4 flex items-center justify-between">
												<div class="flex items-center space-x-3">
													<span class="text-surface-600-400">
														Question {index + 1} of {testQuestions.length}
													</span>
												</div>
												<div
													class="text-sm {testConfig?.instantFeedback && question.showFeedback
														? question.isCorrectAnswer
															? 'font-medium text-success-500'
															: 'font-medium text-error-500'
														: testAnswers[question.id]
															? 'font-medium text-success-500'
															: 'text-surface-500'}"
												>
													{#if testConfig?.instantFeedback && question.showFeedback}
														{question.isCorrectAnswer ? '✓ Correct' : '✗ Incorrect'}
													{:else}
														{testAnswers[question.id] ? '✓ Answered' : 'Not answered'}
													{/if}
												</div>
											</div>

											<!-- Question Text -->
											<div class="mb-6">
												<div class="p-4">
													<p class="text-center text-lg font-medium">
														{question.question}
													</p>
												</div>
											</div>
										</div>

										<!-- Answer Options -->
										<div>
											{#if question.type === 'true_false'}
												<!-- True/False Implementation -->
												<div class="mb-6 rounded-lg bg-surface-200-800 p-4">
													<div class="mb-4">
														<p class="mb-4 text-sm text-surface-600-400">Statement:</p>
														<div
															class="grid grid-cols-[1fr_auto_1fr] items-center justify-center gap-4 text-center"
														>
															<div class="text-sm font-medium">{question.term}</div>
															<div class="text-surface-500">is</div>
															<div class="text-sm font-medium">{question.definition}</div>
														</div>
													</div>
												</div>

												<div class="space-y-3">
													{#each question.options as option}
														{@const isSelected = testAnswers[question.id] === option}
														{@const isCorrectOption =
															testConfig?.instantFeedback &&
															question.showFeedback &&
															option === question.correctAnswer}
														{@const isWrongSelected =
															testConfig?.instantFeedback &&
															question.showFeedback &&
															isSelected &&
															!isCorrectOption}
														<button
															onclick={() => selectAnswer(question.id, option)}
															disabled={testConfig?.instantFeedback && question.showFeedback}
															class="w-full rounded-lg border-2 p-4 text-center text-lg font-medium transition-all duration-200
															{isCorrectOption
																? 'border-success-500 bg-success-50 dark:bg-success-900/20'
																: isWrongSelected
																	? 'border-error-500 bg-error-50 dark:bg-error-900/20'
																	: isSelected
																		? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
																		: 'border-surface-300-700 bg-surface-100-900 hover:border-surface-400-600'}
															{testConfig?.instantFeedback && question.showFeedback ? 'cursor-not-allowed' : ''}
														"
														>
															{option}
															{#if testConfig?.instantFeedback && question.showFeedback}
																{#if isCorrectOption}
																	<span class="ml-2 font-medium text-success-500">✓</span>
																{:else if isWrongSelected}
																	<span class="ml-2 font-medium text-error-500">✗</span>
																{/if}
															{/if}
														</button>
													{/each}
												</div>
											{:else if question.type === 'multiple_choice'}
												<!-- Multiple Choice Implementation -->
												<div class="space-y-3">
													{#each question.options as option}
														{@const isSelected = testAnswers[question.id] === option}
														{@const isCorrectOption =
															testConfig?.instantFeedback &&
															question.showFeedback &&
															(question.isCustomMC && Array.isArray(question.correctAnswer)
																? question.correctAnswer.includes(option)
																: option === question.correctAnswer)}
														{@const isWrongSelected =
															testConfig?.instantFeedback &&
															question.showFeedback &&
															isSelected &&
															!isCorrectOption}
														<button
															onclick={() => selectAnswer(question.id, option)}
															disabled={testConfig?.instantFeedback && question.showFeedback}
															class="w-full rounded-lg border-2 p-4 text-left transition-all duration-200
															{isCorrectOption
																? 'border-success-500 bg-success-50 dark:bg-success-900/20'
																: isWrongSelected
																	? 'border-error-500 bg-error-50 dark:bg-error-900/20'
																	: isSelected
																		? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
																		: 'border-surface-300-700 bg-surface-100-900 hover:border-surface-400-600'}
															{testConfig?.instantFeedback && question.showFeedback ? 'cursor-not-allowed' : ''}
														"
														>
															<div class="flex items-center justify-between">
																<span class="font-medium">{option}</span>
																{#if testConfig?.instantFeedback && question.showFeedback}
																	{#if isCorrectOption}
																		<span class="font-medium text-success-500">✓ Correct</span>
																	{:else if isWrongSelected}
																		<span class="font-medium text-error-500">✗ Wrong</span>
																	{/if}
																{/if}
															</div>
														</button>
													{/each}
												</div>
											{:else if question.type === 'matching'}
												<!-- New 2 vs 4 Matching Implementation -->
												<div class="grid grid-cols-2 gap-8">
													<!-- Left Side: Items to Match (2 items) -->
													<div class="space-y-4">
														<h4 class="mb-4 font-medium text-surface-600-400">
															Match these items:
														</h4>
														{#each question.leftItems as leftItem}
															{@const isMatched = question.userMatches[leftItem.id]}
															{@const isCorrectMatch =
																question.userMatches[leftItem.id] ===
																question.correctMatches[leftItem.id]}
															{@const isSelected = question.selectedLeftItem === leftItem.id}
															<button
																onclick={() => {
																	if (!isMatched) {
																		question.selectedLeftItem = leftItem.id;
																	}
																}}
																disabled={isMatched}
																class="w-full rounded-lg border-2 p-4 text-center transition-all duration-200
																{isMatched
																	? testConfig?.instantFeedback
																		? isCorrectMatch
																			? 'cursor-not-allowed border-success-500 bg-success-50 dark:bg-success-900/20'
																			: 'cursor-not-allowed border-error-500 bg-error-50 dark:bg-error-900/20'
																		: 'cursor-not-allowed border-primary-500 bg-primary-50 dark:bg-primary-900/20'
																	: isSelected
																		? 'border-primary-500 bg-primary-100 shadow-md dark:bg-primary-900/30'
																		: 'border-surface-300-700 bg-surface-100-900 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'}"
															>
																<div class="font-medium">{leftItem.text}</div>
																{#if isMatched}
																	<div class="mt-2 text-sm text-surface-600-400">
																		→ {question.userMatches[leftItem.id]}
																		{#if testConfig?.instantFeedback}
																			{#if isCorrectMatch}
																				<span class="ml-2 font-medium text-success-500">✓</span>
																			{:else}
																				<span class="ml-2 font-medium text-error-500">✗</span>
																			{/if}
																		{/if}
																	</div>
																{:else if isSelected}
																	<div class="mt-2 text-sm font-medium text-primary-600">
																		Click a match on the right →
																	</div>
																{/if}
															</button>
														{/each}
													</div>

													<!-- Right Side: Options to Choose From (4 options) -->
													<div class="space-y-4">
														<h4 class="mb-4 font-medium text-surface-600-400">
															With these options:
														</h4>
														{#each question.rightOptions as option}
															{@const isUsed = Object.values(question.userMatches).includes(option)}
															{@const isCorrectOption = Object.values(
																question.correctMatches
															).includes(option)}
															<button
																onclick={() => {
																	// Handle click-based matching
																	const selectedLeft = question.selectedLeftItem;
																	if (selectedLeft) {
																		selectAnswer(question.id, option, selectedLeft);
																		question.selectedLeftItem = null; // Reset selection
																	} else {
																		toast.info('Please select an item from the left side first');
																	}
																}}
																disabled={testConfig?.instantFeedback &&
																	question.showFeedback &&
																	isUsed}
																class="w-full rounded-lg border-2 p-4 text-center transition-all duration-200
																{isUsed
																	? testConfig?.instantFeedback
																		? isCorrectOption
																			? 'border-success-500 bg-success-50 opacity-75 dark:bg-success-900/20'
																			: 'border-error-500 bg-error-50 opacity-75 dark:bg-error-900/20'
																		: 'border-surface-300-700 bg-surface-200-800 opacity-75'
																	: 'border-surface-300-700 bg-surface-100-900 hover:border-surface-400-600 hover:bg-surface-200-800'}
																{testConfig?.instantFeedback && question.showFeedback && isUsed
																	? 'cursor-not-allowed'
																	: 'cursor-pointer'}
															"
															>
																<div class="font-medium">{option}</div>
																{#if isUsed && testConfig?.instantFeedback}
																	{#if isCorrectOption}
																		<span class="mt-1 text-sm font-medium text-success-500"
																			>✓ Matched</span
																		>
																	{:else}
																		<span class="mt-1 text-sm font-medium text-error-500"
																			>✗ Used</span
																		>
																	{/if}
																{/if}
															</button>
														{/each}

														<!-- Selection Helper -->
														<div class="mt-4 rounded-lg bg-surface-100-900 p-3">
															<p class="text-center text-sm text-surface-600-400">
																{#if question.selectedLeftItem}
																	Selected: <span class="font-medium text-primary-500">
																		{question.leftItems.find(
																			(item) => item.id === question.selectedLeftItem
																		)?.text}
																	</span>
																	<br />Click an option above to match
																{:else}
																	Click an item on the left, then click its match on the right
																{/if}
															</p>
														</div>
													</div>
												</div>
											{:else if question.type === 'written'}
												<!-- Written Answer Implementation -->
												<div>
													<textarea
														bind:value={testAnswers[question.id]}
														oninput={(e) => {
															if (testConfig?.instantFeedback) {
																clearTimeout(question.inputTimeout);
																question.inputTimeout = setTimeout(() => {
																	selectAnswer(question.id, e.target.value);
																}, 1000);
															}
														}}
														onblur={(e) => {
															if (testConfig?.instantFeedback) {
																selectAnswer(question.id, e.target.value);
															}
														}}
														placeholder="Type your answer here..."
														disabled={testConfig?.instantFeedback && question.showFeedback}
														class="textarea h-24 w-full resize-none bg-surface-50-950
														{testConfig?.instantFeedback && question.showFeedback
															? question.isCorrectAnswer
																? 'border-success-500 bg-success-50 dark:bg-success-900/20'
																: 'border-error-500 bg-error-50 dark:bg-error-900/20'
															: ''}"
													></textarea>
													{#if testConfig?.instantFeedback && question.showFeedback}
														<div class="mt-2 flex items-center justify-between">
															{#if question.isCorrectAnswer}
																<span class="font-medium text-success-500">✓ Correct answer!</span>
															{:else}
																<div>
																	<span class="font-medium text-error-500">✗ Incorrect</span>
																	<p class="mt-1 text-sm text-surface-600-400">
																		Correct answer: <span class="font-medium"
																			>{question.correctAnswer}</span
																		>
																	</p>
																</div>
															{/if}
														</div>
													{/if}
												</div>
											{/if}
										</div>
									</div>
								{/each}
							</div>

							<!-- Submit Button -->
							<div class="mt-8 text-center">
								{#if allAnswered}
									<button
										onclick={finishTest}
										class="btn preset-filled-primary-500 px-8 py-3 text-lg"
									>
										Submit Test
									</button>
									<p class="mt-2 text-sm text-surface-600-400">
										All questions answered! Ready to submit.
									</p>
								{:else}
									<button onclick={finishTest} class="btn preset-tonal-surface px-8 py-3 text-lg">
										Submit Test ({answeredCount}/{testQuestions.length} answered)
									</button>
									<p class="mt-2 text-sm text-surface-600-400">
										You can submit with incomplete answers, but unanswered questions will be marked
										as incorrect.
									</p>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{:else if showResults}
				<!-- Test Results -->
				<div class="mx-auto max-w-4xl p-8">
					<TestResults
						{testQuestions}
						{testAnswers}
						testScore={(testQuestions.filter((q) => q.isCorrect).length / testQuestions.length) *
							100}
						correctAnswers={testQuestions.filter((q) => q.isCorrect).length}
						on:retake-test={retakeTest}
						on:back-to-setup={backToSetup}
						on:go-home={exitTest}
					/>
				</div>
			{/if}
		{:else}
			<!-- Error State -->
			<div class="flex h-full items-center justify-center">
				<div class="text-center">
					<h2 class="text-xl font-bold">Flashcard set not found</h2>
					<p class="mt-2 text-surface-600-400">The requested flashcard set could not be loaded.</p>
					<button onclick={() => goto(`/quiz/${setId}`)} class="mt-4 btn preset-filled-primary-500">
						Back to Quiz
					</button>
				</div>
			</div>
		{/if}
	</main>
</div>
