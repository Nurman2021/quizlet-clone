<script>
	import { ChevronLeft, Logs, X } from 'lucide-svelte';
	import { createEventDispatcher, onMount } from 'svelte';
	import { slide, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	export let questions = [];
	export let currentQuestionIndex = 0;
	export let testAnswers = {};
	export let showQuestionList = false;
	export let showResults = false; // Flag to show correct/incorrect indicators

	const dispatch = createEventDispatcher();

	// Keyboard shortcuts
	onMount(() => {
		const handleKeyboard = (e) => {
			// Toggle navigation with 'N' key
			if (e.key === 'n' || e.key === 'N') {
				if (
					!e.ctrlKey &&
					!e.altKey &&
					!e.metaKey &&
					e.target.tagName !== 'INPUT' &&
					e.target.tagName !== 'TEXTAREA'
				) {
					e.preventDefault();
					toggleQuestionList();
				}
			}
			// ESC to close navigation
			if (e.key === 'Escape' && showQuestionList) {
				e.preventDefault();
				showQuestionList = false;
				dispatch('toggle-question-list', false);
			}
		};

		window.addEventListener('keydown', handleKeyboard);

		return () => {
			window.removeEventListener('keydown', handleKeyboard);
		};
	});

	function goToQuestion(index) {
		dispatch('go-to-question', index);

		// Auto close on mobile after selection
		if (window.innerWidth < 768) {
			setTimeout(() => {
				showQuestionList = false;
				dispatch('toggle-question-list', false);
			}, 500);
		}
	}

	function toggleQuestionList() {
		showQuestionList = !showQuestionList;
		dispatch('toggle-question-list', showQuestionList);
	}

	// Group questions by type
	$: questionsByType = questions.reduce((acc, question, index) => {
		const type = question.type;
		if (!acc[type]) {
			acc[type] = [];
		}
		acc[type].push({ ...question, index });
		return acc;
	}, {});

	// Get type display names
	function getTypeDisplayName(type) {
		switch (type) {
			case 'true_false':
				return 'True/False';
			case 'multiple_choice':
				return 'Multiple Choice';
			case 'matching':
				return 'Matching';
			case 'written':
				return 'Written';
			default:
				return type;
		}
	}

	// Check if question is answered
	function isAnswered(questionId) {
		return testAnswers[questionId] !== undefined && testAnswers[questionId] !== '';
	}

	// Check if question is correct (only when results are shown)
	function isCorrect(question) {
		if (!showResults || !question) return false;
		return question.isCorrect === true;
	}

	// Check if question is incorrect (only when results are shown)
	function isIncorrect(question) {
		if (!showResults || !question) return false;
		return question.isCorrect === false && isAnswered(question.id);
	}
</script>

{#if showQuestionList}
	<div
		class="fixed top-28 left-0 z-20 flex h-3/5 w-auto flex-col rounded-lg border border-surface-300-700 preset-tonal shadow-xl"
		transition:fly={{ x: -320, duration: 300, easing: quintOut }}
	>
		<!-- Navigation Header -->
		<div class="mb-3 flex items-center gap-2 border-b border-surface-300-700 p-4">
			<!-- <div class="mb-3 flex items-center justify-between"> -->
			<h3 class="text-lg font-semibold">Questions</h3>
			<div class="hidden rounded bg-surface-200-800 px-2 py-1 text-xs text-surface-600-400 md:flex">
				<kbd class="mx-1 rounded bg-surface-300-700 px-1 text-xs">N</kbd> toggle
				<kbd class="mx-1 rounded bg-surface-300-700 px-1 text-xs">ESC</kbd> close
			</div>

			<button
				onclick={toggleQuestionList}
				class="btn-icon btn-icon-sm preset-filled-error-500 shadow-lg transition-all duration-300 hover:scale-110 hover:rotate-90"
				title="Close navigation (ESC)"
			>
				<X class="h-4 w-4" />
			</button>
			<!-- </div> -->
		</div>

		<!-- Question List by Type -->
		<div class="flex-1 space-y-6 overflow-y-auto p-4">
			{#each Object.entries(questionsByType) as [type, typeQuestions]}
				<div>
					<!-- Type Header -->
					<div class="mb-3">
						<span class="badge rounded preset-tonal-primary px-2 py-1 text-xs font-light">
							{getTypeDisplayName(type)}
						</span>
					</div>

					<!-- Questions of this type -->
					<div class="grid grid-cols-5 gap-2">
						{#each typeQuestions as question}
							{@const isActive = question.index === currentQuestionIndex}
							{@const answered = isAnswered(question.id)}
							{@const correct = isCorrect(question)}
							{@const incorrect = isIncorrect(question)}

							<button
								onclick={() => goToQuestion(question.index)}
								class="relative h-10 w-10 transform rounded-lg border-2 text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95
									{isActive
									? 'border-primary-500 bg-primary-500 text-white shadow-lg'
									: showResults
										? correct
											? 'border-success-500 bg-success-500 text-white shadow-md'
											: incorrect
												? 'border-error-500 bg-error-500 text-white shadow-md'
												: 'border-surface-300-700 bg-surface-50-950 text-surface-700-300'
										: answered
											? 'border-success-500 bg-success-100 text-success-700 shadow-md dark:bg-success-900 dark:text-success-200'
											: 'border-surface-300-700 bg-surface-50-950 text-surface-700-300 hover:border-surface-400-600 hover:shadow-md'}
								"
								title="Question {question.index + 1} {showResults
									? correct
										? '(Correct)'
										: incorrect
											? '(Incorrect)'
											: '(Unanswered)'
									: answered
										? '(Answered)'
										: '(Unanswered)'}"
							>
								{question.index + 1}

								<!-- Correct/Incorrect indicators -->
								{#if showResults}
									{#if correct}
										<div
											class="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-success-600"
										>
											<span class="text-xs text-white">✓</span>
										</div>
									{:else if incorrect}
										<div
											class="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-error-600"
										>
											<span class="text-xs text-white">✗</span>
										</div>
									{/if}
								{/if}
							</button>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<!-- Legend Footer -->
		<div class="border-t border-surface-300-700 p-4">
			<div class="space-y-2 text-xs">
				{#if showResults}
					<div class="flex flex-wrap items-center gap-4">
						<div class="flex items-center gap-1">
							<div class="h-3 w-3 rounded bg-success-500"></div>
							<span class="text-surface-600-400">Correct</span>
						</div>
						<div class="flex items-center gap-1">
							<div class="h-3 w-3 rounded bg-error-500"></div>
							<span class="text-surface-600-400">Incorrect</span>
						</div>
						<div class="flex items-center gap-1">
							<div class="h-3 w-3 rounded border-2 border-surface-300-700"></div>
							<span class="text-surface-600-400">Unanswered</span>
						</div>
					</div>
				{:else}
					<div class="flex flex-wrap items-center gap-4">
						<div class="flex items-center gap-1">
							<div class="h-3 w-3 rounded bg-success-500"></div>
							<span class="text-surface-600-400">Answered</span>
						</div>
						<div class="flex items-center gap-1">
							<div class="h-3 w-3 rounded border-2 border-surface-300-700"></div>
							<span class="text-surface-600-400">Unanswered</span>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- Floating Toggle Button -->
<button
	onclick={toggleQuestionList}
	class="fixed top-28 left-4 z-20 btn-icon btn-icon-base preset-filled-primary-500 shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl active:scale-95 {showQuestionList
		? 'pointer-events-none rotate-180 opacity-0'
		: 'rotate-0 opacity-100'}"
	title="Show question list (Press N)"
>
	<Logs class="h-5 w-5" />
</button>
