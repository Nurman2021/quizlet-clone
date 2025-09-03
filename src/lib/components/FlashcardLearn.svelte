<script>
	import Flashcard from './Flashcard.svelte';
	import Learn from './Learn.svelte';
	import { ProgressService } from '$lib/services/progressService.js';
	import { toast } from '$lib/stores/toast.js';

	let {
		flashcardSet = $bindable(),
		mode = 'inline', // 'fullpage' atau 'inline'
		// Settings props
		frontSide = 'term',
		autoplayEnabled = false,
		shuffleEnabled = false,
		useStarredOnly = false,
		onRestart = null,
		onExit = null
	} = $props();

	let currentIndex = $state(0);
	let trackProgressMode = $state(false);
	let showFlashcard = $state(true);

	// Filter flashcards based on starred setting
	let filteredFlashcards = $derived(() => {
		if (!flashcardSet?.flashcards) return [];

		if (useStarredOnly) {
			return flashcardSet.flashcards.filter((card) => card.is_starred);
		}

		return flashcardSet.flashcards;
	});

	// Create filtered flashcard set
	let workingFlashcardSet = $derived(() => {
		if (!flashcardSet) return null;

		return {
			...flashcardSet,
			flashcards: filteredFlashcards
		};
	});

	// Handle track progress toggle
	function handleTrackProgressToggle(enabled) {
		trackProgressMode = enabled;

		if (enabled) {
			// Switch to learn mode
			showFlashcard = false;
			toast.success('Switched to Learn mode with progress tracking!');
		} else {
			// Switch back to flashcard mode
			showFlashcard = true;
			toast.info('Switched back to Flashcard mode');
		}
	}

	// Record flashcard interaction for progress tracking
	async function recordFlashcardProgress(cardId, action) {
		if (!trackProgressMode) return;

		try {
			// Record different types of interactions
			let isCorrect = true; // Assume viewing flashcard is positive
			let responseTime = null;
			let answerText = action;

			await ProgressService.recordAttempt(
				cardId,
				flashcardSet.id,
				'flashcard',
				isCorrect,
				responseTime,
				answerText
			);
		} catch (error) {
			console.error('Error recording flashcard progress:', error);
		}
	}

	// Handle next card in flashcard mode
	function handleNextCard() {
		if (trackProgressMode && workingFlashcardSet?.flashcards[currentIndex]) {
			recordFlashcardProgress(workingFlashcardSet.flashcards[currentIndex].id, 'next_card');
		}
	}

	// Handle previous card in flashcard mode
	function handlePreviousCard() {
		if (trackProgressMode && workingFlashcardSet?.flashcards[currentIndex]) {
			recordFlashcardProgress(workingFlashcardSet.flashcards[currentIndex].id, 'previous_card');
		}
	}

	// Handle card flip in flashcard mode
	function handleCardFlip() {
		if (trackProgressMode && workingFlashcardSet?.flashcards[currentIndex]) {
			recordFlashcardProgress(workingFlashcardSet.flashcards[currentIndex].id, 'card_flip');
		}
	}

	// Handle star toggle
	function handleStarToggle(cardId) {
		if (trackProgressMode) {
			recordFlashcardProgress(cardId, 'star_toggle');
		}
	}

	// Switch back to flashcard mode
	function switchToFlashcard() {
		showFlashcard = true;
		trackProgressMode = false;
		toast.info('Switched back to Flashcard mode');
	}

	// Switch to learn mode
	function switchToLearn() {
		showFlashcard = false;
		trackProgressMode = true;
		toast.success('Switched to Learn mode!');
	}
</script>

{#if workingFlashcardSet && workingFlashcardSet.flashcards.length > 0}
	{#if showFlashcard}
		<!-- Flashcard Mode -->
		<Flashcard
			bind:flashcardSet={workingFlashcardSet}
			bind:currentIndex
			{mode}
			{frontSide}
			{autoplayEnabled}
			{shuffleEnabled}
			onNext={handleNextCard}
			onPrevious={handlePreviousCard}
			onStarToggle={handleStarToggle}
			onCardEdit={(card) => {
				// Handle card edit if needed
				console.log('Card edited:', card);
			}}
			onTrackProgressToggle={handleTrackProgressToggle}
			showTrackProgress={true}
		/>
	{:else}
		<!-- Learn Mode -->
		<div class="space-y-4">
			<!-- Mode Switch Header -->
			<div class="flex items-center justify-between border-b border-surface-300-700 pb-4">
				<div>
					<h3 class="text-lg font-semibold">Learn Mode</h3>
					<p class="text-sm text-surface-600-400">Progress tracking enabled</p>
				</div>
				<button onclick={switchToFlashcard} class="btn preset-outlined-surface-500 text-sm">
					← Back to Flashcards
				</button>
			</div>

			<!-- Learn Component -->
			<Learn flashcardSet={workingFlashcardSet} filterStarred={false} {mode} {onRestart} {onExit} />
		</div>
	{/if}
{:else}
	<div class="flex h-full items-center justify-center">
		<div class="text-center">
			<p class="mb-4 text-surface-600-400">
				{useStarredOnly ? 'No starred flashcards available' : 'No flashcard data available'}
			</p>
			{#if useStarredOnly}
				<p class="text-sm text-surface-500">
					Try starring some cards or disable the "starred only" filter
				</p>
			{/if}
		</div>
	</div>
{/if}
