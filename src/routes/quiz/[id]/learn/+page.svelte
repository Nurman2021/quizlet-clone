<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase.js';
	import { toast } from '$lib/stores/toast.js';
	import { ArrowLeft, Settings } from 'lucide-svelte';

	// Components
	import Learn from '$lib/components/Learn.svelte';

	let setId = $page.params.id;
	let flashcardSet = $state(null);
	let isLoading = $state(true);
	let learnProgress = $state(null);

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

	function exitLearn() {
		goto(`/quiz/${setId}`);
	}

	function handleLearningProgress(event) {
		learnProgress = event.detail;
	}

	function restartLearn() {
		// Reset learn component
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
			<p class="text-surface-600-300-token">Loading learn session...</p>
		</div>
	</div>
{:else if flashcardSet}
	<!-- Fullscreen Learn Container -->
	<div class="bg-surface-50-900-token flex h-screen flex-col">
		<!-- Learn Header -->
		<header
			class="bg-surface-100-800-token border-surface-300-600-token flex-shrink-0 border-b px-6 py-4"
		>
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-4">
					<!-- Back Button -->
					<button
						onclick={exitLearn}
						class="btn-icon btn-icon-sm preset-tonal-surface"
						title="Back to Quiz"
					>
						<ArrowLeft class="h-5 w-5" />
					</button>

					<div>
						<h1 class="text-xl font-semibold">{flashcardSet.title}</h1>
						<p class="text-surface-600-300-token text-sm">
							Learn Mode • {flashcardSet.flashcards.length} terms
						</p>
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

					<!-- Settings -->
					<button class="btn-icon btn-icon-sm preset-tonal-surface" title="Settings">
						<Settings class="h-5 w-5" />
					</button>
				</div>
			</div>

			<!-- Progress Display -->
			{#if learnProgress}
				<div class="mt-4">
					<div class="flex items-center justify-between text-sm">
						<span class="font-medium">Progress</span>
						<span class="text-surface-600-300-token">
							{learnProgress.correct} / {learnProgress.total} completed
						</span>
					</div>

					<div class="bg-surface-300-600-token mt-2 h-2 w-full overflow-hidden rounded-full">
						<div
							class="h-2 bg-primary-500 transition-all duration-300"
							style="width: {(learnProgress.correct / learnProgress.total) * 100}%"
						></div>
					</div>

					<div class="text-surface-600-300-token mt-2 flex items-center justify-between text-xs">
						<span
							>Accuracy: {Math.round(
								(learnProgress.correct / (learnProgress.correct + learnProgress.incorrect)) * 100
							) || 0}%</span
						>
						<span>Remaining: {learnProgress.total - learnProgress.correct}</span>
					</div>
				</div>
			{/if}
		</header>

		<!-- Main Learn Area -->
		<main class="flex-1 overflow-hidden">
			<Learn {flashcardSet} onLearningProgress={handleLearningProgress} />
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
