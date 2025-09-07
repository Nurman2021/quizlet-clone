<script>
	import Modal from './Modal.svelte';
	import { createEventDispatcher } from 'svelte';
	import { toast } from '$lib/stores/toast.js';

	let {
		show = $bindable(),
		mode = 'test', // 'flashcard', 'learn', 'match', 'test'
		flashcardSet = null,
		currentSettings = {}
	} = $props();

	const dispatch = createEventDispatcher();

	// Common settings
	let useStarredOnly = $state(currentSettings.useStarredOnly || false);
	let starredCount = $state(0);
	let isApplyingSettings = $state(false);

	// Test-specific settings
	let questionCount = $state(currentSettings.questionCount || 5);
	let answerWith = $state(currentSettings.answerWith || 'both');
	let trueFalse = $state(
		currentSettings.trueFalse !== undefined ? currentSettings.trueFalse : true
	);
	let multipleChoice = $state(
		currentSettings.multipleChoice !== undefined ? currentSettings.multipleChoice : true
	);
	let matching = $state(currentSettings.matching || false);
	let written = $state(currentSettings.written || false);
	let instantFeedback = $state(currentSettings.instantFeedback || false);

	// Flashcard-specific settings
	let frontSide = $state(currentSettings.frontSide || 'term'); // 'term' or 'definition'
	let shuffle = $state(currentSettings.shuffle || false);
	let autoplay = $state(currentSettings.autoplay || false);

	// Learn-specific settings
	let learnFlashcard = $state(
		currentSettings.learnFlashcard !== undefined ? currentSettings.learnFlashcard : true
	);
	let learnSkip = $state(
		currentSettings.learnSkip !== undefined ? currentSettings.learnSkip : true
	);
	let learnInstantFeedback = $state(
		currentSettings.learnInstantFeedback !== undefined ? currentSettings.learnInstantFeedback : true
	);

	// Computed values
	let maxQuestions = $derived(
		useStarredOnly ? starredCount : flashcardSet?.flashcards?.length || 0
	);

	// Update starredCount when flashcardSet changes
	$effect(() => {
		if (flashcardSet?.flashcards) {
			starredCount = flashcardSet.flashcards.filter((card) => card.is_starred)?.length || 0;
		} else {
			starredCount = 0;
		}
	});

	// Update questionCount when maxQuestions changes (for test mode)
	$effect(() => {
		if (mode === 'test' && questionCount > maxQuestions) {
			questionCount = maxQuestions;
		}
	});

	function closeModal() {
		console.log('Settings: closeModal called');
		if (!isApplyingSettings) {
			console.log('Settings: Manual close - dispatching close event');
			dispatch('close');
		}
		show = false;
	}

	function applySettings() {
		console.log('Settings: applySettings called for mode:', mode);

		// Set flag BEFORE dispatching to prevent close event
		isApplyingSettings = true;

		let config = {
			useStarredOnly,
			mode
		};

		// Add mode-specific settings
		if (mode === 'test') {
			// Validate test settings
			if (!trueFalse && !multipleChoice && !matching && !written) {
				if (maxQuestions >= 1) {
					trueFalse = true;
					written = true;
				} else {
					toast.error('No flashcards available for test');
					isApplyingSettings = false;
					return;
				}
			}

			// Disable invalid question types for small flashcard sets
			if (maxQuestions < 4) {
				if (multipleChoice || matching) {
					toast.info(
						'Multiple choice and matching disabled due to insufficient flashcards (need at least 4)'
					);
					multipleChoice = false;
					matching = false;

					if (!trueFalse && !written) {
						trueFalse = true;
						written = true;
					}
				}
			}

			const validQuestionCount = Math.min(questionCount, maxQuestions);

			config = {
				...config,
				questionCount: validQuestionCount,
				answerWith,
				trueFalse,
				multipleChoice,
				matching,
				written,
				instantFeedback
			};
		} else if (mode === 'flashcard') {
			config = {
				...config,
				frontSide,
				shuffle,
				autoplay
			};
		} else if (mode === 'learn') {
			config = {
				...config,
				learnFlashcard,
				learnSkip,
				learnInstantFeedback
			};
		} else if (mode === 'match') {
			// Match only needs starred filter for now
			config = {
				...config
			};
		}

		console.log('Dispatching apply-settings event with config:', $state.snapshot(config));

		dispatch('apply-settings', config);

		// Close modal directly without triggering close event
		show = false;

		// Reset flag after modal is closed
		setTimeout(() => {
			console.log('Settings: Resetting isApplyingSettings flag');
			isApplyingSettings = false;
		}, 300);
	}

	function getModalTitle() {
		switch (mode) {
			case 'flashcard':
				return 'Flashcard Settings';
			case 'learn':
				return 'Learn Settings';
			case 'match':
				return 'Match Settings';
			case 'test':
				return 'Test Settings';
			default:
				return 'Settings';
		}
	}
</script>

