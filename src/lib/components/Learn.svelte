<script>
	import { ProgressService } from '$lib/services/progressService.js';
	import { toast } from '$lib/stores/toast.js';
	import learnIcon from '$lib/images/learn-img.png';

	let { flashcardSet, filterStarred = false, mode = 'inline' } = $props();

	let currentQuestionIndex = $state(0);
	let userAnswers = $state({});
	let showFeedback = $state(false);
	let selectedAnswer = $state('');
	let currentQuestions = $state([]);
	let correctCount = $state(0);
	let totalAnswered = $state(0);

	// Calculate starred count
	let starredCount = $derived(
		flashcardSet?.flashcards?.filter((card) => card.is_starred)?.length || 0
	);

	// Generate questions when component loads
	$effect(() => {
		if (flashcardSet?.flashcards?.length > 0) {
			generateQuestions();
		}
	});

	function generateQuestions() {
		if (!flashcardSet?.flashcards) return;

		let availableCards = flashcardSet.flashcards;

		// Filter starred cards jika diminta
		if (filterStarred) {
			availableCards = availableCards.filter((card) => card.is_starred);

			if (availableCards.length === 0) {
				toast.warning('No starred cards found in this set');
				return;
			}
		}

		const shuffledCards = [...availableCards].sort(() => Math.random() - 0.5);

		currentQuestions = shuffledCards.map((card, index) => {
			// Generate multiple choice options
			const correctAnswer = card.definition;
			let options = [correctAnswer];

			// Get random wrong answers from other cards
			const otherCards = flashcardSet.flashcards.filter((c) => c.id !== card.id);
			while (options.length < 4 && otherCards.length > 0) {
				const randomCard = otherCards[Math.floor(Math.random() * otherCards.length)];
				if (!options.includes(randomCard.definition)) {
					options.push(randomCard.definition);
				}
				otherCards.splice(
					otherCards.findIndex((c) => c.id === randomCard.id),
					1
				);
			}

			// Fill with dummy options if needed
			while (options.length < 4) {
				options.push(`Option ${options.length}`);
			}

			// Shuffle options
			options = options.sort(() => Math.random() - 0.5);

			return {
				id: index,
				term: card.term,
				definition: card.definition,
				options: options,
				correctAnswer: correctAnswer,
				flashcard_id: card.id,
				userAnswer: null,
				isCorrect: false
			};
		});
	}

	function selectAnswer(answer) {
		if (showFeedback) return;
		selectedAnswer = answer;
	}

	function submitAnswer() {
		if (!selectedAnswer) return;

		const currentQuestion = currentQuestions[currentQuestionIndex];
		const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

		currentQuestion.userAnswer = selectedAnswer;
		currentQuestion.isCorrect = isCorrect;

		userAnswers[currentQuestionIndex] = {
			answer: selectedAnswer,
			isCorrect: isCorrect
		};

		totalAnswered++;
		if (isCorrect) {
			correctCount++;
		}

		// Record progress for the current flashcard
		if (currentQuestion.flashcard_id && flashcardSet?.id) {
			ProgressService.recordAttempt(
				currentQuestion.flashcard_id,
				flashcardSet.id,
				'learn',
				isCorrect,
				null,
				selectedAnswer
			);
		}

		showFeedback = true;
	}

	function continueToNext() {
		if (currentQuestionIndex < currentQuestions.length - 1) {
			currentQuestionIndex++;
			selectedAnswer = '';
			showFeedback = false;
		} else {
			// End of questions - bisa ditambahkan toast notification jika diperlukan
			toast.success(`Quiz completed! Score: ${correctCount}/${currentQuestions.length}`);
		}
	}

	function studyWithLearn() {
		// Reset everything and start over
		generateQuestions();
		currentQuestionIndex = 0;
		selectedAnswer = '';
		showFeedback = false;
		userAnswers = {};
		correctCount = 0;
		totalAnswered = 0;
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
					<input
						type="checkbox"
						bind:checked={filterStarred}
						onchange={generateQuestions}
						class="checkbox"
					/>
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

				<button
					class="btn rounded-full preset-outlined-surface-500 font-semibold"
					onclick={studyWithLearn}
				>
					Study with Learn
				</button>
			</div>

			<div class="mb-8">
				<div class="my-8 flex {mode === 'fullpage' ? 'h-48' : 'h-40'} items-center justify-center">
					<h2 class="mb-4 text-xl font-semibold">{currentQuestion.term}</h2>
				</div>

				{#if !showFeedback}
					<p class="mb-6 text-surface-600-400">Choose an answer</p>
				{:else}
					<p class="mb-6 text-surface-600-400">
						{#if currentQuestion.isCorrect}
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
						class="rounded-lg border p-4 text-left transition-all duration-200 {showFeedback
							? option === currentQuestion.correctAnswer
								? 'border-green-500 bg-green-100 text-green-800 dark:border-green-400 dark:bg-green-900 dark:text-green-200'
								: option === selectedAnswer && option !== currentQuestion.correctAnswer
									? 'border-red-500 bg-red-100 text-red-800 dark:border-red-400 dark:bg-red-900 dark:text-red-200'
									: 'bg-surface-200-700-token border-surface-300-600-token'
							: selectedAnswer === option
								? 'border-primary-500 bg-primary-100 text-primary-800 dark:border-primary-400 dark:bg-primary-900 dark:text-primary-200'
								: 'bg-surface-200-700-token border-surface-300-600-token hover:bg-surface-300-600-token'}"
						onclick={() => selectAnswer(option)}
						disabled={showFeedback}
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

			<!-- Action Button -->
			<div class="flex justify-center">
				{#if !showFeedback}
					<button
						class="btn preset-filled-primary-500 px-8 py-3"
						onclick={submitAnswer}
						disabled={!selectedAnswer}
					>
						Submit
					</button>
				{:else}
					<button class="btn preset-filled-primary-500 px-8 py-3" onclick={continueToNext}>
						{currentQuestionIndex < currentQuestions.length - 1 ? 'Continue' : 'Finish'}
					</button>
				{/if}
			</div>
		</div>

		<!-- Don't know section -->
		{#if !showFeedback}
			<div class="text-center">
				<button
					class="hover:text-surface-900-50-token text-sm text-surface-600-400 underline"
					onclick={() => selectAnswer('') && submitAnswer()}
				>
					Don't know?
				</button>
			</div>
		{/if}
	</div>
{:else}
	<!-- End State -->
	<div class="py-12 text-center">
		<div class="rounded-lg preset-tonal p-8">
			<h3 class="mb-4 text-2xl font-semibold">Great job!</h3>
			<p class="mb-6 text-surface-600-400">
				You completed all {currentQuestions.length} questions.
				<br />
				Score: {correctCount} out of {currentQuestions.length} correct
			</p>
			<button class="btn preset-filled-primary-500" onclick={studyWithLearn}> Study Again </button>
		</div>
	</div>
{/if}
