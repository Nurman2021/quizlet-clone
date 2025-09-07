<script>
	import { Check, X, RotateCcw, Home, Trophy, Award } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';
	import { ProgressRing } from '@skeletonlabs/skeleton-svelte';

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
	$: correctPercentage = hasQuestions ? (correctAnswers / totalQuestions) * 100 : 0;
	$: incorrectPercentage = hasQuestions
		? ((totalQuestions - correctAnswers) / totalQuestions) * 100
		: 0;

	// Get performance level and color
	$: performanceLevel = getPerformanceLevel(testScore);
	$: scoreColor = getScoreColor(testScore);

	function getPerformanceLevel(score) {
		if (score >= 90) return { label: 'Excellent', icon: Trophy };
		if (score >= 80) return { label: 'Great Job', icon: Award };
		if (score >= 70) return { label: 'Good Work', icon: Check };
		return { label: 'Keep Practicing', icon: X };
	}

	function getScoreColor(score) {
		if (score >= 90) return 'stroke-success-500';
		if (score >= 80) return 'stroke-primary-500';
		if (score >= 70) return 'stroke-warning-500';
		return 'stroke-error-500';
	}

	// Performance optimization: Use derived values for expensive calculations
	$: totalQuestions = testQuestions.length;
	$: hasQuestions = totalQuestions > 0;
</script>

