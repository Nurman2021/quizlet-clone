<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase.js';
	import { toast } from '$lib/stores/toast.js';
	import { ArrowLeft, Settings, X, ChevronDown } from 'lucide-svelte';

	// Components
	import Flashcard from '$lib/components/Flashcard.svelte';

	// Icons for navigation
	import flascardIcon from '$lib/images/flashcard-img.png';
	import learnIcon from '$lib/images/learn-img.png';
	import testIcon from '$lib/images/terst-img.png';
	import matchIcon from '$lib/images/match-img.png';

	let setId = $page.params.id;
	let flashcardSet = $state(null);
	let isLoading = $state(true);
	let currentCardIndex = $state(0);
	let showNavigationDropdown = $state(false);

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
				.select('id, term, definition, is_starred, created_at, updated_at, set_id')
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

	function toggleNavigationDropdown() {
		showNavigationDropdown = !showNavigationDropdown;
	}

	// Card edit callback - for parent-level updates
	function handleCardEdit(updatedCard) {
		// Component handles the update, this is for additional parent logic
		console.log('Card updated in flashcard page:', updatedCard);
	}

	// Star toggle callback - for parent-level updates
	function handleStarToggle(cardId) {
		// Component handles the update, this is for additional parent logic
		console.log('Star toggled in flashcard page:', cardId);
	}

	let progress = $derived(
		flashcardSet?.flashcards.length > 0
			? ((currentCardIndex + 1) / flashcardSet.flashcards.length) * 100
			: 0
	);

	// Close dropdown when clicking outside
	function handleClickOutside(event) {
		if (showNavigationDropdown && !event.target.closest('.navigation-dropdown')) {
			showNavigationDropdown = false;
		}
	}
</script>

<svelte:head>
	<title>Flashcards - {flashcardSet?.title || 'Loading...'} - Quizcard</title>
</svelte:head>

<svelte:window on:click={handleClickOutside} />

{#if isLoading}
	<div class="flex h-screen items-center justify-center">
		<div class="text-center">
			<div
				class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"
			></div>
			<p class="text-surface-600-400">Loading flashcards...</p>
		</div>
	</div>
{:else if flashcardSet}
	<div class=" flex h-screen flex-col bg-surface-50-950">
		<!-- Flashcard Header -->
		<header class="mt-4 flex-shrink-0">
			<div class="mx-6 mb-4 flex items-center justify-between">
				<!-- Navigation Dropdown -->
				<div class="navigation-dropdown relative">
					<button
						onclick={toggleNavigationDropdown}
						class="flex items-center preset-tonal-surface"
						title="Switch mode"
					>
						<img src={flascardIcon} alt="flashcard" class="mr-2 h-5 w-5 object-contain" />
						Flashcards
						<ChevronDown class="ml-2 h-4 w-4" />
					</button>

					{#if showNavigationDropdown}
						<div
							class="absolute top-full left-4 z-10 mt-2 rounded-lg border border-surface-300-700 bg-surface-100-900 shadow-lg"
						>
							<div class="grid grid-cols-1 gap-2 p-3">
								<a
									href="/quiz/{setId}/learn"
									class="btn flex-col rounded-xl preset-tonal px-4 py-3 text-center no-underline"
								>
									<img src={learnIcon} alt="learn" class="mx-auto h-6 w-6 object-contain" />
									<span class="text-xs font-semibold">Learn</span>
								</a>

								<a
									href="/quiz/{setId}/test"
									class="btn flex-col rounded-xl preset-tonal px-4 py-3 text-center no-underline"
								>
									<img src={testIcon} alt="test" class="mx-auto h-6 w-6 object-contain" />
									<span class="text-xs font-semibold">Test</span>
								</a>

								<a
									href="/quiz/{setId}/match"
									class="btn flex-col rounded-xl preset-tonal px-4 py-3 text-center no-underline"
								>
									<img src={matchIcon} alt="matchmaking" class="mx-auto h-6 w-6 object-contain" />
									<span class="text-xs font-semibold">Match</span>
								</a>
								<a
									href="/"
									class="btn flex-col rounded-xl preset-tonal px-4 py-3 text-center no-underline"
								>
									<span class="text-xs font-semibold">Home</span>
								</a>
							</div>
						</div>
					{/if}
				</div>

				<div class="text-center text-xl font-semibold">
					<h1>
						{currentCardIndex + 1} / {flashcardSet.flashcards.length}
					</h1>
					<h2>{flashcardSet.title}</h2>
				</div>

				<div class="flex items-center justify-center space-x-2">
					<button class="btn-icon btn-icon-lg preset-tonal-surface" title="Settings">
						<Settings class="h-8 w-8" />
					</button>

					<button
						onclick={exitFlashcard}
						class="btn-icon btn-icon-lg preset-tonal-surface"
						title="Back to Quiz"
					>
						<X class="h-8 w-8" />
					</button>
				</div>
			</div>

			<!-- Progress Bar -->
			<div class="h-1 w-full overflow-hidden rounded-full bg-surface-300-700">
				<div
					class="h-1 bg-primary-950-50 transition-all duration-300"
					style="width: {progress}%"
				></div>
			</div>
		</header>

		<!-- Main Flashcard Area -->
		<main class="flex-1 overflow-hidden">
			<Flashcard
				bind:flashcardSet
				bind:currentIndex={currentCardIndex}
				onCardEdit={handleCardEdit}
				onStarToggle={handleStarToggle}
				mode="fullpage"
			/>
		</main>
	</div>
{:else}
	<div class="flex h-screen items-center justify-center">
		<div class="text-center">
			<h2 class="text-xl font-bold">Flashcard set not found</h2>
			<p class="mt-2 text-surface-600-400">The requested flashcard set could not be loaded.</p>
			<button onclick={() => goto(`/quiz/${setId}`)} class="mt-4 btn preset-filled-primary-500">
				Back to Quiz
			</button>
		</div>
	</div>
{/if}
