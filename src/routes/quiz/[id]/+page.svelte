<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import {
		flashcardActions,
		currentFlashcardSet,
		quizState,
		quizActions
	} from '$lib/stores/flashcards.js';
	import { supabase } from '$lib/supabase.js';
	import {
		ChevronLeft,
		ChevronRight,
		RotateCcw,
		Home,
		Play,
		Shuffle,
		Settings,
		Star,
		Edit,
		Check,
		X
	} from 'lucide-svelte';
	import { Tabs } from '@skeletonlabs/skeleton-svelte';

	let setId;
	let showAnswer = false;
	let isLoading = true;
	let tabSet = 'flashcard'; // 'flashcard' atau 'test'
	let isPlaying = false;
	let progress = 0;

	// Test mode variables
	let testAnswers = {};
	let showTestResults = false;
	let testScore = 0;

	onMount(async () => {
		setId = $page.params.id;

		try {
			// Get current user
			const {
				data: { user }
			} = await supabase.auth.getUser();

			if (!user) {
				goto('/login');
				return;
			}

			// Load flashcard set
			const set = await flashcardActions.loadSetWithCards(setId);

			if (set) {
				// Start quiz
				await quizActions.startQuiz(setId, user.id, 'flashcard');
				isLoading = false;
			} else {
				goto('/');
			}
		} catch (error) {
			console.error('Error loading quiz:', error);
			goto('/');
		}
	});

	function toggleAnswer() {
		showAnswer = !showAnswer;
	}

	function nextCard() {
		console.log('Next card clicked, current index:', $quizState.currentCardIndex);
		if (
			$currentFlashcardSet &&
			$quizState.currentCardIndex < $currentFlashcardSet.flashcards.length - 1
		) {
			quizActions.nextCard();
			showAnswer = false;
			updateProgress();
			console.log('Moved to next card, new index:', $quizState.currentCardIndex);
		}
	}

	function previousCard() {
		console.log('Previous card clicked, current index:', $quizState.currentCardIndex);
		if ($quizState.currentCardIndex > 0) {
			quizActions.previousCard();
			showAnswer = false;
			updateProgress();
			console.log('Moved to previous card, new index:', $quizState.currentCardIndex);
		}
	}

	function resetQuiz() {
		quizActions.resetQuiz();
		showAnswer = false;
		progress = 0;
		updateProgress();
	}

	function updateProgress() {
		if ($currentFlashcardSet) {
			progress = (($quizState.currentCardIndex + 1) / $currentFlashcardSet.flashcards.length) * 100;
		}
	}

	// Update progress saat currentCardIndex berubah
	$: if ($quizState.currentCardIndex !== undefined && $currentFlashcardSet) {
		updateProgress();
	}

	function startTest() {
		tabSet = 'test';
		testAnswers = {};
		showTestResults = false;
		testScore = 0;
	}

	function submitTest() {
		// Calculate score
		let correct = 0;
		$currentFlashcardSet.flashcards.forEach((card) => {
			if (testAnswers[card.id]?.toLowerCase().trim() === card.definition.toLowerCase().trim()) {
				correct++;
			}
		});
		testScore = (correct / $currentFlashcardSet.flashcards.length) * 100;
		showTestResults = true;
	}

	function togglePlay() {
		isPlaying = !isPlaying;
		// Auto-play logic here
	}

	$: currentCard = $currentFlashcardSet?.flashcards[$quizState.currentCardIndex];
	$: isLastCard =
		$currentFlashcardSet &&
		$quizState.currentCardIndex === $currentFlashcardSet.flashcards.length - 1;
	$: isFirstCard = $quizState.currentCardIndex === 0;
</script>

<svelte:head>
	<title>Quiz - {$currentFlashcardSet?.title || 'Loading...'}</title>
</svelte:head>