<div class="min-h-screen">
	<div class="mx-auto max-w-4xl space-y-8">
		<div class="text-center">
			<h1 class="mb-8 text-4xl font-bold text-surface-900-100">Test Results</h1>
			<div class="mb-8 flex items-center justify-evenly">
				<div class="flex items-center space-x-3 rounded-2xl bg-surface-100-900 px-6 py-3 shadow-lg">
					<svelte:component this={performanceLevel.icon} class="h-6 w-6 {scoreColor}" />
					<span class="text-lg font-semibold {scoreColor}">{performanceLevel.label}</span>
				</div>
				<ProgressRing value={Math.round(testScore)} max={100} showLabel meterStroke={scoreColor} />
				<div class="flex items-center space-x-3 rounded-2xl bg-surface-100-900 px-6 py-3 shadow-lg">
					<Trophy class="h-8 w-8 text-primary-500" />
					<span class="text-lg font-semibold {scoreColor}">
						{correctPercentage.toFixed(0)}% Accuracy
					</span>
				</div>
			</div>
		</div>

		<!-- Statistics Cards -->
		<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
			<!-- Correct Answers -->
			<div class="card rounded-2xl preset-tonal-success p-4 shadow-lg">
				<div class="flex items-center justify-center space-x-3">
					<Check class="h-8 w-8 text-success-500" />
					<div class="text-center">
						<div class="text-2xl font-bold text-success-500">{correctAnswers}</div>
						<div class="text-sm text-success-600">Correct</div>
					</div>
				</div>
			</div>

			<!-- Incorrect Answers -->
			<div class="card rounded-2xl preset-tonal-error p-4 shadow-lg">
				<div class="flex items-center justify-center space-x-3">
					<X class="h-8 w-8 text-error-700-300" />
					<div class="text-center">
						<div class="text-2xl font-bold text-error-700-300">
							{totalQuestions - correctAnswers}
						</div>
						<div class="text-sm text-error-700-300">Incorrect</div>
					</div>
				</div>
			</div>

			<!-- Action Buttons -->
			<button
				class="btn rounded-xl preset-tonal-primary shadow-lg transition-all hover:shadow-xl"
				onclick={retakeTest}
			>
				<RotateCcw class="h-8 w-8 text-primary-500" />
				<span>Retake Test</span>
			</button>
		</div>

		<!-- Detailed Results -->
		<div class="space-y-6">
			<div class="flex items-center justify-between">
				<h2 class="text-2xl font-bold text-surface-900-100">Review Your Answers</h2>
				<div class="text-sm text-surface-600-400">
					{totalQuestions} question{totalQuestions !== 1 ? 's' : ''} total
				</div>
			</div>

			{#if hasQuestions}
				<div class="space-y-4">
					{#each testQuestions as question, index}
						{@const userAnswer = testAnswers[question.id]}
						{@const isCorrect = question.isCorrect}

						<div
							class="card rounded-2xl preset-tonal-surface p-6 shadow-lg transition-all duration-300 hover:shadow-xl"
						>
							<!-- Question Header -->
							<div class="mb-4 flex items-start justify-between">
								<div class="flex items-center space-x-3">
									<div
										class="flex h-8 w-8 items-center justify-center rounded-full bg-surface-200-800 text-sm font-bold"
									>
										{index + 1}
									</div>
									<h3 class="text-lg font-semibold text-surface-900-100">
										Question {index + 1}
									</h3>
								</div>
								<div class="flex items-center space-x-2">
									{#if isCorrect}
										<div
											class="flex items-center space-x-2 rounded-full bg-success-100 px-3 py-1 dark:bg-success-900/20"
										>
											<Check class="h-4 w-4 text-success-500" />
											<span class="text-sm font-medium text-success-600">Correct</span>
										</div>
									{:else}
										<div
											class="flex items-center space-x-2 rounded-full bg-error-100 px-3 py-1 dark:bg-error-900/20"
										>
											<X class="h-4 w-4 text-error-500" />
											<span class="text-sm font-medium text-error-600">Incorrect</span>
										</div>
									{/if}
								</div>
							</div>

							<!-- Question Text -->
							<div class="mb-6">
								<div class="rounded-xl bg-surface-100-900 p-4">
									<p class="text-lg font-medium text-surface-700-300">
										{question.question}
									</p>
								</div>
							</div>

							<!-- Answer Section -->
							<div class="space-y-3">
								{#if question.type === 'multiple_choice' || question.type === 'true_false'}
									<!-- Multiple Choice / True False Options -->
									<div class="space-y-3">
										{#each question.options as option}
											{@const isUserAnswer =
												userAnswer === option ||
												(question.type === 'true_false' && userAnswer === option.toLowerCase())}
											{@const isCorrectAnswer =
												question.isCustomMC && Array.isArray(question.correctAnswer)
													? question.correctAnswer.includes(option)
													: question.correctAnswer === option ||
														(question.type === 'true_false' &&
															question.correctAnswer === option.toLowerCase())}

											<div
												class="rounded-xl border-2 p-4 transition-all duration-200
											{isCorrectAnswer ? 'border-success-500 bg-success-50 shadow-md dark:bg-success-900/20' : ''}
											{isUserAnswer && !isCorrectAnswer
													? 'border-error-500 bg-error-50 shadow-md dark:bg-error-900/20'
													: ''}
											{!isUserAnswer && !isCorrectAnswer ? 'border-surface-300-700 bg-surface-50-950' : ''}
										"
											>
												<div class="flex items-center justify-between">
													<span class="font-medium text-surface-900-100">{option}</span>
													<div class="flex items-center space-x-2">
														{#if isCorrectAnswer}
															<span class="text-sm font-medium text-success-600"
																>Correct Answer</span
															>
															<div class="rounded-full bg-success-500 p-1">
																<Check class="h-3 w-3 text-white" />
															</div>
														{/if}
														{#if isUserAnswer && !isCorrectAnswer}
															<span class="text-sm font-medium text-error-600">Your Answer</span>
															<div class="rounded-full bg-error-500 p-1">
																<X class="h-3 w-3 text-white" />
															</div>
														{/if}
														{#if isUserAnswer && isCorrectAnswer}
															<span class="text-sm font-medium text-success-600">Your Answer</span>
															<div class="rounded-full bg-success-500 p-1">
																<Check class="h-3 w-3 text-white" />
															</div>
														{/if}
													</div>
												</div>
											</div>
										{/each}
									</div>
								{:else if question.type === 'written'}
									<!-- Written Answer -->
									<div class="space-y-4">
										<!-- User's Answer -->
										<div
											class="rounded-xl border-2 p-4 shadow-md {isCorrect
												? 'border-success-500 bg-success-50 dark:bg-success-900/20'
												: 'border-error-500 bg-error-50 dark:bg-error-900/20'}"
										>
											<div class="flex items-start justify-between">
												<div class="flex-1">
													<p
														class="mb-2 text-sm font-semibold {isCorrect
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
												<div
													class="rounded-full {isCorrect ? 'bg-success-500' : 'bg-error-500'} p-1"
												>
													{#if isCorrect}
														<Check class="h-4 w-4 text-white" />
													{:else}
														<X class="h-4 w-4 text-white" />
													{/if}
												</div>
											</div>
										</div>

										<!-- Correct Answer (if user was wrong) -->
										{#if !isCorrect}
											<div
												class="rounded-xl border-2 border-success-500 bg-success-50 p-4 shadow-md dark:bg-success-900/20"
											>
												<div class="flex items-start justify-between">
													<div class="flex-1">
														<p
															class="mb-2 text-sm font-semibold text-success-700 dark:text-success-300"
														>
															Correct Answer{question.isCustomMC &&
															Array.isArray(question.correctAnswer) &&
															question.correctAnswer.length > 1
																? 's'
																: ''}:
														</p>
														<p class="font-medium text-success-600 dark:text-success-400">
															{question.isCustomMC && Array.isArray(question.correctAnswer)
																? question.correctAnswer.join(', ')
																: question.correctAnswer}
														</p>
													</div>
													<div class="rounded-full bg-success-500 p-1">
														<Check class="h-4 w-4 text-white" />
													</div>
												</div>
											</div>
										{/if}
									</div>
								{/if}
							</div>

							<!-- Card Info Footer -->
							<div
								class="mt-6 flex items-center justify-between rounded-xl bg-surface-100-900 px-4 py-3"
							>
								<div class="flex items-center space-x-2">
									<div class="h-2 w-2 rounded-full bg-primary-500"></div>
									<span class="text-sm font-medium text-surface-600-400">
										Question Type: {question.type
											.replace('_', ' ')
											.replace(/\b\w/g, (l) => l.toUpperCase())}
									</span>
								</div>
								<span class="text-sm text-surface-500">Card: {question.term}</span>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<!-- Empty state -->
				<div class="py-12 text-center">
					<div class="mb-4 text-surface-600-400">
						<Trophy class="mx-auto mb-4 h-16 w-16 opacity-50" />
					</div>
					<h3 class="mb-2 text-lg font-semibold text-surface-700-300">No Test Results</h3>
					<p class="text-surface-600-400">No test questions available to review.</p>
				</div>
			{/if}
		</div>
	</div>
</div>
