<script>
	import { Check, X, RotateCcw, Home } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';

	export let testQuestions = [];
	export let testAnswers = {};
	export let testScore = 0;
	export let correctAnswers = 0;

	const dispatch = createEventDispatcher();

	function retakeTest() {
		dispatch('retake-test');
	}

	function backToSetup() {
		dispatch('back-to-setup');
	}

	function goHome() {
		dispatch('go-home');
	}

	// Calculate percentage for progress bar
	$: correctPercentage =
		testQuestions.length > 0 ? (correctAnswers / testQuestions.length) * 100 : 0;
	$: incorrectPercentage =
		testQuestions.length > 0
			? ((testQuestions.length - correctAnswers) / testQuestions.length) * 100
			: 0;
</script>

<div class="space-y-6">
	<!-- Header Results -->
	<div class="text-center">
		<h2 class="mb-4 text-3xl font-bold">Test Results</h2>

		<!-- Score Display -->
		<div class="mb-6">
			<div
				class="mb-2 text-6xl font-bold {testScore >= 70 ? 'text-success-500' : 'text-error-500'}"
			>
				{testScore.toFixed(0)}%
			</div>
			<p class="text-surface-600-300-token text-lg">
				You scored {correctAnswers} out of {testQuestions.length} questions correctly
			</p>
		</div>

		<!-- Progress Bar -->
		<div class="mx-auto mb-6 max-w-md">
			<div class="bg-surface-300-600-token flex h-4 overflow-hidden rounded-full">
				<div
					class="bg-success-500 transition-all duration-500"
					style="width: {correctPercentage}%"
				></div>
				<div
					class="bg-error-500 transition-all duration-500"
					style="width: {incorrectPercentage}%"
				></div>
			</div>
			<div class="mt-2 flex justify-between text-sm">
				<span class="font-medium text-success-500">{correctAnswers} Correct</span>
				<span class="font-medium text-error-500"
					>{testQuestions.length - correctAnswers} Incorrect</span
				>
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="mb-8 flex justify-center space-x-4">
			<button class="variant-filled-primary btn" on:click={retakeTest}>
				<RotateCcw class="h-4 w-4" />
				<span>Retake Test</span>
			</button>
			<button class="variant-ghost-surface btn" on:click={backToSetup}> Back to Setup </button>
			<button class="variant-ghost-surface btn" on:click={goHome}>
				<Home class="h-4 w-4" />
				<span>Home</span>
			</button>
		</div>
	</div>

	<!-- Detailed Results -->
	<div class="space-y-4">
		<h3 class="text-xl font-semibold">Review Your Answers</h3>

		{#each testQuestions as question, index}
			{@const userAnswer = testAnswers[question.id]}
			{@const isCorrect = question.isCorrect}

			<div class="variant-ghost-surface card p-6">
				<!-- Question Header -->
				<div class="mb-4 flex items-start justify-between">
					<h4 class="flex-1 text-lg font-medium">
						Question {index + 1}
					</h4>
					<div class="flex items-center space-x-2">
						{#if isCorrect}
							<div class="flex items-center space-x-1 text-success-500">
								<Check class="h-5 w-5" />
								<span class="font-medium">Correct</span>
							</div>
						{:else}
							<div class="flex items-center space-x-1 text-error-500">
								<X class="h-5 w-5" />
								<span class="font-medium">Incorrect</span>
							</div>
						{/if}
					</div>
				</div>

				<!-- Question Text -->
				<div class="mb-4">
					<p class="text-surface-700-200-token mb-3 font-medium">
						{question.question}
					</p>
				</div>

				<!-- Answer Section -->
				<div class="space-y-3">
					{#if question.type === 'multiple_choice' || question.type === 'true_false'}
						<!-- Multiple Choice / True False Options -->
						<div class="space-y-2">
							{#each question.options as option}
								{@const isUserAnswer =
									userAnswer === option ||
									(question.type === 'true_false' && userAnswer === option.toLowerCase())}
								{@const isCorrectAnswer =
									question.correctAnswer === option ||
									(question.type === 'true_false' &&
										question.correctAnswer === option.toLowerCase())}

								<div
									class="rounded-lg border-2 p-3 transition-colors
									{isCorrectAnswer ? 'border-success-500 bg-success-50 dark:bg-success-900/20' : ''}
									{isUserAnswer && !isCorrectAnswer ? 'border-error-500 bg-error-50 dark:bg-error-900/20' : ''}
									{!isUserAnswer && !isCorrectAnswer ? 'border-surface-300-600-token bg-surface-100-800-token' : ''}
								"
								>
									<div class="flex items-center justify-between">
										<span class="font-medium">{option}</span>
										<div class="flex items-center space-x-2">
											{#if isCorrectAnswer}
												<span class="text-sm font-medium text-success-500">Correct Answer</span>
												<Check class="h-4 w-4 text-success-500" />
											{/if}
											{#if isUserAnswer && !isCorrectAnswer}
												<span class="text-sm font-medium text-error-500">Your Answer</span>
												<X class="h-4 w-4 text-error-500" />
											{/if}
											{#if isUserAnswer && isCorrectAnswer}
												<span class="text-sm font-medium text-success-500">Your Answer</span>
												<Check class="h-4 w-4 text-success-500" />
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else if question.type === 'written'}
						<!-- Written Answer -->
						<div class="space-y-3">
							<!-- User's Answer -->
							<div
								class="rounded-lg border-2 p-4 {isCorrect
									? 'border-success-500 bg-success-50 dark:bg-success-900/20'
									: 'border-error-500 bg-error-50 dark:bg-error-900/20'}"
							>
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<p
											class="mb-1 text-sm font-medium {isCorrect
												? 'text-success-700 dark:text-success-300'
												: 'text-error-700 dark:text-error-300'}"
										>
											Your Answer:
										</p>
										<p
											class="font-medium {isCorrect
												? 'text-success-600 dark:text-success-400'
												: 'text-error-600 dark:text-error-400'}"
										>
											{userAnswer || 'No answer provided'}
										</p>
									</div>
									{#if isCorrect}
										<Check class="mt-1 h-5 w-5 flex-shrink-0 text-success-500" />
									{:else}
										<X class="mt-1 h-5 w-5 flex-shrink-0 text-error-500" />
									{/if}
								</div>
							</div>

							<!-- Correct Answer (if user was wrong) -->
							{#if !isCorrect}
								<div
									class="rounded-lg border-2 border-success-500 bg-success-50 p-4 dark:bg-success-900/20"
								>
									<div class="flex items-start justify-between">
										<div class="flex-1">
											<p class="mb-1 text-sm font-medium text-success-700 dark:text-success-300">
												Correct Answer:
											</p>
											<p class="font-medium text-success-600 dark:text-success-400">
												{question.correctAnswer}
											</p>
										</div>
										<Check class="mt-1 h-5 w-5 flex-shrink-0 text-success-500" />
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Explanation or additional info -->
				<div class="border-surface-300-600-token mt-4 border-t pt-4">
					<div class="text-surface-600-300-token flex items-center justify-between text-sm">
						<span
							>Question Type: {question.type
								.replace('_', ' ')
								.replace(/\b\w/g, (l) => l.toUpperCase())}</span
						>
						<span>Card: {question.term}</span>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
