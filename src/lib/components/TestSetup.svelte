<script>
	import Modal from './Modal.svelte';
	import { createEventDispatcher } from 'svelte';
	import { toast } from '$lib/stores/toast.js';

	let { show = $bindable(), maxQuestions = 20, flashcardSet = null } = $props();

	const dispatch = createEventDispatcher();

	let questionCount = $state(Math.min(5, maxQuestions));
	let answerWith = $state('both');
	let trueFalse = $state(true);
	let multipleChoice = $state(true);
	let matching = $state(false);
	let written = $state(false);
	let useStarredOnly = $state(false);
	let starredCount = $state(0);
	let isStartingTest = $state(false);

	// Update questionCount when maxQuestions changes
	$effect(() => {
		if (questionCount > maxQuestions) {
			questionCount = maxQuestions;
		}
	});

	// Update starredCount when flashcardSet or maxQuestions changes
	$effect(() => {
		if (flashcardSet?.flashcards) {
			starredCount = flashcardSet.flashcards.filter((card) => card.is_starred)?.length || 0;
		} else {
			starredCount = 0;
		}
	});

	function closeModal() {
		console.log('TestSetup: closeModal called');
		if (!isStartingTest) {
			console.log('TestSetup: Manual close - dispatching close event');
			dispatch('close');
		}
		show = false;
	}

	function startTest() {
		console.log('TestSetup: startTest called');

		// Auto-enable True/False and Written if no question types selected and maxQuestions is limited
		if (!trueFalse && !multipleChoice && !matching && !written) {
			if (maxQuestions >= 1) {
				trueFalse = true;
				written = true;
			} else {
				toast.error('No flashcards available for test');
				return;
			}
		}

		// Disable invalid question types for small flashcard sets
		if (maxQuestions < 4) {
			if (multipleChoice || matching) {
				// Show user-friendly notification instead of console warning
				toast.info(
					'Multiple choice and matching disabled due to insufficient flashcards (need at least 4)'
				);
				multipleChoice = false;
				matching = false;

				// Ensure at least True/False or Written is enabled
				if (!trueFalse && !written) {
					trueFalse = true;
					written = true;
				}
			}
		}

		// Ensure questionCount doesn't exceed available flashcards
		const validQuestionCount = Math.min(questionCount, maxQuestions);

		const config = {
			questionCount: validQuestionCount,
			answerWith,
			trueFalse,
			multipleChoice,
			matching,
			written,
			useStarredOnly // Tambahan untuk starred filter
		};

		// Use $state.snapshot to avoid proxy warning in console
		console.log('Dispatching start-test event with config:', $state.snapshot(config));

		// Set flag BEFORE dispatching to prevent close event
		isStartingTest = true;

		dispatch('start-test', config);

		// Close modal directly without triggering close event
		show = false;

		// Reset flag after modal is closed
		setTimeout(() => {
			console.log('TestSetup: Resetting isStartingTest flag');
			isStartingTest = false;
		}, 300);
	}
</script>

<Modal bind:showModal={show} size="lg" title="Set up your test" onClose={closeModal}>
	{#snippet children()}
		<!-- Configuration Options -->
		<div class="space-y-6">
			<!-- Warning for limited flashcards -->
			{#if maxQuestions < 5}
				<div class="bg-warning-50-900-token border-warning-200-700-token rounded-lg border p-4">
					<div class="flex items-start space-x-3">
						<div class="mt-0.5 text-warning-500">⚠️</div>
						<div>
							<h4 class="text-warning-800-100-token font-medium">Limited Flashcards</h4>
							<p class="text-warning-700-200-token text-sm">
								Only {maxQuestions} flashcard{maxQuestions === 1 ? '' : 's'} available. Consider adding
								more flashcards for a better test experience.
							</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- Questions Count -->
			<div class="flex items-center justify-between">
				<label for="maxQuestions" class="font-medium">
					Questions
					<span class="text-surface-500">
						({questionCount} of {maxQuestions} available)
					</span>
				</label>
				<input
					id="maxQuestions"
					type="number"
					min="1"
					max={maxQuestions}
					bind:value={questionCount}
					class="input w-20"
				/>
			</div>

			<!-- Answer With -->
			<div class="space-y-3">
				<label for="answerWith" class="font-medium">Answer with</label>
				<select id="answerWith" bind:value={answerWith} class="select w-full">
					<option value="terms">Terms</option>
					<option value="definitions">Definitions</option>
					<option value="both">Both</option>
				</select>
			</div>

			<!-- Question Types -->
			<div class="space-y-4">
				<h3 class="font-medium">Question types</h3>

				<!-- True/False -->
				<div class="flex items-center justify-between">
					<label for="trueFalse" class="font-medium">True/False</label>
					<input id="trueFalse" type="checkbox" bind:checked={trueFalse} class="checkbox" />
				</div>

				<!-- Multiple Choice -->
				<div class="flex items-center justify-between">
					<div class="flex-1">
						<label for="multipleChoice" class="font-medium">Multiple choice</label>
						{#if maxQuestions < 4}
							<p class="text-warning-600-300-token text-xs">
								Need at least 4 flashcards for good multiple choice options
							</p>
						{/if}
					</div>
					<input
						id="multipleChoice"
						type="checkbox"
						bind:checked={multipleChoice}
						class="checkbox"
						disabled={maxQuestions < 2}
					/>
				</div>

				<!-- Matching -->
				<div class="flex items-center justify-between">
					<div class="flex-1">
						<label for="matching" class="font-medium">Matching</label>
						{#if maxQuestions < 4}
							<p class="text-warning-600-300-token text-xs">
								Need at least 4 flashcards for good matching options
							</p>
						{/if}
					</div>
					<input
						id="matching"
						type="checkbox"
						bind:checked={matching}
						class="checkbox"
						disabled={maxQuestions < 2}
					/>
				</div>

				<!-- Written -->
				<div class="flex items-center justify-between">
					<label for="written" class="font-medium">Written</label>
					<input id="written" type="checkbox" bind:checked={written} class="checkbox" />
				</div>
			</div>

			<!-- Starred Filter Option -->
			<div class="space-y-3">
				<h3 class="text-lg font-semibold">Card Selection</h3>

				<label class="flex items-center space-x-3">
					<input
						type="checkbox"
						bind:checked={useStarredOnly}
						disabled={starredCount === 0}
						class="checkbox"
					/>
					<span class="text-sm">
						Use starred cards only
						<span class="text-surface-500-400-token">
							({starredCount} available)
						</span>
					</span>
				</label>

				{#if useStarredOnly && starredCount === 0}
					<p class="text-sm text-warning-500">
						No starred cards available. Please star some cards first.
					</p>
				{/if}
			</div>

			<!-- Actions -->
			<div class="flex justify-end gap-2 pt-4">
				<button onclick={closeModal} class="preset-outlined-neutral-500-900 btn"> Cancel </button>
				<button onclick={startTest} class="preset-filled-primary-500-900 btn px-8">
					Start test
				</button>
			</div>
		</div>
	{/snippet}
</Modal>
