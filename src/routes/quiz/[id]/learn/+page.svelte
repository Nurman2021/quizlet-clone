<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase.js';
	import { toast } from '$lib/stores/toast.js';
	import { ArrowLeft, Settings, X, ChevronDown } from 'lucide-svelte';

	// Components
	import Learn from '$lib/components/Learn.svelte';

	// Icons for navigation
	import flascardIcon from '$lib/images/flashcard-img.png';
	import learnIcon from '$lib/images/learn-img.png';
	import testIcon from '$lib/images/terst-img.png';
	import matchIcon from '$lib/images/match-img.png';

	let setId = $page.params.id;
	let flashcardSet = $state(null);
	let isLoading = $state(true);
	let showNavigationDropdown = $state(false);

	onMount(async () => {
		await loadFlashcardSet();
	});

	function toggleNavigationDropdown() {
		showNavigationDropdown = !showNavigationDropdown;
	}

	function handleClickOutside(event) {
		if (showNavigationDropdown && !event.target.closest('.navigation-dropdown')) {
			showNavigationDropdown = false;
		}
	}
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

	function exitLearn() {
		goto(`/quiz/${setId}`);
	}

	function restartLearn() {
		// This will be passed to Learn component to handle restart
		window.location.reload();
	}
</script>

<svelte:head>
	<title>Learn - {flashcardSet?.title || 'Loading...'} - Quizcard</title>
</svelte:head>

{#if isLoading}
	<div class="flex h-screen items-center justify-center">
		<div class="text-center">
			<div
				class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"
			></div>
			<p class="text-surface-600-400">Loading learn session...</p>
		</div>
	</div>
{:else if flashcardSet}
	<!-- Fullscreen Learn Container -->
	<div class="flex h-screen flex-col bg-surface-50-950">
		<!-- Learn Header -->
		<header class="flex-shrink-0 border-b border-surface-300-700 preset-tonal-surface px-6 py-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center">
					<div class="navigation-dropdown relative">
						<button
							onclick={toggleNavigationDropdown}
							class="flex items-center preset-tonal-surface text-xs font-semibold"
							title="Switch mode"
						>
							<img src={learnIcon} alt="flashcard" class="mr-2 h-5 w-5 object-contain" />
							Learn
							<ChevronDown class="ml-2 h-4 w-4" />
						</button>

						{#if showNavigationDropdown}
							<div
								class="absolute top-full left-4 z-10 mt-2 w-full rounded-lg border border-surface-300-700 bg-surface-100-900 shadow-lg"
							>
								<div class="grid grid-cols-1 gap-2 p-3">
									<a
										href="/quiz/{setId}/flashcard"
										class="btn flex-col rounded-xl preset-tonal px-4 py-3 text-center no-underline"
									>
										<img
											src={flascardIcon}
											alt="flashcard"
											class="mx-auto h-6 w-6 object-contain"
										/>
										<span class="text-xs font-semibold">Flashcards</span>
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
				</div>

				<div class="flex items-center space-x-2">
					<!-- Restart Button -->
					<button
						onclick={restartLearn}
						class="preset-ghost-surface btn text-sm"
						title="Restart Learn Session"
					>
						Restart
					</button>

					<button class="btn-icon btn-icon-lg preset-tonal-surface" title="Settings">
						<Settings class="h-8 w-8" />
					</button>

					<button
						onclick={exitLearn}
						class="btn-icon btn-icon-lg preset-tonal-surface"
						title="Back to Quiz"
					>
						<X class="h-8 w-8" />
					</button>
				</div>
			</div>
		</header>

		<!-- Main Learn Area -->
		<main class="flex-1 overflow-hidden">
			<Learn {flashcardSet} mode="fullpage" onRestart={restartLearn} onExit={exitLearn} />
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
