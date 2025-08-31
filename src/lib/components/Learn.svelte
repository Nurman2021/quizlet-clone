<script>
	import { QuestionService } from '$lib/services/questionService.js';
	import { FeedbackService } from '$lib/services/feedbackService.js';
	import { toast } from '$lib/stores/toast.js';
	import learnIcon from '$lib/images/learn-img.png';

	let { flashcardSet, filterStarred = false, mode = 'inline' } = $props();

	let currentQuestionIndex = $state(0);
	let selectedAnswer = $state('');
	let currentQuestions = $state([]);
	let currentFeedback = $state(null);
	let sessionResults = $state({});

	// Calculate starred count
	let starredCount = $derived(
		flashcardSet?.flashcards?.filter((card) => card.is_starred)?.length || 0
	);

	// Generate questions when component loads or when filter changes
	$effect(() => {
		if (flashcardSet?.flashcards?.length > 0) {
			// Access filterStarred here to make it a dependency
			const shouldFilterStarred = filterStarred;

			console.log('Generating questions with filterStarred:', shouldFilterStarred);

			// Use centralized question service
			const newQuestions = QuestionService.generateMultipleChoice(flashcardSet.flashcards, {
				maxOptions: 4,
				questionType: 'definition',
				filterStarred: shouldFilterStarred,
				shuffleQuestions: true,
				dynamicOptions: true
			});

			if (newQuestions.length === 0) {
				toast.warning('No cards available for questions');
				currentQuestions = [];
				currentQuestionIndex = 0;
				selectedAnswer = '';
				currentFeedback = null;
				sessionResults = {};
				return;
			}

			// Update state
			currentQuestions = newQuestions;
			currentQuestionIndex = 0;
			selectedAnswer = '';
			currentFeedback = null;
			sessionResults = {};
		}
	});

	function generateQuestions() {
		// This function now just triggers the effect by accessing reactive state
		// The actual generation logic is in the effect above
		if (!flashcardSet?.flashcards) return;

		// Force re-generation by updating a dummy reactive variable or just call the logic directly
		const newQuestions = QuestionService.generateMultipleChoice(flashcardSet.flashcards, {
			maxOptions: 4,
			questionType: 'definition',
			filterStarred: filterStarred,
			shuffleQuestions: true,
			dynamicOptions: true
		});

		if (newQuestions.length === 0) {
			toast.warning('No cards available for questions');
			currentQuestions = [];
			return;
		}

		currentQuestions = newQuestions;
		currentQuestionIndex = 0;
		selectedAnswer = '';
		currentFeedback = null;
		sessionResults = {};
	}

	function selectAnswer(answer) {
		if (currentFeedback) return;
		selectedAnswer = answer;

		// Use centralized feedback service
		const currentQuestion = currentQuestions[currentQuestionIndex];
		currentQuestion.startTime = currentQuestion.startTime || Date.now();

		const feedbackResult = FeedbackService.processAnswer(
			currentQuestion,
			answer,
			flashcardSet.id,
			'learn',
			{
				autoProgress: true,
				progressDelay: 1500,
				recordProgress: true,
				showCorrectAnswer: true
			}
		);

		currentFeedback = feedbackResult;

		// Show feedback and handle auto-progress
		FeedbackService.showFeedback(feedbackResult, (result) => {
			if (result.isCorrect) {
				continueToNext();
			}
		});
	}

	function continueToNext() {
		if (currentQuestionIndex < currentQuestions.length - 1) {
			currentQuestionIndex++;
			selectedAnswer = '';
			currentFeedback = null;
		} else {
			// Calculate final results using centralized service
			sessionResults = FeedbackService.calculateSessionResults(currentQuestions);
			toast.success(
				`Quiz completed! Score: ${sessionResults.correctAnswers}/${sessionResults.totalQuestions}`
			);
		}
	}

	function showHint() {
		// Use centralized feedback service for hint
		const currentQuestion = currentQuestions[currentQuestionIndex];
		currentQuestion.startTime = currentQuestion.startTime || Date.now();

		const feedbackResult = FeedbackService.processAnswer(
			currentQuestion,
			'', // Empty answer for hint
			flashcardSet.id,
			'learn',
			{
				autoProgress: false,
				recordProgress: true,
				showCorrectAnswer: true
			}
		);

		selectedAnswer = '';
		currentFeedback = feedbackResult;
	}
	function studyWithLearn() {
		// Reset everything and start over
		generateQuestions();
	}

	let currentQuestion = $derived(currentQuestions[currentQuestionIndex]);
	let progress = $derived(
		currentQuestions.length > 0
			? `${currentQuestionIndex + 1} / ${currentQuestions.length}`
			: '0 / 0'
	);
</script>

