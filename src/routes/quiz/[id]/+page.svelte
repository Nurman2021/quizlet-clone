<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import {
		flashcardActions,
		currentFlashcardSet,
		quizState,
		quizActions
	} from '$lib/stores/flashcards.js';
	import { supabase } from '$lib/supabase.js';
	import { toast } from '$lib/stores/toast.js';
	import {
		ChevronLeft,
		ChevronRight,
		RotateCcw,
		Home,
		Play,
		Shuffle,
		Settings,
		Star,
		Edit,
		Check,
		X
	} from 'lucide-svelte';
	import { Tabs } from '@skeletonlabs/skeleton-svelte';
	import TestSetupModal from '$lib/components/TestSetupModal.svelte';
	import TestResults from '$lib/components/TestResults.svelte';

	let setId;
	let showAnswer = false;
	let isLoading = true;
	let tabSet = 'flashcard'; // 'flashcard' atau 'test'
	let isPlaying = false;
	let progress = 0;

	// Edit mode variables
	let isEditMode = false;
	let editTerm = '';
	let editDefinition = '';
	let isSaving = false;

	// Test mode variables
	let showTestSetupModal = false;
	let testConfig = null;
	let testQuestions = [];
	let currentTestQuestion = 0;
	let testAnswers = {};
	let showTestResults = false;
	let testScore = 0;
	let testStarted = false;
	let correctAnswers = 0;

	onMount(async () => {
		setId = $page.params.id;

		try {
			// Get current user
			const {
				data: { user }
			} = await supabase.auth.getUser();

			if (!user) {
				goto('/login');
				return;
			}

			// Load flashcard set
			const set = await flashcardActions.loadSetWithCards(setId);

			if (set) {
				// Start quiz
				await quizActions.startQuiz(setId, user.id, 'flashcard');
				isLoading = false;
			} else {
				goto('/');
			}
		} catch (error) {
			console.error('Error loading quiz:', error);
			goto('/');
		}
	});

	// Edit mode functions
	function enterEditMode() {
		if (!currentCard) return;

		isEditMode = true;
		editTerm = currentCard.term;
		editDefinition = currentCard.definition;
		showAnswer = false;
	}

	function cancelEdit() {
		isEditMode = false;
		editTerm = '';
		editDefinition = '';
	}

	async function saveEdit() {
		if (!currentCard || !editTerm.trim() || !editDefinition.trim()) {
			toast.error('Validation Error', 'Term and definition cannot be empty');
			return;
		}

		isSaving = true;

		try {
			// Update flashcard di database
			const { error } = await supabase
				.from('flashcards')
				.update({
					term: editTerm.trim(),
					definition: editDefinition.trim()
				})
				.eq('id', currentCard.id);

			if (error) throw error;

			// Update local state
			const updatedCards = $currentFlashcardSet.flashcards.map((card) => {
				if (card.id === currentCard.id) {
					return {
						...card,
						term: editTerm.trim(),
						definition: editDefinition.trim()
					};
				}
				return card;
			});

			// Update store
			currentFlashcardSet.update((set) => ({
				...set,
				flashcards: updatedCards
			}));

			isEditMode = false;
			toast.success('Success!', 'Flashcard updated successfully');
		} catch (error) {
			console.error('Error updating flashcard:', error);
			toast.error('Update Failed', 'Failed to update flashcard: ' + error.message);
		} finally {
			isSaving = false;
		}
	}

	function toggleAnswer() {
		if (!isEditMode) {
			showAnswer = !showAnswer;
		}
	}

	function nextCard() {
		if (isEditMode) return;

		if (
			$currentFlashcardSet &&
			$quizState.currentCardIndex < $currentFlashcardSet.flashcards.length - 1
		) {
			quizActions.nextCard();
			showAnswer = false;
			updateProgress();
		}
	}

	function previousCard() {
		if (isEditMode) return;

		if ($quizState.currentCardIndex > 0) {
			quizActions.previousCard();
			showAnswer = false;
			updateProgress();
		}
	}

	function resetQuiz() {
		quizActions.resetQuiz();
		showAnswer = false;
		progress = 0;
		updateProgress();
	}

	function updateProgress() {
		if ($currentFlashcardSet) {
			progress = (($quizState.currentCardIndex + 1) / $currentFlashcardSet.flashcards.length) * 100;
		}
	}

	// Keyboard shortcuts
	function handleKeydown(event) {
		if (isEditMode) return;

		switch (event.key) {
			case 'ArrowLeft':
				event.preventDefault();
				previousCard();
				break;
			case 'ArrowRight':
				event.preventDefault();
				nextCard();
				break;
			case ' ':
				event.preventDefault();
				toggleAnswer();
				break;
			case 'e':
				event.preventDefault();
				enterEditMode();
				break;
		}
	}

	// Update progress saat currentCardIndex berubah
	$: if ($quizState.currentCardIndex !== undefined && $currentFlashcardSet) {
		updateProgress();
	}

	function startTest() {
		console.log('Starting test setup...');
		testStarted = false;
		showTestResults = false;
		testQuestions = [];
		testAnswers = {};
		currentTestQuestion = 0;
		showTestSetupModal = true;
	}

	function handleStartTest(event) {
		console.log('handleStartTest called with event:', event);
		const config = event.detail;
		console.log('Test config received:', config);

		testConfig = config;
		showTestSetupModal = false;
		testStarted = true;
		generateTestQuestions();
	}

	function generateTestQuestions() {
		console.log('Generating test questions...');

		if (!$currentFlashcardSet || !testConfig) {
			console.error('Missing flashcard set or test config');
			toast.error('Test Setup Error', 'Missing flashcard set or test configuration');
			return;
		}

		let questions = [];
		let availableCards = [...$currentFlashcardSet.flashcards];
		console.log('Available cards:', availableCards);

		// Shuffle cards
		availableCards = availableCards.sort(() => Math.random() - 0.5);

		// Take specified number of questions
		const numQuestions = Math.min(testConfig.questionCount, availableCards.length);
		console.log('Number of questions to generate:', numQuestions);

		const selectedCards = availableCards.slice(0, numQuestions);

		selectedCards.forEach((card, index) => {
			// Generate question types based on config
			let questionTypes = [];
			if (testConfig.trueFalse) questionTypes.push('true_false');
			if (testConfig.multipleChoice) questionTypes.push('multiple_choice');
			if (testConfig.written) questionTypes.push('written');

			if (questionTypes.length === 0) {
				questionTypes = ['written']; // Default to written if none selected
			}

			// Random question type
			const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
			console.log(`Question ${index + 1} type:`, questionType);

			let question = {
				id: `q_${index}`,
				cardId: card.id,
				type: questionType,
				term: card.term,
				definition: card.definition,
				correctAnswer: '',
				options: [],
				userAnswer: '',
				isCorrect: false,
				question: '' // Add question property
			};

			// Generate question based on type and answerWith setting
			if (questionType === 'multiple_choice') {
				if (testConfig.answerWith === 'terms' || testConfig.answerWith === 'both') {
					question.question = `What is the definition of "${card.term}"?`;
					question.correctAnswer = card.definition;
					question.options = generateMultipleChoiceOptions(
						card.definition,
						availableCards,
						'definition'
					);
				} else {
					question.question = `What term matches this definition: "${card.definition}"?`;
					question.correctAnswer = card.term;
					question.options = generateMultipleChoiceOptions(card.term, availableCards, 'term');
				}
			} else if (questionType === 'true_false') {
				// Generate true/false question
				const isTrue = Math.random() > 0.5;
				if (isTrue) {
					question.question = `True or False: "${card.term}" means "${card.definition}"`;
					question.correctAnswer = 'true';
				} else {
					// Pick random wrong definition
					const wrongOptions = availableCards.filter((c) => c.id !== card.id);
					if (wrongOptions.length > 0) {
						const wrongCard = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
						question.question = `True or False: "${card.term}" means "${wrongCard.definition}"`;
						question.correctAnswer = 'false';
					} else {
						// If no wrong options, default to true
						question.question = `True or False: "${card.term}" means "${card.definition}"`;
						question.correctAnswer = 'true';
					}
				}
				question.options = ['True', 'False'];
			} else if (questionType === 'written') {
				if (testConfig.answerWith === 'terms' || testConfig.answerWith === 'both') {
					question.question = `What is the definition of "${card.term}"?`;
					question.correctAnswer = card.definition;
				} else {
					question.question = `What term matches this definition: "${card.definition}"?`;
					question.correctAnswer = card.term;
				}
			}

			questions.push(question);
		});

		console.log('Generated questions:', questions);
		testQuestions = questions;
		currentTestQuestion = 0;
		testAnswers = {};
		showTestResults = false;

		toast.info('Test Ready', `Generated ${questions.length} questions`);
	}

	function generateMultipleChoiceOptions(correctAnswer, allCards, type) {
		let options = [correctAnswer];
		let availableOptions = allCards
			.map((card) => (type === 'definition' ? card.definition : card.term))
			.filter((option) => option !== correctAnswer);

		// Add 3 random wrong options
		while (options.length < 4 && availableOptions.length > 0) {
			const randomIndex = Math.floor(Math.random() * availableOptions.length);
			options.push(availableOptions[randomIndex]);
			availableOptions.splice(randomIndex, 1);
		}

		// If not enough options, fill with dummy ones
		while (options.length < 4) {
			options.push(`Option ${options.length}`);
		}

		// Shuffle options
		return options.sort(() => Math.random() - 0.5);
	}

	function submitTest() {
		correctAnswers = 0;

		testQuestions.forEach((question) => {
			const userAnswer = testAnswers[question.id];

			if (question.type === 'multiple_choice' || question.type === 'true_false') {
				question.isCorrect = userAnswer === question.correctAnswer;
			} else if (question.type === 'written') {
				const userAnswerLower = (userAnswer || '').toLowerCase().trim();
				const correctAnswerLower = question.correctAnswer.toLowerCase().trim();
				question.isCorrect = userAnswerLower === correctAnswerLower;
			}

			if (question.isCorrect) {
				correctAnswers++;
			}
		});

		testScore = (correctAnswers / testQuestions.length) * 100;
		showTestResults = true;

		// Show results toast
		if (testScore >= 80) {
			toast.success('Excellent!', `You scored ${testScore.toFixed(1)}%`);
		} else if (testScore >= 60) {
			toast.info('Good Job!', `You scored ${testScore.toFixed(1)}%`);
		} else {
			toast.warning('Keep Practicing!', `You scored ${testScore.toFixed(1)}%`);
		}
	}

	function handleRetakeTest() {
		showTestResults = false;
		testStarted = false;
		testQuestions = [];
		testAnswers = {};
		currentTestQuestion = 0;
		startTest();
		toast.info('Test Reset', 'Starting new test attempt');
	}

	function handleBackToSetup() {
		testStarted = false;
		showTestResults = false;
		testQuestions = [];
		testAnswers = {};
		currentTestQuestion = 0;
	}

	function handleGoHome() {
		goto('/');
	}

	function togglePlay() {
		isPlaying = !isPlaying;
		// Auto-play logic here
	}

	$: currentCard = $currentFlashcardSet?.flashcards[$quizState.currentCardIndex];
	$: isLastCard =
		$currentFlashcardSet &&
		$quizState.currentCardIndex === $currentFlashcardSet.flashcards.length - 1;
	$: isFirstCard = $quizState.currentCardIndex === 0;
