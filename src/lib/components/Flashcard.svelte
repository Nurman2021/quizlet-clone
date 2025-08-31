<script>
	import {
		Play,
		Shuffle,
		Settings,
		Star,
		Edit,
		Check,
		X,
		Volume2,
		ArrowRight,
		ArrowLeft,
		Pause,
		Lightbulb,
		Scan
	} from 'lucide-svelte';
	import { Switch } from '@skeletonlabs/skeleton-svelte';
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
		onStarToggle = () => {}
	} = $props();

	let state = $state(false);
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

	// Tambahan untuk flip animation
	let cardContainer = $state();
	let flipTransition = $state(false);

	function toggleAnswer() {
		flipTransition = true;
		setTimeout(() => {
			showAnswer = !showAnswer;
			flipTransition = false;
		}, 150); // Half of transition duration
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
	<div class="flex h-full flex-col">
		<!-- Flip Container -->
		<div class="flip-container perspective-1000 min-h-[400px] w-full">
			<div
				bind:this={cardContainer}
				class="flip-card preserve-3d relative h-full w-full transition-transform duration-300"
				class:flipped={showAnswer}
			>
				<!-- Front Side (Term) -->
				<div class="flip-card-face flip-card-front">
					<div
						class="relative flex min-h-[400px] w-full cursor-pointer items-center justify-center card rounded-xl preset-tonal card-hover transition-all duration-300"
						onclick={toggleAnswer}
						onkeydown={(e) => e.key === 'Enter' && toggleAnswer()}
						role="button"
						tabindex="0"
					>
						<!-- Card Controls (existing) -->
						<div class="absolute top-10 flex w-full items-center justify-between px-10">
							<button class="flex gap-2">
								<Lightbulb class="h-5 w-5" />
								Get a hint
							</button>

							<div class="text-lg font-medium text-surface-600-400">
								{currentIndex + 1} / {flashcardSet.flashcards.length}
							</div>

							<div class="flex items-center space-x-2">
								<button
									class="btn-icon btn-icon-sm"
									onclick={toggleCurrentCardStar}
									class:text-yellow-500={currentCard.is_starred}
									title={currentCard.is_starred ? 'Remove from favorites' : 'Add to favorites'}
								>
									<Star class="h-5 w-5 {currentCard.is_starred ? 'fill-current' : ''}" />
								</button>

								<button class="btn-icon btn-icon-sm" title="Edit (Press E)" onclick={enterEditMode}>
									<Edit class="h-5 w-5" />
								</button>

								<button
									class="btn-icon btn-icon-sm"
									onclick={() => speakText(currentCard.term)}
									title="Listen to pronunciation"
								>
									<Volume2 class="h-5 w-5" />
								</button>
							</div>
						</div>

						<!-- Term Content -->
						<div class="text-center">
							<h2 class="mb-4 text-4xl font-bold">{currentCard.term}</h2>
						</div>
					</div>
				</div>

				<!-- Back Side (Definition) -->
				<div class="flip-card-face flip-card-back">
					<div
						class="relative flex min-h-[400px] w-full cursor-pointer items-center justify-center card rounded-xl preset-tonal card-hover transition-all duration-300"
						onclick={toggleAnswer}
						onkeydown={(e) => e.key === 'Enter' && toggleAnswer()}
						role="button"
						tabindex="0"
					>
						<!-- Card Controls (duplicated for back side) -->
						<div class="absolute top-10 flex w-full items-center justify-between px-10">
							<button class="flex gap-2">
								<Lightbulb class="h-5 w-5" />
								Get a hint
							</button>

							<div class="text-lg font-medium text-surface-600-400">
								{currentIndex + 1} / {flashcardSet.flashcards.length}
							</div>

							<div class="flex items-center space-x-2">
								<button
									class="btn-icon btn-icon-sm"
									onclick={toggleCurrentCardStar}
									class:text-yellow-500={currentCard.is_starred}
									title={currentCard.is_starred ? 'Remove from favorites' : 'Add to favorites'}
								>
									<Star class="h-5 w-5 {currentCard.is_starred ? 'fill-current' : ''}" />
								</button>

								<button class="btn-icon btn-icon-sm" title="Edit (Press E)" onclick={enterEditMode}>
									<Edit class="h-5 w-5" />
								</button>

								<button
									class="btn-icon btn-icon-sm"
									onclick={() => speakText(currentCard.definition)}
									title="Listen to pronunciation"
								>
									<Volume2 class="h-5 w-5" />
								</button>
							</div>
						</div>

						<!-- Definition Content with Reveal Animation -->
						<div class="text-center">
							<h2 class="reveal-text mb-4 text-3xl font-medium" class:animate-reveal={showAnswer}>
								{currentCard.definition}
							</h2>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Navigation Controls (existing - tidak berubah) -->
		<div class="mt-6 flex items-center justify-between">
			<Switch name="example" checked={state} onCheckedChange={(e) => (state = e.checked)} />
			<div>
				<button
					class="btn rounded-full preset-outlined-primary-500 px-8 py-3"
					onclick={previousCard}
					disabled={isFirstCard}
				>
					<ArrowLeft class="h-7 w-7" size={20} />
				</button>

				<button
					class="btn rounded-full preset-outlined-primary-500 px-8 py-3"
					onclick={nextCard}
					disabled={isLastCard}
				>
					<ArrowRight class="h-7 w-7" />
				</button>
			</div>

			<div class="flex items-center space-x-2">
				<button
					class="btn-icon btn-icon-sm preset-tonal-surface"
					onclick={togglePlay}
					title={isPlaying ? 'Pause' : 'Play'}
				>
					{#if isPlaying}
						<Pause class="h-5 w-5" />
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

				<a href="/"><Scan class="h-5 w-5" /></a>
			</div>
		</div>

		<!-- Progress Bar (existing - tidak berubah) -->
		<div class="mt-6">
			<div class="h-1 w-full overflow-hidden rounded-full bg-surface-300-700">
				<div
					class=" h-1 bg-primary-950-50 transition-all duration-300"
					style="width: {progress}%"
				></div>
			</div>
		</div>
	</div>

	<!-- Edit Modal (existing - tidak berubah) -->
	<Modal bind:showModal={showEditModal} title="Edit Flashcard">
		{#snippet children()}
			<div class="space-y-6">
				<div>
					<label for="modal-edit-term" class="mb-3 block text-lg font-medium text-surface-600-400">
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
						class="mb-3 block text-lg font-medium text-surface-600-400"
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
		<p class="text-surface-600-400">No flashcard data available</p>
	</div>
{/if}

<style>
	/* 3D Flip Animation Styles */
	.perspective-1000 {
		perspective: 3000px;
	}

	.preserve-3d {
		transform-style: preserve-3d;
	}

	.flip-card {
		position: relative;
		width: 100%;
		height: 100%;
		transition: transform 0.3s;
		transform-style: preserve-3d;
	}

	.flip-card.flipped {
		transform: rotateY(180deg);
	}

	.flip-card-face {
		position: absolute;
		width: 100%;
		height: 100%;
		-webkit-backface-visibility: hidden;
		backface-visibility: hidden;
		border-radius: 0.75rem; /* rounded-xl */
	}

	.flip-card-back {
		transform: rotateY(180deg);
	}

	/* Text Reveal Animation */
	.reveal-text {
		color: transparent;
		transition: color 0.3s ease-in-out;
	}

	.reveal-text.animate-reveal {
		color: inherit;
	}

	@keyframes revealTextSlowly {
		from {
			color: transparent;
			opacity: 0;
		}
		to {
			color: inherit;
			opacity: 1;
		}
	}

	.animate-reveal {
		animation: revealTextSlowly 0.3s forwards;
	}
</style>
