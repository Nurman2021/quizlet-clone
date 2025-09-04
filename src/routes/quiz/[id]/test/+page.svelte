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

		// Tidak auto-generate questions, tunggu user setup
		// Biarkan user mengkonfigurasi test melalui modal
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
		console.log('Test config received:', $state.snapshot(testConfig));
		console.log('Flashcard set available cards:', flashcardSet?.flashcards?.length);

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
			console.log('Test started successfully with', testQuestions.length, 'questions');

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
		console.log('cancelSetup called - redirecting to quiz page');
		// Redirect back to quiz page when user cancels setup
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

		// Validate that questions were generated successfully
		if (testQuestions.length === 0) {
			toast.error('Failed to generate questions. Please try again.');
			return;
		}

		console.log(`Generated ${testQuestions.length} questions successfully`);
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
				return generateMultipleChoiceQuestion(card, isAskingForTerm, id);

			case 'matching':
				return {
					id: id,
					flashcard_id: card.id,
					type: 'matching',
					term: card.term,
					definition: card.definition,
					question: isAskingForTerm ? card.definition : card.term,
					correctAnswer: isAskingForTerm ? card.term : card.definition,
					options: generateMatchingOptions(card, isAskingForTerm),
					isCorrect: false
				};

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

	function selectAnswer(questionId, answer) {
		testAnswers[questionId] = answer;

		// If instant feedback is enabled, show feedback immediately
		if (testConfig?.instantFeedback) {
			const question = testQuestions.find((q) => q.id === questionId);
			if (question) {
				const isCorrect = checkAnswerCorrectness(question, answer);
				question.userAnswer = answer;
				question.showFeedback = true;
				question.isCorrectAnswer = isCorrect;

				// Show toast feedback
				if (isCorrect) {
					toast.success('Correct!');
				} else {
					toast.error(`Incorrect. The correct answer is: ${question.correctAnswer}`);
				}
			}
		}

		// Record progress for immediate feedback
		const question = testQuestions.find((q) => q.id === questionId);
		if (question) {
			const isCorrect = checkAnswerCorrectness(question, answer);
			// Record attempt asynchronously
			ProgressService.recordAttempt(
				question.flashcard_id,
				setId,
				'test',
				isCorrect,
				null,
				answer
			).catch(console.error);
		}
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
		} else {
			return userAnswer === question.correctAnswer;
		}
	}

	async function finishTest() {
		// Calculate results
		let correctAnswers = 0;

		// Record progress for each question
		for (const question of testQuestions) {
			const userAnswer = testAnswers[question.id];
			const isCorrect = checkAnswerCorrectness(question, userAnswer);

			question.isCorrect = isCorrect;
			if (isCorrect) correctAnswers++;

			// Record progress for this flashcard
			if (question.flashcard_id && flashcardSet?.id) {
				try {
					await ProgressService.recordAttempt(
						question.flashcard_id,
						flashcardSet.id,
						'test',
						isCorrect,
						null, // responseTime
						userAnswer || '' // answerText
					);
				} catch (error) {
					console.error('Error recording test attempt:', error);
				}
			}
		}

		const testScore = (correctAnswers / testQuestions.length) * 100;

		testInProgress = false;
		showResults = true;

		toast.success(`Test completed! Score: ${testScore.toFixed(0)}%`);
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

{#if isLoading}
	<div class="flex h-screen flex-col bg-surface-50-950">
		<!-- Skeleton Header -->
		<header class="border-b border-surface-300-700 bg-surface-50-950 px-6 py-4">
			<div class="flex items-center justify-between">
				<!-- Skeleton Navigation -->
				<div class="flex items-center">
					<div class="h-8 w-20 animate-pulse rounded bg-surface-300-700"></div>
				</div>

				<!-- Skeleton Title -->
				<div class="text-center">
					<div class="h-6 w-40 animate-pulse rounded bg-surface-300-700"></div>
				</div>

				<!-- Skeleton Actions -->
				<div class="flex items-center space-x-2">
					<div class="h-10 w-10 animate-pulse rounded bg-surface-300-700"></div>
					<div class="h-10 w-10 animate-pulse rounded bg-surface-300-700"></div>
				</div>
			</div>
		</header>

		<!-- Skeleton Main Content -->
		<main class="flex flex-1">
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
		</main>
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
		<div class="min-h-screen bg-surface-50-950">
			<!-- Navigation Sidebar (Floating) -->
			<TestNavigation
				questions={testQuestions}
				{currentQuestionIndex}
				{testAnswers}
				{showQuestionList}
				showResults={false}
				on:go-to-question={goToQuestion}
				on:toggle-question-list={toggleQuestionList}
			/>

			<!-- Main Test Content -->
			<div class="w-full">
				<!-- Test Header -->
				<header
					class="sticky top-0 z-20 border-b border-surface-300-700 preset-tonal-surface px-6 py-4"
				>
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
											<img
												src={matchIcon}
												alt="matchmaking"
												class="mx-auto h-6 w-6 object-contain"
											/>
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

						<div class="flex flex-col items-center space-x-4">
							<div class="font-semibold">{answeredCount}/{testQuestions.length}</div>
							<h1 class="text-lg font-semibold">{flashcardSet.title}</h1>
						</div>

						<div class="flex items-center justify-center space-x-2">
							<button
								onclick={openSettings}
								class="btn-icon btn-icon-lg preset-tonal-surface"
								title="Settings"
							>
								<Settings class="h-8 w-8" />
							</button>

							<button
								onclick={exitTest}
								class="btn-icon btn-icon-lg preset-tonal-surface"
								title="Back to Quiz"
							>
								<X class="h-8 w-8" />
							</button>
						</div>
					</div>
				</header>

				<!-- All Questions in Scroll Format -->
				<main class="mx-auto max-w-4xl px-8 py-8">
					<div class="space-y-8">
						{#each testQuestions as question, index}
							<div
								id="question-{question.id}"
								class="rounded-lg border border-surface-300-700 bg-surface-100-900 p-6"
							>
								<!-- Question Header -->
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
										<!-- True/False - Statement dengan jawaban True/False -->
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
										<!-- Multiple Choice - Standard pilihan ganda -->
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
														<div class="flex items-center space-x-3">
															<div
																class="flex h-5 w-5 items-center justify-center rounded-full border-2
																{isCorrectOption
																	? 'border-success-500 bg-success-500'
																	: isWrongSelected
																		? 'border-error-500 bg-error-500'
																		: isSelected
																			? 'border-primary-500 bg-primary-500'
																			: 'border-surface-300-700'}
															"
															>
																{#if isSelected || isCorrectOption}
																	<div class="h-2 w-2 rounded-full bg-white"></div>
																{/if}
															</div>
															<span class="font-medium">{option}</span>
														</div>
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
										<!-- Matching - Dua kolom dengan drag and drop style -->
										<div class="grid grid-cols-2 gap-6">
											<!-- Kolom Kiri: Terms/Definitions (static) -->
											<div class="space-y-3">
												<h4 class="mb-3 font-medium text-surface-600-400">Match this:</h4>
												<div
													class="rounded-lg border-2 border-primary-500 bg-primary-50 p-4 dark:bg-primary-900/20"
												>
													<div class="text-center font-medium">{question.question}</div>
												</div>
											</div>

											<!-- Kolom Kanan: Options (clickable) -->
											<div class="space-y-3">
												<h4 class="mb-3 font-medium text-surface-600-400">With one of these:</h4>
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
														class="w-full rounded-lg border-2 p-4 text-center transition-all duration-200
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
														<div class="font-medium">{option}</div>
														{#if testConfig?.instantFeedback && question.showFeedback}
															{#if isCorrectOption}
																<span class="mt-1 text-sm font-medium text-success-500"
																	>✓ Correct Match</span
																>
															{:else if isWrongSelected}
																<span class="mt-1 text-sm font-medium text-error-500"
																	>✗ Wrong Match</span
																>
															{/if}
														{/if}
													</button>
												{/each}
											</div>
										</div>
									{:else if question.type === 'written'}
										<!-- Written Answer -->
										<div>
											<textarea
												bind:value={testAnswers[question.id]}
												oninput={(e) => {
													if (testConfig?.instantFeedback) {
														// Trigger feedback on input change (debounced)
														clearTimeout(question.inputTimeout);
														question.inputTimeout = setTimeout(() => {
															selectAnswer(question.id, e.target.value);
														}, 1000); // 1 second delay
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

					<!-- Submit Button at Bottom -->
					<div class="mt-8 text-center">
						{#if allAnswered}
							<button onclick={finishTest} class="btn preset-filled-primary-500 px-8 py-3 text-lg">
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
								You can submit with incomplete answers, but unanswered questions will be marked as
								incorrect.
							</p>
						{/if}
					</div>
				</main>
			</div>
		</div>
	{:else if showResults}
		<!-- Test Results -->
		<div class="min-h-screen bg-surface-50-950">
			<header class="border-b border-surface-300-700 bg-surface-100-900 px-6 py-4">
				<div class="flex items-center space-x-4">
					<button
						onclick={exitTest}
						class="btn-icon btn-icon-sm preset-tonal-surface"
						title="Back to Quiz"
					>
						<ArrowLeft class="h-5 w-5" />
					</button>
					<div>
						<h1 class="text-xl font-semibold">{flashcardSet.title}</h1>
						<p class="text-sm text-surface-600-400">Test Results</p>
					</div>
				</div>
			</header>

			<main class="mx-auto max-w-4xl p-8">
				<TestResults
					{testQuestions}
					{testAnswers}
					testScore={(testQuestions.filter((q) => q.isCorrect).length / testQuestions.length) * 100}
					correctAnswers={testQuestions.filter((q) => q.isCorrect).length}
					on:retake-test={retakeTest}
					on:back-to-setup={backToSetup}
					on:go-home={exitTest}
				/>
			</main>
		</div>
	{/if}
{:else}
	<div class="flex h-screen items-center justify-center">
		<div class="text-center">
			<h2 class="text-xl font-bold">Flashcard set not found</h2>
			<p class="mt-2 text-surface-600-400">The requested flashcard set could not be loaded.</p>
			<button onclick={() => goto(`/quiz/${setId}`)} class="mt-4 btn preset-filled-primary-500">
				Back to Quiz
			</button>
		</div>
	</div>
{/if}
