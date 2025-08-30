<script>
	import {
		ChevronLeft,
		ChevronRight,
		Play,
		Shuffle,
		Settings,
		Star,
		Edit,
		Check,
		X,
		Volume2
	} from 'lucide-svelte';
	import { toast } from '$lib/stores/toast.js';
	import { supabase } from '$lib/supabase.js';
	import Modal from './Modal.svelte';
	import { ProgressService } from '$lib/services/progressService';

	let {
		flashcardSet,
		currentIndex = $bindable(0),
		onNext,
		onPrevious,
		onShuffle,
		onEdit,
		onStarToggle = () => {} // Callback untuk star toggle
	} = $props();

	let showAnswer = $state(false);
	let showEditModal = $state(false);
	let editTerm = $state('');
	let editDefinition = $state('');
	let isSaving = $state(false);
	let isPlaying = $state(false);

	let currentCard = $derived(flashcardSet?.flashcards[currentIndex]);
	let isFirstCard = $derived(currentIndex === 0);
	let isLastCard = $derived(currentIndex === flashcardSet?.flashcards.length - 1);
	let progress = $derived(
		flashcardSet?.flashcards.length > 0
			? ((currentIndex + 1) / flashcardSet.flashcards.length) * 100
			: 0
	);

	function toggleAnswer() {
		showAnswer = !showAnswer;
	}

	function nextCard() {
		showAnswer = false;
		onNext?.();
	}

	function previousCard() {
		showAnswer = false;
		onPrevious?.();
	}

	function enterEditMode() {
		if (!currentCard) return;
		showEditModal = true;
		editTerm = currentCard.term;
		editDefinition = currentCard.definition;
	}

	function cancelEdit() {
		showEditModal = false;
		editTerm = '';
		editDefinition = '';
	}

	async function saveEdit() {
		if (!currentCard || !editTerm.trim() || !editDefinition.trim()) {
			toast.error('Term and definition cannot be empty');
			return;
		}

		isSaving = true;

		try {
			const { error } = await supabase
				.from('flashcards')
				.update({
					term: editTerm.trim(),
					definition: editDefinition.trim()
				})
				.eq('id', currentCard.id);

			if (error) throw error;

			// Update local data
			currentCard.term = editTerm.trim();
			currentCard.definition = editDefinition.trim();

			showEditModal = false;
			toast.success('Flashcard updated successfully');
			onEdit?.(currentCard);
		} catch (error) {
			console.error('Error updating flashcard:', error);
			toast.error('Failed to update flashcard: ' + error.message);
		} finally {
			isSaving = false;
		}
	}

	async function toggleStar() {
		if (!currentCard) return;

		try {
			const newStarred = !currentCard.is_starred;

			await supabase.from('flashcards').update({ is_starred: newStarred }).eq('id', currentCard.id);

			currentCard.is_starred = newStarred;
			toast.success(newStarred ? 'Added to favorites' : 'Removed from favorites');
		} catch (error) {
			console.error('Error toggling star:', error);
			toast.error('Failed to update favorite');
		}
	}

	function speakText(text) {
		if ('speechSynthesis' in window) {
			const utterance = new SpeechSynthesisUtterance(text);
			utterance.rate = 0.8;
			speechSynthesis.speak(utterance);
		}
	}

	function togglePlay() {
		isPlaying = !isPlaying;
		// TODO: Implement auto-play functionality
	}

	// Keyboard shortcuts
	function handleKeydown(event) {
		if (showEditModal) return;

		switch (event.key) {
			case 'ArrowLeft':
				event.preventDefault();
				previousCard();
				break;
			case 'ArrowRight':
				event.preventDefault();
				nextCard();
				break;
			case ' ':
				event.preventDefault();
				toggleAnswer();
				break;
			case 'e':
				event.preventDefault();
				enterEditMode();
				break;
		}
	}

	async function recordFlashcardInteraction(isCorrect) {
		if (currentCard) {
			await ProgressService.recordAttempt(currentCard.id, flashcardSet.id, 'flashcard', isCorrect);
		}
	}

	// Function untuk toggle star current card
	async function toggleCurrentCardStar() {
		if (currentCard) {
			await onStarToggle(currentCard.id);
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if currentCard}
	<div class="flex h-full flex-col p-6">
		<!-- Controls -->
		<div class="mb-4 flex items-center justify-between">
			<div class="flex items-center space-x-2">
				<button
					class="btn-icon btn-icon-sm preset-tonal-surface"
					onclick={togglePlay}
					title={isPlaying ? 'Pause' : 'Play'}
				>
					{#if isPlaying}
						<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M6 4h4v16H6zm8 0h4v16h-4z" />
						</svg>
					{:else}
						<Play class="h-5 w-5" />
					{/if}
				</button>

				<button
					class="btn-icon btn-icon-sm preset-tonal-surface"
					onclick={onShuffle}
					title="Shuffle cards"
				>
					<Shuffle class="h-5 w-5" />
				</button>

				<button
					class="btn-icon btn-icon-sm preset-tonal-surface"
					onclick={() => speakText(currentCard.term)}
					title="Listen to pronunciation"
				>
					<Volume2 class="h-5 w-5" />
				</button>
			</div>

			<div class="flex items-center space-x-2">
				<button
					class="btn-icon btn-icon-sm preset-tonal-surface"
					onclick={toggleCurrentCardStar}
					class:text-yellow-500={currentCard.is_starred}
					title={currentCard.is_starred ? 'Remove from favorites' : 'Add to favorites'}
				>
					<Star class="h-5 w-5 {currentCard.is_starred ? 'fill-current' : ''}" />
				</button>

				<button
					class="btn-icon btn-icon-sm preset-tonal-surface"
					title="Edit (Press E)"
					onclick={enterEditMode}
				>
					<Edit class="h-5 w-5" />
				</button>

				<div class="text-surface-600-300-token text-lg font-medium">
					{currentIndex + 1} / {flashcardSet.flashcards.length}
				</div>
			</div>
		</div>

		<!-- Progress Bar -->
		<div class="mb-6">
			<div class="bg-surface-300-600-token h-2 w-full overflow-hidden rounded-full">
				<div
					class="h-2 bg-primary-500 transition-all duration-300"
					style="width: {progress}%"
				></div>
			</div>
		</div>

		<!-- Large Flashcard -->
		<div class="flex flex-1 items-center justify-center">
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<div
				class="bg-surface-100-800-token hover:bg-surface-200-700-token flex min-h-[400px] w-full max-w-4xl cursor-pointer items-center justify-center rounded-xl preset-outlined-primary-700-300 p-12 text-center transition-all duration-300"
				onclick={toggleAnswer}
				onkeydown={(e) => e.key === 'Enter' && toggleAnswer()}
				role="button"
				tabindex="0"
			>
				<div class="w-full">
					<!-- View Mode -->
					{#if !showAnswer}
						<h2 class="mb-4 text-4xl font-bold">{currentCard.term}</h2>
						<p class="text-surface-600-300-token">Click to reveal definition</p>
					{:else}
						<h2 class="mb-4 text-3xl font-medium">{currentCard.definition}</h2>
						<p class="text-surface-600-300-token">Click to show term</p>
					{/if}
				</div>
			</div>
		</div>

		<!-- Navigation Controls -->
		<div class="mt-6 flex items-center justify-between">
			<button
				class="btn preset-filled-primary-500 px-8 py-3"
				onclick={previousCard}
				disabled={isFirstCard}
			>
				<ChevronLeft class="mr-2 h-5 w-5" />
				Previous
			</button>

			<button
				class="btn preset-filled-primary-500 px-8 py-3"
				onclick={nextCard}
				disabled={isLastCard}
			>
				Next
				<ChevronRight class="ml-2 h-5 w-5" />
			</button>
		</div>

		<!-- Help Text -->
		<div class="mt-4 text-center">
			<p class="text-surface-600-300-token text-sm">
				Use arrow keys to navigate • Press E to edit • Press space to flip
			</p>
		</div>
	</div>

	<!-- Edit Modal -->
	<Modal bind:showModal={showEditModal} title="Edit Flashcard">
		{#snippet children()}
			<div class="space-y-6">
				<div>
					<label
						for="modal-edit-term"
						class="text-surface-600-300-token mb-3 block text-lg font-medium"
					>
						Term
					</label>
					<input
						id="modal-edit-term"
						type="text"
						bind:value={editTerm}
						class="input w-full text-xl"
						placeholder="Enter term"
						disabled={isSaving}
					/>
				</div>
				<div>
					<label
						for="modal-edit-definition"
						class="text-surface-600-300-token mb-3 block text-lg font-medium"
					>
						Definition
					</label>
					<textarea
						id="modal-edit-definition"
						bind:value={editDefinition}
						class="textarea w-full text-lg"
						placeholder="Enter definition"
						rows="4"
						disabled={isSaving}
					></textarea>
				</div>
			</div>

			<div class="mt-6 flex items-center justify-end space-x-3">
				<button class="btn preset-tonal-surface" onclick={cancelEdit} disabled={isSaving}>
					Cancel
				</button>
				<button class="btn preset-filled-primary-500" onclick={saveEdit} disabled={isSaving}>
					{#if isSaving}
						<div
							class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
						></div>
						Saving...
					{:else}
						Save Changes
					{/if}
				</button>
			</div>
		{/snippet}
	</Modal>
{:else}
	<div class="flex h-full items-center justify-center">
		<p class="text-surface-600-300-token">No flashcard data available</p>
	</div>
{/if}