<Modal bind:showModal={show} size="lg" title={getModalTitle()} onClose={closeModal}>
	{#snippet children()}
		<div class="space-y-6">
			<!-- Warning for limited flashcards (all modes) -->
			{#if maxQuestions < 5}
				<div class="rounded-lg border border-warning-200-800 bg-warning-50-950 p-4">
					<div class="flex items-start space-x-3">
						<div class="mt-0.5 text-warning-500">⚠️</div>
						<div>
							<h4 class="font-medium text-warning-800-200">Limited Flashcards</h4>
							<p class="text-sm text-warning-700-300">
								Only {maxQuestions} flashcard{maxQuestions === 1 ? '' : 's'} available{useStarredOnly
									? ' (starred only)'
									: ''}.
								{#if useStarredOnly}
									Consider starring more cards or disable "starred only" filter.
								{:else}
									Consider adding more flashcards for a better experience.
								{/if}
							</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- Starred Filter Option (All modes) -->
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
						<span class="text-surface-500">
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

			<!-- Test-specific settings -->
			{#if mode === 'test'}
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
								<p class="text-xs text-warning-600-400">
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
								<p class="text-xs text-warning-600-400">
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

				<!-- Test Experience Options -->
				<div class="space-y-4">
					<h3 class="font-medium">Test Experience</h3>

					<!-- Instant Feedback -->
					<div class="flex items-center justify-between">
						<div class="flex-1">
							<label for="instantFeedback" class="font-medium">Instant feedback</label>
							<p class="text-xs text-surface-600-400">
								Show correct/incorrect answers immediately after selection
							</p>
						</div>
						<input
							id="instantFeedback"
							type="checkbox"
							bind:checked={instantFeedback}
							class="checkbox"
						/>
					</div>
				</div>
			{/if}

			<!-- Flashcard-specific settings -->
			{#if mode === 'flashcard'}
				<div class="space-y-4">
					<h3 class="font-medium">Flashcard Options</h3>

					<!-- Front Side -->
					<div class="space-y-3">
						<label for="frontSide" class="font-medium">Front side shows</label>
						<select id="frontSide" bind:value={frontSide} class="select w-full">
							<option value="term">Term</option>
							<option value="definition">Definition</option>
						</select>
					</div>

					<!-- Shuffle -->
					<div class="flex items-center justify-between">
						<label for="shuffle" class="font-medium">Shuffle cards</label>
						<input id="shuffle" type="checkbox" bind:checked={shuffle} class="checkbox" />
					</div>

					<!-- Autoplay -->
					<div class="flex items-center justify-between">
						<label for="autoplay" class="font-medium">Autoplay</label>
						<input id="autoplay" type="checkbox" bind:checked={autoplay} class="checkbox" />
					</div>
				</div>
			{/if}

			<!-- Learn-specific settings -->
			{#if mode === 'learn'}
				<div class="space-y-4">
					<h3 class="font-medium">Learn Options</h3>

					<!-- Flashcard Option -->
					<div class="flex items-center justify-between">
						<div class="flex-1">
							<label for="learnFlashcard" class="font-medium">Flashcard</label>
							<p class="text-xs text-surface-600-400">
								Include flashcard review mode in learn session
							</p>
						</div>
						<input
							id="learnFlashcard"
							type="checkbox"
							bind:checked={learnFlashcard}
							class="checkbox"
						/>
					</div>

					<!-- Skip Option -->
					<div class="flex items-center justify-between">
						<div class="flex-1">
							<label for="learnSkip" class="font-medium">Skip</label>
							<p class="text-xs text-surface-600-400">Allow skipping cards you know well</p>
						</div>
						<input id="learnSkip" type="checkbox" bind:checked={learnSkip} class="checkbox" />
					</div>

					<!-- Instant Feedback Option -->
					<div class="flex items-center justify-between">
						<div class="flex-1">
							<label for="learnInstantFeedback" class="font-medium">Instant feedback</label>
							<p class="text-xs text-surface-600-400">
								Show correct/incorrect answers immediately during learn mode
							</p>
						</div>
						<input
							id="learnInstantFeedback"
							type="checkbox"
							bind:checked={learnInstantFeedback}
							class="checkbox"
						/>
					</div>
				</div>
			{/if}

			<!-- Match mode settings -->
			{#if mode === 'match'}
				<div class="space-y-4">
					<h3 class="font-medium">Match Options</h3>
					<p class="text-sm text-surface-600-400">
						Match mode will test your ability to quickly connect terms with their definitions.
					</p>
				</div>
			{/if}

			<!-- Actions -->
			<div class="flex justify-end gap-2 pt-4">
				<button onclick={closeModal} class="btn preset-tonal"> Cancel </button>
				<button onclick={applySettings} class="btn preset-filled-primary-100-900 px-8">
					{mode === 'test' ? 'Start test' : 'Apply settings'}
				</button>
			</div>
		</div>
	{/snippet}
</Modal>