</script>

<svelte:head>
	<title>Quiz - {$currentFlashcardSet?.title || 'Loading...'}</title>
</svelte:head>

<svelte:window on:keydown={handleKeydown} />

{#if isLoading}
	<div class="flex min-h-[60vh] items-center justify-center">
		<div class="text-center">
			<div class="mx-auto mb-4 h-12 placeholder w-12 animate-pulse"></div>
			<p class="text-surface-600-300-token">Loading quiz...</p>
		</div>
	</div>
{:else if $currentFlashcardSet && currentCard}
	<div class="bg-surface-50-900-token min-h-screen p-6">
		<div class="mx-auto max-w-6xl">
			<!-- Header with Title -->
			<div class="mb-6">
				<h1 class="mb-2 text-3xl font-bold">{$currentFlashcardSet.title}</h1>
				{#if $currentFlashcardSet.description}
					<p class="text-surface-600-300-token">{$currentFlashcardSet.description}</p>
				{/if}
			</div>

			<!-- Main Content Area -->
			<div class="flex justify-center">
				<div class="w-full max-w-4xl">
					<!-- Tab Navigation -->
					<Tabs value={tabSet} onValueChange={(e) => (tabSet = e.value)}>
						{#snippet list()}
							<Tabs.Control value="flashcard">Flashcard</Tabs.Control>
							<Tabs.Control value="test">Test</Tabs.Control>
						{/snippet}
						{#snippet content()}
							<Tabs.Panel value="flashcard">
								<!-- Flashcard Mode -->
								<div class="variant-ghost-surface card p-6">
									<!-- Controls -->
									<div class="mb-4 flex items-center justify-between">
										<div class="flex items-center space-x-2">
											<button
												class="variant-ghost-surface btn-icon btn-icon-sm"
												on:click={togglePlay}
												title={isPlaying ? 'Pause' : 'Play'}
												disabled={isEditMode}
											>
												{#if isPlaying}
													<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
														<path d="M6 4h4v16H6zm8 0h4v16h-4z" />
													</svg>
												{:else}
													<Play class="h-5 w-5" />
												{/if}
											</button>
											<button
												class="variant-ghost-surface btn-icon btn-icon-sm"
												title="Shuffle"
												disabled={isEditMode}
											>
												<Shuffle class="h-5 w-5" />
											</button>
											<button
												class="variant-ghost-surface btn-icon btn-icon-sm"
												title="Settings"
												disabled={isEditMode}
											>
												<Settings class="h-5 w-5" />
											</button>
										</div>
										<div class="flex items-center space-x-4">
											<button
												class="variant-ghost-surface btn-icon btn-icon-sm"
												title="Star"
												disabled={isEditMode}
											>
												<Star class="h-5 w-5" />
											</button>

											{#if !isEditMode}
												<button
													class="variant-ghost-surface btn-icon btn-icon-sm"
													title="Edit (Press E)"
													on:click={enterEditMode}
												>
													<Edit class="h-5 w-5" />
												</button>
											{:else}
												<div class="flex items-center space-x-1">
													<button
														class="variant-filled-success btn-icon btn-icon-sm"
														title="Save changes"
														on:click={saveEdit}
														disabled={isSaving}
													>
														{#if isSaving}
															<div
																class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"
															></div>
														{:else}
															<Check class="h-5 w-5" />
														{/if}
													</button>
													<button
														class="variant-filled-error btn-icon btn-icon-sm"
														title="Cancel edit"
														on:click={cancelEdit}
														disabled={isSaving}
													>
														<X class="h-5 w-5" />
													</button>
												</div>
											{/if}

											<div class="text-surface-600-300-token text-sm">
												{$quizState.currentCardIndex + 1} / {$currentFlashcardSet.flashcards.length}
											</div>
										</div>
									</div>

									<!-- Progress Bar -->
									<div class="mb-6">
										<div class="bg-surface-300-600-token h-2 w-full overflow-hidden rounded-full">
											<div
												class="h-2 bg-primary-500 transition-all duration-300"
												style="width: {progress}%"
											></div>
										</div>
										<p class="text-surface-600-300-token mt-1 text-center text-xs">
											{#if isEditMode}
												Edit mode - Click save or cancel when done
											{:else}
												Click card to flip • Press E to edit • Use arrow keys to navigate
											{/if}
										</p>
									</div>

									<!-- Flashcard -->
									<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
									<div
										class="bg-surface-100-800-token rounded-lg preset-outlined-primary-700-300 p-8 text-center transition-all duration-300 {isEditMode
											? 'border-2 border-primary-500'
											: 'hover:bg-surface-200-700-token cursor-pointer'} flex min-h-[300px] items-center justify-center"
										on:click={toggleAnswer}
										on:keydown={(e) => e.key === 'Enter' && toggleAnswer()}
										role={isEditMode ? 'form' : 'button'}
										tabindex={isEditMode ? -1 : null}
									>
										<div class="w-full">
											{#if isEditMode}
												<div class="space-y-4">
													<div>
														<label
															for="edit-term"
															class="text-surface-600-300-token mb-2 block text-sm font-medium"
														>
															Term
														</label>
														<input
															id="edit-term"
															type="text"
															bind:value={editTerm}
															class="variant-form-material input w-full text-center text-xl"
															placeholder="Enter term"
															disabled={isSaving}
														/>
														<div>
															<label
																for="edit-definition"
																class="text-surface-600-300-token mb-2 block text-sm font-medium"
															>
																Definition
															</label>
															<textarea
																id="edit-definition"
																bind:value={editDefinition}
																class="variant-form-material textarea w-full text-center"
																placeholder="Enter definition"
																rows="3"
																disabled={isSaving}
															></textarea>
														</div>
													</div>
												</div>
											{:else}
												<!-- View Mode -->
												{#if !showAnswer}
													<h2 class="text-2xl font-semibold">{currentCard.term}</h2>
												{:else}
													<h2 class="text-xl">{currentCard.definition}</h2>
												{/if}
											{/if}
										</div>
									</div>

									<!-- Navigation -->
									<div class="mt-6 flex items-center justify-between">
										<button
											class=" btn"
											on:click={previousCard}
											disabled={isFirstCard || isEditMode}
										>
											<ChevronLeft class="h-5 w-5" />
										</button>

										<button
											class="variant-filled-primary btn"
											on:click={nextCard}
											disabled={isLastCard || isEditMode}
										>
											<ChevronRight class="h-5 w-5" />
										</button>
									</div>
								</div>
							</Tabs.Panel>

							<Tabs.Panel value="test">
								<!-- Test Mode -->
								<div class=" card p-6">
									<h3 class="mb-4 text-xl font-semibold">Test Mode</h3>

									{#if !testStarted}
										<!-- Button to open modal -->
										<div class="py-8 text-center">
											<p class="text-surface-600-300-token mb-4">
												Click the button below to set up and start the test
											</p>
											<button class="btn preset-filled-primary-500" on:click={startTest}>
												Setup Test
											</button>
										</div>
									{:else if !showTestResults}
										<!-- Test questions -->
										<div class="space-y-6">
											<div class="flex items-center justify-between">
												<h3 class="text-xl font-semibold">
													Question {currentTestQuestion + 1} of {testQuestions.length}
												</h3>
												<div class="text-surface-600-300-token text-sm">
													Progress: {Math.round(
														(currentTestQuestion / testQuestions.length) * 100
													)}%
												</div>
											</div>

											{#if testQuestions[currentTestQuestion]}
												{@const question = testQuestions[currentTestQuestion]}
												<div class="variant-ghost-surface card p-6">
													<h4 class="mb-4 text-lg font-medium">{question.question}</h4>

													{#if question.type === 'multiple_choice'}
														<div class="space-y-2">
															{#each question.options as option}
																<label
																	class="hover:bg-surface-200-700-token flex cursor-pointer items-center space-x-3 rounded-lg p-3"
																>
																	<input
																		type="radio"
																		bind:group={testAnswers[question.id]}
																		value={option}
																		class="radio"
																	/>
																	<span>{option}</span>
																</label>
															{/each}
														</div>
													{:else if question.type === 'true_false'}
														<div class="space-y-2">
															{#each question.options as option}
																<label
																	class="hover:bg-surface-200-700-token flex cursor-pointer items-center space-x-3 rounded-lg p-3"
																>
																	<input
																		type="radio"
																		bind:group={testAnswers[question.id]}
																		value={option.toLowerCase()}
																		class="radio"
																	/>
																	<span>{option}</span>
																</label>
															{/each}
														</div>
													{:else if question.type === 'written'}
														<textarea
															class="textarea w-full"
															placeholder="Type your answer here..."
															bind:value={testAnswers[question.id]}
															rows="3"
														></textarea>
													{/if}
												</div>

												<div class="flex justify-between">
													<button
														class="variant-ghost-surface btn"
														on:click={() =>
															(currentTestQuestion = Math.max(0, currentTestQuestion - 1))}
														disabled={currentTestQuestion === 0}
													>
														Previous
													</button>

													{#if currentTestQuestion === testQuestions.length - 1}
														<button class="variant-filled-primary btn" on:click={submitTest}>
															Submit Test
														</button>
													{:else}
														<button
															class="variant-filled-primary btn"
															on:click={() =>
																(currentTestQuestion = Math.min(
																	testQuestions.length - 1,
																	currentTestQuestion + 1
																))}
														>
															Next
														</button>
													{/if}
												</div>
											{/if}
										</div>
									{:else if showTestResults}
										<!-- Test Results Component -->
										<TestResults
											{testQuestions}
											{testAnswers}
											{testScore}
											{correctAnswers}
											on:retake-test={handleRetakeTest}
											on:back-to-setup={handleBackToSetup}
											on:go-home={handleGoHome}
										/>
									{/if}
								</div>
							</Tabs.Panel>
						{/snippet}
					</Tabs>
				</div>
			</div>
		</div>
	</div>

	<!-- Test Setup Modal -->
	{#if $currentFlashcardSet}
		<TestSetupModal bind:show={showTestSetupModal} on:start-test={handleStartTest} />
	{/if}
{:else}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<h2 class="text-xl font-bold">Loading...</h2>
			<p class="text-surface-600-300-token mt-2">Loading flashcard set...</p>
		</div>
	</div>
{/if}
