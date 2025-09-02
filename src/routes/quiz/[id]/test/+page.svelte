<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase.js';
	import { toast } from '$lib/stores/toast.js';
	import { ArrowLeft } from 'lucide-svelte';
	import TestSetup from '$lib/components/TestSetup.svelte';
	import TestResults from '$lib/components/TestResults.svelte';
	import TestNavigation from '$lib/components/TestNavigation.svelte';
	import { ProgressService } from '$lib/services/progressService.js';

	let setId = $page.params.id;
	let flashcardSet = $state(null);
	let isLoading = $state(true);

	// Test states
	let showSetup = $state(true);
	let showResults = $state(false);
	let testInProgress = $state(false);
	let testQuestions = $state([]);
	let currentQuestionIndex = $state(0);
	let testAnswers = $state({});
	let testConfig = $state(null);
	let showQuestionList = $state(true);

	onMount(async () => {
		await loadFlashcardSet();

		// Add scroll listener for updating current question index
		const handleScroll = () => {
			if (testInProgress) {
				updateCurrentQuestionFromScroll();
			}
		};

		window.addEventListener('scroll', handleScroll, { passive: true });

		// Cleanup
		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	});

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
				// Reset back to setup instead of calling undefined resetTest()
				showSetup = true;
				testInProgress = false;
				testConfig = null;
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
			showSetup = true;
			testInProgress = false;
			testConfig = null;
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
				return {
					id: id,
					flashcard_id: card.id,
					type: 'true_false',
					term: card.term,
					definition: card.definition,
					question: isAskingForTerm ? card.definition : card.term,
					questionType: isAskingForTerm
						? 'What is the term for this definition?'
						: 'What is the definition of this term?',
					correctAnswer: isAskingForTerm ? card.term : card.definition,
					options: ['True', 'False'],
					actualAnswer: isAskingForTerm ? card.term : card.definition,
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
					questionType: isAskingForTerm
						? 'What is the term for this definition?'
						: 'What is the definition of this term?',
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
					questionType: isAskingForTerm
						? 'What is the term for this definition?'
						: 'What is the definition of this term?',
					correctAnswer: isAskingForTerm ? card.term : card.definition,
					flashcard_id: card.id,
					isCorrect: false
				};

			default:
				return null;
		}
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
			questionType: isAskingForTerm
				? 'What is the term for this definition?'
				: 'What is the definition of this term?',
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
			const statement = question.question;
			const actualAnswer = question.actualAnswer;
			const isStatementTrue = statement === actualAnswer;
			return (
				(userAnswer === 'True' && isStatementTrue) || (userAnswer === 'False' && !isStatementTrue)
			);
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
		showResults = false;
		showSetup = true;
		testAnswers = {};
	}

	function backToSetup() {
		showResults = false;
		showSetup = true;
		testInProgress = false;
		testAnswers = {};
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
</script>

<svelte:head>
	<title>Test - {flashcardSet?.title || 'Loading...'} - Quizcard</title>
</svelte:head>

{#if isLoading}
	<div class="flex h-screen items-center justify-center">
		<div class="text-center">
			<div
				class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"
			></div>
			<p class="text-surface-600-400">Loading test...</p>
		</div>
	</div>
{:else if flashcardSet}
	<!-- Test Setup Modal -->
	<TestSetup
		bind:show={showSetup}
		maxQuestions={flashcardSet?.flashcards?.length || 20}
		{flashcardSet}
		on:start-test={startTest}
		on:close={cancelSetup}
	/>

	{#if testInProgress}
		<!-- Test Interface with Navigation Sidebar -->
		<div class="flex min-h-screen bg-surface-50-950">
			<!-- Navigation Sidebar -->
			<TestNavigation
				questions={testQuestions}
				{currentQuestionIndex}
				{testAnswers}
				{showQuestionList}
				on:go-to-question={goToQuestion}
				on:toggle-question-list={toggleQuestionList}
			/>

			<!-- Main Test Content -->
			<div class="flex-1">
				<!-- Test Header -->
				<header
					class="sticky top-0 z-10 border-b border-surface-300-700 bg-surface-100-900 px-6 py-4"
				>
					<div class="flex items-center justify-between">
						<div class="flex items-center space-x-4">
							<button
								onclick={exitTest}
								class="btn-icon btn-icon-sm preset-tonal-surface"
								title="Exit Test"
							>
								<ArrowLeft class="h-5 w-5" />
							</button>

							<div>
								<h1 class="text-xl font-semibold">{flashcardSet.title}</h1>
								<p class="text-sm text-surface-600-400">
									Test Mode • {testQuestions.length} questions
								</p>
							</div>
						</div>

						<div class="flex items-center space-x-4">
							<div class="text-center">
								<div class="text-sm text-surface-600-400">Progress</div>
								<div class="font-semibold">{answeredCount}/{testQuestions.length}</div>
							</div>

							{#if allAnswered}
								<button onclick={finishTest} class="btn preset-filled-primary-500">
									Finish Test
								</button>
							{:else}
								<button onclick={finishTest} class="btn preset-tonal-surface">
									Submit ({answeredCount}/{testQuestions.length})
								</button>
							{/if}
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
											<span
												class="rounded-lg bg-primary-100 px-3 py-1 text-sm font-medium text-primary-800 dark:bg-primary-900 dark:text-primary-200"
											>
												{question.type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
											</span>
											<span class="text-surface-600-400">
												Question {index + 1} of {testQuestions.length}
											</span>
										</div>
										<div
											class="text-sm {testAnswers[question.id]
												? 'font-medium text-success-500'
												: 'text-surface-500'}"
										>
											{testAnswers[question.id] ? '✓ Answered' : 'Not answered'}
										</div>
									</div>

									<!-- Question Text -->
									<div class="mb-6">
										<h3 class="mb-3 text-lg font-semibold">
											{question.questionType}
										</h3>
										<div class="rounded-lg border border-surface-300-700 bg-surface-50-950 p-4">
											<p class="text-center font-medium">
												{question.question}
											</p>
										</div>
									</div>
								</div>

								<!-- Answer Options -->
								<div>
									{#if question.type === 'multiple_choice' || question.type === 'true_false' || question.type === 'matching'}
										<!-- Multiple Choice Options -->
										<div class="space-y-3">
											{#each question.options as option}
												{@const isSelected = testAnswers[question.id] === option}
												<button
													onclick={() => selectAnswer(question.id, option)}
													class="w-full rounded-lg border-2 p-4 text-left transition-all duration-200
														{isSelected
														? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
														: 'border-surface-300-700 bg-surface-50-950 hover:border-surface-400-600'}
													"
												>
													<div class="flex items-center space-x-3">
														<div
															class="flex h-5 w-5 items-center justify-center rounded-full border-2
															{isSelected ? 'border-primary-500 bg-primary-500' : 'border-surface-300-700'}
														"
														>
															{#if isSelected}
																<div class="h-2 w-2 rounded-full bg-white"></div>
															{/if}
														</div>
														<span class="font-medium">{option}</span>
													</div>
												</button>
											{/each}
										</div>
									{:else if question.type === 'written'}
										<!-- Written Answer -->
										<div>
											<textarea
												bind:value={testAnswers[question.id]}
												placeholder="Type your answer here..."
												class="textarea h-24 w-full resize-none"
											></textarea>
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
