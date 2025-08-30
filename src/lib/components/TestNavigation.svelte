<script>
	import { ChevronLeft, Eye, EyeOff } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';

	export let questions = [];
	export let currentQuestionIndex = 0;
	export let testAnswers = {};
	export let showQuestionList = true;

	const dispatch = createEventDispatcher();

	function goToQuestion(index) {
		dispatch('go-to-question', index);
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

	// Get type colors
	function getTypeColor(type) {
		switch (type) {
			case 'true_false':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
			case 'multiple_choice':
				return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
			case 'matching':
				return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
			case 'written':
				return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
		}
	}

	// Check if question is answered
	function isAnswered(questionId) {
		return testAnswers[questionId] !== undefined && testAnswers[questionId] !== '';
	}
</script>

{#if showQuestionList}
	<div
		class="bg-surface-100-800-token border-surface-300-600-token flex h-full w-80 flex-col border-r"
	>
		<!-- Navigation Header -->
		<div class="border-surface-300-600-token border-b p-4">
			<div class="mb-3 flex items-center justify-between">
				<h3 class="text-lg font-semibold">Questions</h3>
				<button
					onclick={toggleQuestionList}
					class="btn-icon btn-icon-sm preset-tonal-surface"
					title="Hide question list"
				>
					<EyeOff class="h-4 w-4" />
				</button>
			</div>
			<div class="text-surface-600-300-token text-sm">
				{Object.keys(testAnswers).length} of {questions.length} answered
			</div>
		</div>

		<!-- Question List by Type -->
		<div class="flex-1 space-y-6 overflow-y-auto p-4">
			{#each Object.entries(questionsByType) as [type, typeQuestions]}
				<div>
					<!-- Type Header -->
					<div class="mb-3 flex items-center justify-between">
						<div class="flex items-center space-x-2">
							<span class="rounded px-2 py-1 text-xs font-medium {getTypeColor(type)}">
								{getTypeDisplayName(type)}
							</span>
							<span class="text-surface-600-300-token text-sm">
								{typeQuestions.length}
							</span>
						</div>
					</div>

					<!-- Questions of this type -->
					<div class="grid grid-cols-5 gap-2">
						{#each typeQuestions as question}
							{@const isActive = question.index === currentQuestionIndex}
							{@const answered = isAnswered(question.id)}

							<button
								onclick={() => goToQuestion(question.index)}
								class="h-10 w-10 rounded-lg border-2 text-sm font-medium transition-all duration-200
									{isActive
									? 'border-primary-500 bg-primary-500 text-white'
									: answered
										? 'border-success-500 bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-200'
										: 'border-surface-300-600-token bg-surface-50-900-token text-surface-700-200-token hover:border-surface-400-500-token'}
								"
								title="Question {question.index + 1}"
							>
								{question.index + 1}
							</button>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<!-- Navigation Footer -->
		<div class="border-surface-300-600-token border-t p-4">
			<div class="flex items-center justify-between text-sm">
				<div class="flex items-center space-x-4">
					<div class="flex items-center space-x-1">
						<div class="h-3 w-3 rounded bg-success-500"></div>
						<span class="text-surface-600-300-token">Answered</span>
					</div>
					<div class="flex items-center space-x-1">
						<div class="border-surface-300-600-token h-3 w-3 rounded border-2"></div>
						<span class="text-surface-600-300-token">Unanswered</span>
					</div>
				</div>
			</div>
		</div>
	</div>
{:else}
	<!-- Collapsed Navigation -->
	<div
		class="bg-surface-100-800-token border-surface-300-600-token flex w-12 flex-col items-center border-r py-4"
	>
		<button
			onclick={toggleQuestionList}
			class="mb-4 btn-icon btn-icon-sm preset-tonal-surface"
			title="Show question list"
		>
			<Eye class="h-4 w-4" />
		</button>

		<!-- Current Question Indicator -->
		<div class="text-center">
			<div class="text-surface-600-300-token mb-1 text-xs">Q</div>
			<div
				class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-sm font-medium text-white"
			>
				{currentQuestionIndex + 1}
			</div>
		</div>
	</div>
{/if}
