<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase.js';
	import { toast } from '$lib/stores/toast.js';
	import { ArrowLeft, Settings } from 'lucide-svelte';

	// Components
	import Flashcard from '$lib/components/Flashcard.svelte';

	let setId = $page.params.id;
	let flashcardSet = $state(null);
	let isLoading = $state(true);
	let currentCardIndex = $state(0);

	onMount(async () => {
		await loadFlashcardSet();
	});

	async function loadFlashcardSet() {
		try {
			isLoading = true;

			const { data: set, error: setError } = await supabase
				.from('flashcard_sets')
				.select('*')
				.eq('id', setId)
				.single();

			if (setError) throw setError;

			const { data: cards, error: cardsError } = await supabase
				.from('flashcards')
				.select('*')
				.eq('set_id', setId)
				.order('created_at');

			if (cardsError) throw cardsError;

			flashcardSet = { ...set, flashcards: cards };
		} catch (error) {
			console.error('Error loading flashcard set:', error);
			toast.error('Failed to load flashcard set', error.message);
			goto(`/quiz/${setId}`);
		} finally {
			isLoading = false;
		}
	}

	function exitFlashcard() {
		goto(`/quiz/${setId}`);
	}

	// Flashcard navigation
	function nextCard() {
		if (currentCardIndex < flashcardSet.flashcards.length - 1) {
			currentCardIndex++;
		}
	}

	function previousCard() {
		if (currentCardIndex > 0) {
			currentCardIndex--;
		}
	}

	function shuffleCards() {
		const shuffled = [...flashcardSet.flashcards].sort(() => Math.random() - 0.5);
		flashcardSet = { ...flashcardSet, flashcards: shuffled };
		currentCardIndex = 0;
		toast.success('Cards shuffled');
	}

	function handleCardEdit(updatedCard) {
		// Update the card in the flashcard set
		flashcardSet.flashcards = flashcardSet.flashcards.map((card) =>
			card.id === updatedCard.id ? updatedCard : card
		);
	}

	let progress = $derived(
		flashcardSet?.flashcards.length > 0
			? ((currentCardIndex + 1) / flashcardSet.flashcards.length) * 100
			: 0
	);
</script>

<svelte:head>
	<title>Flashcards - {flashcardSet?.title || 'Loading...'} - Quizcard</title>
</svelte:head>

{#if isLoading}
	<div class="flex h-screen items-center justify-center">
		<div class="text-center">
			<div
				class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"
			></div>
			<p class="text-surface-600-300-token">Loading flashcards...</p>
		</div>
	</div>
{:else if flashcardSet}
	<!-- Fullscreen Flashcard Container -->
	<div class="bg-surface-50-900-token flex h-screen flex-col">
		<!-- Flashcard Header -->
		<header
			class="bg-surface-100-800-token border-surface-300-600-token flex-shrink-0 border-b px-6 py-4"
		>
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-4">
					<!-- Back Button -->
					<button
						onclick={exitFlashcard}
						class="btn-icon btn-icon-sm preset-tonal-surface"
						title="Back to Quiz"
					>
						<ArrowLeft class="h-5 w-5" />
					</button>

					<div>
						<h1 class="text-xl font-semibold">{flashcardSet.title}</h1>
						<p class="text-surface-600-300-token text-sm">
							Flashcard Mode • {currentCardIndex + 1} of {flashcardSet.flashcards.length} cards
						</p>
					</div>
				</div>

				<div class="flex items-center space-x-2">
					<!-- Settings -->
					<button class="btn-icon btn-icon-sm preset-tonal-surface" title="Settings">
						<Settings class="h-5 w-5" />
					</button>
				</div>
			</div>

			<!-- Progress Bar -->
			<div class="mt-4">
				<div class="bg-surface-300-600-token h-2 w-full overflow-hidden rounded-full">
					<div
						class="h-2 bg-primary-500 transition-all duration-300"
						style="width: {progress}%"
					></div>
				</div>
				<div class="text-surface-600-300-token mt-2 flex items-center justify-between text-xs">
					<span>Progress: {Math.round(progress)}%</span>
					<span>Card {currentCardIndex + 1} of {flashcardSet.flashcards.length}</span>
				</div>
			</div>
		</header>

		<!-- Main Flashcard Area -->
		<main class="flex-1 overflow-hidden">
			<Flashcard
				{flashcardSet}
				bind:currentIndex={currentCardIndex}
				onNext={nextCard}
				onPrevious={previousCard}
				onShuffle={shuffleCards}
				onEdit={handleCardEdit}
			/>
		</main>
	</div>
{:else}
	<div class="flex h-screen items-center justify-center">
		<div class="text-center">
			<h2 class="text-xl font-bold">Flashcard set not found</h2>
			<p class="text-surface-600-300-token mt-2">
				The requested flashcard set could not be loaded.
			</p>
			<button onclick={() => goto(`/quiz/${setId}`)} class="mt-4 btn preset-filled-primary-500">
				Back to Quiz
			</button>
		</div>
	</div>
{/if}