{#if currentQuestions.length === 0}
	<!-- Loading State -->
	<div class="flex h-96 items-center justify-center">
		<div class="text-center">
			<div
				class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"
			></div>
			<p class="text-surface-600-400">Generating questions...</p>
		</div>
	</div>
{:else if currentQuestion}
	<!-- Learn Interface -->
	<div class="space-y-6 {mode === 'fullpage' ? 'mx-auto max-w-4xl px-6 py-8' : ''}">
		<!-- Filter Toggle -->
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-xl font-semibold">Learn Mode</h2>

			<div class="flex items-center space-x-4">
				<label class="flex items-center space-x-2">
					<input type="checkbox" bind:checked={filterStarred} class="checkbox" />
					<span class="text-sm">Starred only ({starredCount})</span>
				</label>
			</div>
		</div>

		<!-- Question Card -->
		<div class="rounded-lg preset-tonal {mode === 'fullpage' ? 'p-12' : 'p-8'}">
			<!-- Header with Progress -->
			<div class="flex items-center justify-between">
				<div class="flex gap-4">
					<img src={learnIcon} alt="learn" class="mx-auto mb-1 h-9 w-9 object-contain" />
					<h3 class="text-lg font-semibold">Learn</h3>
				</div>
				<div>
					<p class="text-sm text-surface-600-400">{progress}</p>
				</div>
				<a
					href="/quiz/{flashcardSet.id}/learn"
					class="btn rounded-full preset-outlined-surface-500 font-semibold"
				>
					Study with Learn
				</a>
			</div>

			<div class="mb-8">
				<div class="my-8 flex {mode === 'fullpage' ? 'h-48' : 'h-40'} items-center justify-center">
					<h2 class="mb-4 text-xl font-semibold">{currentQuestion.question}</h2>
				</div>

				{#if !currentFeedback}
					<p class="mb-6 text-surface-600-400">Choose an answer</p>
				{:else}
					<p class="mb-6 text-surface-600-400">
						{#if currentFeedback.isCorrect}
							<span class="font-medium text-green-600">Correct!</span>
						{:else}
							<span class="font-medium text-red-600">Incorrect.</span> The correct answer is:
							<span class="font-medium">{currentQuestion.correctAnswer}</span>
						{/if}
					</p>
				{/if}
			</div>

			<!-- Answer Options -->
			<div class="mb-8 grid grid-cols-2 gap-3">
				{#each currentQuestion.options as option, index}
					<button
						class="rounded-lg border p-4 text-left transition-all duration-200 {currentFeedback
							? option === currentQuestion.correctAnswer
								? 'border-green-500 bg-green-100 text-green-800 dark:border-green-400 dark:bg-green-900 dark:text-green-200'
								: option === selectedAnswer && option !== currentQuestion.correctAnswer
									? 'border-red-500 bg-red-100 text-red-800 dark:border-red-400 dark:bg-red-900 dark:text-red-200'
									: 'bg-surface-200-700-token border-surface-300-600-token'
							: selectedAnswer === option
								? 'border-primary-500 bg-primary-100 text-primary-800 dark:border-primary-400 dark:bg-primary-900 dark:text-primary-200'
								: 'bg-surface-200-700-token border-surface-300-600-token hover:bg-surface-300-600-token'}"
						onclick={() => selectAnswer(option)}
						disabled={currentFeedback}
					>
						<div class="flex items-center space-x-3">
							<span
								class="flex h-8 w-8 items-center justify-center rounded-full bg-surface-500 text-sm font-medium text-white"
							>
								{index + 1}
							</span>
							<span class="text-lg">{option}</span>
						</div>
					</button>
				{/each}
			</div>
		</div>

		<!-- Don't know / Continue section -->
		<div class="text-center">
			{#if !currentFeedback}
				<button
					class="hover:text-surface-900-50-token text-sm text-surface-600-400 underline"
					onclick={showHint}
				>
					Don't know?
				</button>
			{:else if !currentFeedback.isCorrect}
				<button class="btn preset-filled-primary-500 px-6 py-2" onclick={continueToNext}>
					{currentQuestionIndex < currentQuestions.length - 1 ? 'Continue' : 'Finish'}
				</button>
			{/if}
		</div>
	</div>
{:else}
	<!-- End State -->
	<div class="py-12 text-center">
		<div class="rounded-lg preset-tonal p-8">
			<h3 class="mb-4 text-2xl font-semibold">Great job!</h3>
			<p class="mb-6 text-surface-600-400">
				You completed all {currentQuestions.length} questions.
				<br />
				Score: {sessionResults?.correctAnswers || 0} out of {currentQuestions.length} correct
			</p>
			<button class="btn preset-filled-primary-500" onclick={studyWithLearn}> Study Again </button>
		</div>
	</div>
{/if}
