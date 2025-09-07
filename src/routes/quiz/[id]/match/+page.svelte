<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase.js';
	import { toast } from '$lib/stores/toast.js';
	import {
		ArrowLeft,
		Users,
		RotateCcw,
		Trophy,
		ChevronDown,
		Settings,
		X,
		Check
	} from 'lucide-svelte';
	import { ProgressService } from '$lib/services/progressService.js';
	import SettingsModal from '$lib/components/Settings.svelte';

	// Icons for navigation
	import flascardIcon from '$lib/images/flashcard-img.png';
	import learnIcon from '$lib/images/learn-img.png';
	import testIcon from '$lib/images/terst-img.png';
	import matchIcon from '$lib/images/match-img.png';

	let setId = $page.params.id;
	let flashcardSet = $state(null);
	let isLoading = $state(true);
	let gameCards = $state([]);
	let selectedCards = $state([]);
	let matchedPairs = $state([]);
	let gameComplete = $state(false);
	let gameStarted = $state(false);
	let gameTimer = $state(0);
	let timerInterval = $state(null);
	let attempts = $state(0);
	let showNavigationDropdown = $state(false);
	let showSettings = $state(false);
	let matchSettings = $state({
		useStarredOnly: false,
		orderMode: 'original'
	});

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
			prepareGame();
		} catch (error) {
			console.error('Error loading flashcard set:', error);
			toast.error('Failed to load flashcard set', error.message);
			goto(`/quiz/${setId}`);
		} finally {
			isLoading = false;
		}
	}

	function toggleNavigationDropdown() {
		showNavigationDropdown = !showNavigationDropdown;
	}

	function handleClickOutside(event) {
		if (showNavigationDropdown && !event.target.closest('.navigation-dropdown')) {
			showNavigationDropdown = false;
		}
	}

	function prepareGame() {
		if (!flashcardSet?.flashcards) return;

		// Filter cards based on settings
		let availableCards = flashcardSet.flashcards;
		if (matchSettings.useStarredOnly) {
			availableCards = availableCards.filter((card) => card.is_starred);
			if (availableCards.length === 0) {
				toast.error('No starred cards available for match game');
				return;
			}
		}

		const maxCards = Math.min(8, availableCards.length);
		const selectedFlashcards = availableCards.sort(() => Math.random() - 0.5).slice(0, maxCards);

		// Create pairs of cards (term and definition)
		let cards = [];
		selectedFlashcards.forEach((flashcard) => {
			// Term card
			cards.push({
				id: `term-${flashcard.id}`,
				flashcardId: flashcard.id,
				content: flashcard.term,
				type: 'term',
				matched: false,
				selected: false
			});

			// Definition card
			cards.push({
				id: `def-${flashcard.id}`,
				flashcardId: flashcard.id,
				content: flashcard.definition,
				type: 'definition',
				matched: false,
				selected: false
			});
		});

		// Shuffle all cards
		gameCards = cards.sort(() => Math.random() - 0.5);
		selectedCards = [];
		matchedPairs = [];
		gameComplete = false;
		gameStarted = false;
		gameTimer = 0;
		attempts = 0;
	}

	function startGame() {
		gameStarted = true;
		startTimer();
		toast.info('Game started! Match the terms with their definitions');
	}

	function initializeGame() {
		if (!flashcardSet?.flashcards) return;

		const selectedFlashcards = flashcardSet.flashcards.sort(() => Math.random() - 0.5).slice(0, 8);

		// Create pairs of cards (term and definition)
		let cards = [];
		selectedFlashcards.forEach((flashcard) => {
			// Term card
			cards.push({
				id: `term-${flashcard.id}`,
				flashcardId: flashcard.id,
				content: flashcard.term,
				type: 'term',
				matched: false,
				selected: false
			});

			// Definition card
			cards.push({
				id: `def-${flashcard.id}`,
				flashcardId: flashcard.id,
				content: flashcard.definition,
				type: 'definition',
				matched: false,
				selected: false
			});
		});

		// Shuffle all cards
		gameCards = cards.sort(() => Math.random() - 0.5);
		selectedCards = [];
		matchedPairs = [];
		gameComplete = false;
		gameTimer = 0;
		attempts = 0;
		startTimer();
	}

	function startTimer() {
		if (timerInterval) clearInterval(timerInterval);
		timerInterval = setInterval(() => {
			gameTimer++;
		}, 1000);
	}

	function stopTimer() {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
	}

	function selectCard(card) {
		if (!gameStarted || card.matched) return;

		// If card is already selected, deselect it
		if (card.selected) {
			card.selected = false;
			selectedCards = selectedCards.filter((c) => c.id !== card.id);
			return;
		}

		if (selectedCards.length >= 2) return;

		// Select the card
		card.selected = true;
		selectedCards = [...selectedCards, card];

		// Check for match when 2 cards are selected
		if (selectedCards.length === 2) {
			attempts++;
			setTimeout(checkMatch, 500);
		}
	}

	function checkMatch() {
		const [first, second] = selectedCards;

		if (first.flashcardId === second.flashcardId && first.type !== second.type) {
			// It's a match!
			first.matched = true;
			second.matched = true;
			first.selected = false;
			second.selected = false;
			matchedPairs = [...matchedPairs, first.flashcardId];

			// Record progress for successful match
			ProgressService.recordAttempt(
				first.flashcardId,
				flashcardSet.id,
				'match',
				true,
				null, // responseTime
				`${first.content} - ${second.content}` // answerText
			);

			toast.success('Match found!');

			// Check if game is complete
			if (matchedPairs.length === Math.min(8, flashcardSet.flashcards.length)) {
				gameComplete = true;
				stopTimer();
				toast.success(`Game completed in ${formatTime(gameTimer)} with ${attempts} attempts!`);
			}
		} else {
			// Not a match, deselect cards
			first.selected = false;
			second.selected = false;

			// Record progress for failed match attempts if different flashcards
			if (first.flashcardId !== second.flashcardId) {
				ProgressService.recordAttempt(
					first.flashcardId,
					flashcardSet.id,
					'match',
					false,
					null, // responseTime
					`${first.content} - ${second.content}` // answerText
				);
				ProgressService.recordAttempt(
					second.flashcardId,
					flashcardSet.id,
					'match',
					false,
					null, // responseTime
					`${first.content} - ${second.content}` // answerText
				);
			}

			toast.error('Not a match, try again!');
		}

		selectedCards = [];
	}

	function formatTime(seconds) {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function resetGame() {
		stopTimer();
		prepareGame();
		toast.info('Game reset');
	}

	function exitMatch() {
		stopTimer();
		goto(`/quiz/${setId}`);
	}

	function showSettingsModal() {
		showSettings = true;
	}

	function applySettings(event) {
		matchSettings = event.detail;
		showSettings = false;
		console.log('Match settings applied:', matchSettings);

		// If the game hasn't started yet and settings affect card selection, restart game preparation
		if (!gameStarted) {
			prepareGame();
		}
	}

	$effect(() => {
		return () => {
			stopTimer();
		};
	});
</script>

<svelte:head>
	<title>Match - {flashcardSet?.title || 'Loading...'} - Quizcard</title>
</svelte:head>

{#if isLoading}
	<div class="flex h-screen flex-col bg-surface-50-950">
		<!-- Skeleton Header -->
		<header class="flex-shrink-0 border-b border-surface-300-700 bg-surface-100-900 px-6 py-4">
			<div class="flex items-center justify-between">
				<!-- Skeleton Navigation -->
				<div class="flex items-center space-x-4">
					<div class="h-8 w-20 animate-pulse rounded bg-surface-300-700"></div>
				</div>

				<!-- Skeleton Title & Timer -->
				<div class="text-center">
					<div class="mb-2 h-6 w-40 animate-pulse rounded bg-surface-300-700"></div>
					<div class="h-8 w-24 animate-pulse rounded bg-surface-300-700"></div>
				</div>

				<!-- Skeleton Actions -->
				<div class="flex items-center space-x-2">
					<div class="h-10 w-20 animate-pulse rounded bg-surface-300-700"></div>
					<div class="h-10 w-10 animate-pulse rounded bg-surface-300-700"></div>
				</div>
			</div>
		</header>

		<!-- Skeleton Match Game Grid -->
		<main class="flex-1 overflow-hidden p-6">
			<div class="mx-auto max-w-4xl">
				<!-- Skeleton Game Grid - 4x4 -->
				<div class="grid grid-cols-4 gap-3 sm:gap-4">
					{#each Array(16) as _}
						<div class="aspect-square animate-pulse rounded-lg bg-surface-200-800"></div>
					{/each}
				</div>

				<!-- Skeleton Game Stats -->
				<div class="mt-8 flex justify-center space-x-8">
					<div class="text-center">
						<div class="mb-2 h-8 w-16 animate-pulse rounded bg-surface-300-700"></div>
						<div class="h-4 w-12 animate-pulse rounded bg-surface-300-700"></div>
					</div>
					<div class="text-center">
						<div class="mb-2 h-8 w-16 animate-pulse rounded bg-surface-300-700"></div>
						<div class="h-4 w-16 animate-pulse rounded bg-surface-300-700"></div>
					</div>
				</div>
			</div>
		</main>
	</div>
{:else if flashcardSet}
	<div class="flex h-screen flex-col bg-surface-50-950">
		<header class="flex-shrink-0 border-b border-surface-300-700 preset-tonal-surface px-6 py-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-4">
					<div class="navigation-dropdown relative">
						<button
							onclick={toggleNavigationDropdown}
							class="flex items-center preset-tonal-surface"
							title="Switch mode"
						>
							<img src={matchIcon} alt="flashcard" class="mr-2 h-5 w-5 object-contain" />
							Match
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
				{#if gameStarted}
					<div class="flex items-center space-x-4">
						<div class="text-center">
							<div class="text-sm text-surface-600-400">Time</div>
							<div class="font-mono text-lg font-semibold">{formatTime(gameTimer)}</div>
						</div>

						<div class="text-center">
							<div class="text-sm text-surface-600-400">Attempts</div>
							<div class="font-mono text-lg font-semibold">{attempts}</div>
						</div>

						<div class="text-center">
							<div class="text-sm text-surface-600-400">Matches</div>
							<div class="font-mono text-lg font-semibold">
								{matchedPairs.length}/{gameCards.length / 2}
							</div>
						</div>
					</div>
				{:else}
					<div>
						<h1 class="text-xl font-semibold">{flashcardSet.title}</h1>
					</div>
				{/if}
				<div class="flex items-center justify-center space-x-2">
					<button
						onclick={showSettingsModal}
						class="btn-icon btn-icon-lg preset-tonal-surface"
						title="Settings"
					>
						<Settings class="h-8 w-8" />
					</button>

					<button
						onclick={exitMatch}
						class="btn-icon btn-icon-lg preset-tonal-surface"
						title="Back to Quiz"
					>
						<X class="h-8 w-8" />
					</button>
				</div>
			</div>
		</header>

		<!-- Main Match Area -->
		<main class="flex-1 overflow-auto p-6">
			{#if gameComplete}
				<!-- Game Complete Screen -->
				<div class="flex h-full items-center justify-center">
					<div class="text-center">
						<Trophy class="mx-auto mb-6 h-16 w-16 text-yellow-500" />
						<h2 class="mb-4 text-3xl font-semibold">Congratulations!</h2>
						<p class="mb-6 text-lg text-surface-600-400">
							You completed the match game in <span class="font-semibold"
								>{formatTime(gameTimer)}</span
							>
							<br />
							with <span class="font-semibold">{attempts}</span> attempts!
						</p>
						<div class="flex justify-center space-x-4">
							<button onclick={resetGame} class="btn preset-tonal-surface">
								<RotateCcw class="mr-2 h-5 w-5" />
								Play Again
							</button>
							<button onclick={exitMatch} class="btn preset-filled-primary-500">
								Back to Quiz
							</button>
						</div>
					</div>
				</div>
			{:else if !gameStarted}
				<div class="flex h-full items-center justify-center">
					<div class="mx-auto max-w-2xl text-center">
						<img src={matchIcon} alt="flashcard" class="mx-auto mb-4 h-32 w-32 object-contain" />
						<h2 class="mb-4 text-3xl font-semibold">Ready to play?</h2>
						<p class="mb-6 text-lg text-surface-600-400">
							Match {gameCards.length / 2} terms with their definitions in a grid. Click on cards to
							select them and find matching pairs.
						</p>

						<button onclick={startGame} class="btn preset-filled-primary-500 px-8 py-3 text-lg">
							Start Game
						</button>
					</div>
				</div>
			{:else}
				<!-- Game Grid paling pas max-w-7xl jangan diubah  -->
				<div class="flex h-full items-center justify-center p-4">
					<div class="mx-auto w-full max-w-7xl">
						<div
							class="mx-auto grid max-h-[calc(100vh-180px)] grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8"
						>
							{#each gameCards as card (card.id)}
								<button
									class="relative flex aspect-square min-h-0 items-center justify-center overflow-hidden rounded-lg border-2 p-3 text-center transition-all duration-200 sm:p-4 md:p-5
									{card.matched
										? 'cursor-default border-green-500 bg-green-100 dark:bg-green-900'
										: card.selected
											? 'border-blue-500 bg-blue-100 dark:bg-blue-900'
											: 'border-surface-300-700 bg-surface-100-900 hover:border-surface-400-600 hover:bg-surface-200-800'} {card.matched
										? ''
										: 'cursor-pointer active:scale-95'}"
									onclick={() => selectCard(card)}
									disabled={card.matched || !gameStarted}
								>
									<!-- Card Content - Always Visible -->
									<div
										class="text-center text-sm leading-tight font-medium break-words sm:text-base md:text-lg"
									>
										{card.content}
									</div>

									<!-- Matched indicator -->
									{#if card.matched}
										<div class="absolute top-2 right-2 sm:top-3 sm:right-3">
											<div
												class="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 sm:h-6 sm:w-6"
											>
												<Check class="h-3 w-3 text-white sm:h-4 sm:w-4" />
											</div>
										</div>
									{/if}

									<!-- Selected indicator -->
									{#if card.selected && !card.matched}
										<div class="absolute top-2 right-2 sm:top-3 sm:right-3">
											<div class="h-5 w-5 rounded-full bg-blue-500 sm:h-6 sm:w-6"></div>
										</div>
									{/if}
								</button>
							{/each}
						</div>
					</div>
				</div>
			{/if}
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

<!-- Settings Modal -->
<SettingsModal
	bind:show={showSettings}
	mode="match"
	{flashcardSet}
	on:apply-settings={applySettings}
	on:close={() => (showSettings = false)}
/>
