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

		// Auto close on mobile after selection for better UX
		if (window.innerWidth < 768) {
			showQuestionList = false;
			dispatch('toggle-question-list', false);
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
		class="fixed top-20 left-4 z-30 flex h-auto max-h-[70vh] w-72 sm:w-80 md:w-96 flex-col rounded-xl border border-surface-300-700 bg-surface-50-950 shadow-2xl backdrop-blur-sm
		   md:top-24 md:left-6"
		transition:fly={{ x: -320, duration: 300, easing: quintOut }}
	>
		<!-- Navigation Header -->
		<div class="flex items-center justify-between border-b border-surface-300-700 px-4 py-3">
			<h3 class="text-sm font-semibold text-surface-900-50">Questions</h3>
			
			<div class="flex items-center gap-2">
				<div class="hidden rounded-full bg-surface-200-800 px-3 py-1 text-xs text-surface-600-400 lg:block">
					Press <kbd class="mx-1 rounded bg-surface-300-700 px-1 text-xs">N</kbd>
				</div>

				<button
					onclick={toggleQuestionList}
					class="rounded-full p-1.5 text-surface-600-400 transition-colors hover:bg-surface-200-800 hover:text-surface-900-50"
					title="Close navigation (ESC)"
				>
					<X class="h-4 w-4" />
				</button>
			</div>
		</div>

		<!-- Question List by Type -->
		<div class="flex-1 overflow-y-auto px-4 py-3">
			{#each Object.entries(questionsByType) as [type, typeQuestions]}
				<div class="mb-4 last:mb-0">
					<!-- Type Header -->
					<div class="mb-2">
						<span class="inline-block rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
							{getTypeDisplayName(type)} ({typeQuestions.length})
						</span>
					</div>

					<!-- Questions Grid - Responsive -->
					<div class="grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-10">
						{#each typeQuestions as question}
							{@const isActive = question.index === currentQuestionIndex}
							{@const answered = isAnswered(question.id)}
							{@const correct = isCorrect(question)}
							{@const incorrect = isIncorrect(question)}

							<button
								onclick={() => goToQuestion(question.index)}
								class="relative flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95
									{isActive
									? 'bg-primary-500 text-white shadow-lg ring-2 ring-primary-300'
									: showResults
										? correct
											? 'bg-success-500 text-white'
											: incorrect
												? 'bg-error-500 text-white'
												: 'bg-surface-200-800 text-surface-600-400'
										: answered
											? 'bg-success-100 text-success-700 ring-1 ring-success-300 dark:bg-success-900/40 dark:text-success-300'
											: 'bg-surface-200-800 text-surface-600-400 hover:bg-surface-300-700'}"
								title="Question {question.index + 1}"
							>
								{question.index + 1}

								<!-- Status indicator dot -->
								{#if showResults}
									{#if correct}
										<div class="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-success-400"></div>
									{:else if incorrect}
										<div class="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-error-400"></div>
									{/if}
								{:else if answered}
									<div class="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-success-400"></div>
								{/if}
							</button>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<!-- Simplified Legend Footer -->
		<div class="border-t border-surface-300-700 px-4 py-3">
			{#if showResults}
				<div class="flex items-center justify-center gap-4 text-xs">
					<div class="flex items-center gap-1.5">
						<div class="h-2.5 w-2.5 rounded-full bg-success-500"></div>
						<span class="text-surface-600-400">Correct</span>
					</div>
					<div class="flex items-center gap-1.5">
						<div class="h-2.5 w-2.5 rounded-full bg-error-500"></div>
						<span class="text-surface-600-400">Wrong</span>
					</div>
				</div>
			{:else}
				<div class="flex items-center justify-center gap-4 text-xs">
					<div class="flex items-center gap-1.5">
						<div class="h-2.5 w-2.5 rounded-full bg-success-400"></div>
						<span class="text-surface-600-400">Answered</span>
					</div>
					<div class="flex items-center gap-1.5">
						<div class="h-2.5 w-2.5 rounded-full bg-surface-400-600"></div>
						<span class="text-surface-600-400">Pending</span>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<!-- Simplified Floating Toggle Button -->
<button
	onclick={toggleQuestionList}
	class="fixed top-24 left-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg transition-all duration-300 hover:bg-primary-600 hover:scale-110 hover:shadow-xl active:scale-95 {showQuestionList
		? 'pointer-events-none rotate-180 opacity-0'
		: 'rotate-0 opacity-100'}"
	title="Show questions (Press N)"
>
	<Logs class="h-5 w-5" />
</button>