{#if isLoading}
	<div class="flex min-h-[60vh] items-center justify-center">
		<div class="text-center">
			<div class="mx-auto mb-4 h-12 placeholder w-12 animate-pulse"></div>
			<p class="text-surface-600-300-token">Loading quiz...</p>
		</div>
	</div>
{:else if $currentFlashcardSet && currentCard}
	<div class="bg-surface-50-900-token min-h-screen p-6">
		<div class="mx-auto max-w-6xl">
			<!-- Header with Title -->
			<div class="mb-6">
				<h1 class="mb-2 text-3xl font-bold">{$currentFlashcardSet.title}</h1>
				{#if $currentFlashcardSet.description}
					<p class="text-surface-600-300-token">{$currentFlashcardSet.description}</p>
				{/if}
			</div>

			<!-- Main Content Area -->
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<!-- Left Column - Flashcard/Test Area -->
				<div class="lg:col-span-2">
					<!-- Tab Navigation -->
					<Tabs value={tabSet} onValueChange={(e) => (tabSet = e.value)}>
						{#snippet list()}
							<Tabs.Control value="flashcard">Flashcard</Tabs.Control>
							<Tabs.Control value="test">Test</Tabs.Control>
						{/snippet}
						{#snippet content()}
							<Tabs.Panel value="flashcard">
								<!-- Flashcard Mode -->
								<div class="variant-ghost-surface card p-6">
									<!-- Controls -->
									<div class="mb-4 flex items-center justify-between">
										<div class="flex items-center space-x-2">
											<button
												class="variant-ghost-surface btn-icon btn-icon-sm"
												on:click={togglePlay}
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
											<button class="variant-ghost-surface btn-icon btn-icon-sm" title="Shuffle">
												<Shuffle class="h-5 w-5" />
											</button>
											<button class="variant-ghost-surface btn-icon btn-icon-sm" title="Settings">
												<Settings class="h-5 w-5" />
											</button>
										</div>
										<div class="flex items-center space-x-4">
											<button class="variant-ghost-surface btn-icon btn-icon-sm" title="Star">
												<Star class="h-5 w-5" />
											</button>
											<button class="variant-ghost-surface btn-icon btn-icon-sm" title="Edit">
												<Edit class="h-5 w-5" />
											</button>
											<div class="text-surface-600-300-token text-sm">
												{$quizState.currentCardIndex + 1} / {$currentFlashcardSet.flashcards.length}
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
										<p class="text-surface-600-300-token mt-1 text-center text-xs">
											Track progress: ON
										</p>
									</div>

									<!-- Flashcard -->
									<div
										class="bg-surface-100-800-token hover:bg-surface-200-700-token flex min-h-[300px] cursor-pointer items-center justify-center rounded-lg p-8 text-center transition-all duration-300"
										on:click={toggleAnswer}
										on:keydown={(e) => e.key === 'Enter' && toggleAnswer()}
										role="button"
										tabindex="0"
									>
										<div>
											{#if !showAnswer}
												<h2 class="text-2xl font-semibold">{currentCard.term}</h2>
											{:else}
												<h2 class="text-xl">{currentCard.definition}</h2>
											{/if}
										</div>
									</div>

									<!-- Navigation -->
									<div class="mt-6 flex items-center justify-between">
										<button
											class="variant-ghost-surface btn"
											on:click={previousCard}
											disabled={isFirstCard}
										>
											<ChevronLeft class="h-5 w-5" />
										</button>

										<button
											class="variant-filled-primary btn"
											on:click={nextCard}
											disabled={isLastCard}
										>
											<ChevronRight class="h-5 w-5" />
										</button>
									</div>
								</div>
							</Tabs.Panel>

							<Tabs.Panel value="test">
								<!-- Test Mode -->
								<div class="variant-ghost-surface card p-6">
									<h3 class="mb-4 text-xl font-semibold">Test Mode</h3>

									{#if !showTestResults}
										<div class="max-h-[600px] space-y-4 overflow-y-auto">
											{#each $currentFlashcardSet.flashcards as card, index}
												<div class="variant-ghost-surface card p-4">
													<p class="mb-2 font-medium">{index + 1}. {card.term}</p>
													<input
														type="text"
														class="input"
														placeholder="Type your answer..."
														bind:value={testAnswers[card.id]}
													/>
												</div>
											{/each}
										</div>
										<button class="variant-filled-primary mt-6 btn w-full" on:click={submitTest}>
											Submit Test
										</button>
									{:else}
										<!-- Test Results -->
										<div class="text-center">
											<h3 class="mb-4 text-2xl font-bold">Test Results</h3>
											<div
												class="mb-4 text-4xl font-bold {testScore >= 70
													? 'text-success-500'
													: 'text-error-500'}"
											>
												{testScore.toFixed(0)}%
											</div>
											<button class="variant-filled-primary btn" on:click={startTest}>
												Retake Test
											</button>
										</div>
									{/if}
								</div>
							</Tabs.Panel>
						{/snippet}
					</Tabs>
				</div>

				<!-- Right Column - Terms List -->
				<div class="lg:col-span-1">
					<div class="variant-ghost-surface card p-4">
						<div class="mb-4 flex items-center justify-between">
							<h3 class="font-semibold">
								Terms in this set ({$currentFlashcardSet.flashcards.length})
							</h3>
							<select class="select-sm select w-auto">
								<option value="original">Original</option>
								<option value="alphabetical">Alphabetical</option>
								<option value="starred">Starred first</option>
							</select>
						</div>

						<div class="max-h-[600px] space-y-3 overflow-y-auto">
							{#each $currentFlashcardSet.flashcards as card, index}
								<div
									class="variant-ghost-surface hover:variant-soft-surface cursor-pointer card p-4 transition-all"
									class:ring-2={$quizState.currentCardIndex === index}
									class:ring-primary-500={$quizState.currentCardIndex === index}
									role="button"
									tabindex="0"
									on:click={() => {
										$quizState.currentCardIndex = index;
										showAnswer = false;
										updateProgress();
									}}
									on:keydown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											$quizState.currentCardIndex = index;
											showAnswer = false;
											updateProgress();
										}
									}}
								>
									<div class="flex items-start space-x-3">
										<button
											class="variant-ghost-surface btn-icon btn-icon-sm flex-shrink-0"
											on:click|stopPropagation={() => {}}
										>
											<Star class="h-4 w-4" />
										</button>
										<div class="min-w-0 flex-1">
											<p class="mb-1 truncate text-sm font-medium">{card.term}</p>
											<p class="text-surface-600-300-token truncate text-sm">{card.definition}</p>
										</div>
										<button
											class="variant-ghost-surface btn-icon btn-icon-sm flex-shrink-0"
											on:click|stopPropagation={() => {}}
										>
											<Edit class="h-4 w-4" />
										</button>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<h2 class="text-xl font-bold">Loading...</h2>
			<p class="text-surface-600-300-token mt-2">Memuat flashcard set...</p>
		</div>
	</div>
{/if}
