<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase.js';
	import { toast } from '$lib/stores/toast.js';
	import { ArrowLeft, Users, RotateCcw, Trophy } from 'lucide-svelte';
	import { ProgressService } from '$lib/services/progressService.js';

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

	function prepareGame() {
		if (!flashcardSet?.flashcards) return;

		// Take up to 6 random flashcards to create 12 cards total
		const selectedFlashcards = flashcardSet.flashcards.sort(() => Math.random() - 0.5).slice(0, 6);

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

		// Take up to 6 random flashcards to create 12 cards total
		const selectedFlashcards = flashcardSet.flashcards.sort(() => Math.random() - 0.5).slice(0, 6);

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

		// If we already have 2 cards selected, don't allow more
		if (selectedCards.length >= 2) return;

		// Select the card
		card.selected = true;
		selectedCards = [...selectedCards, card];

		// Check for match when 2 cards are selected
		if (selectedCards.length === 2) {
			attempts++;
			setTimeout(checkMatch, 500); // Small delay for visual feedback
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
			if (matchedPairs.length === flashcardSet.flashcards.slice(0, 6).length) {
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

	// Cleanup on component destroy
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
	<div class="flex h-screen items-center justify-center">
		<div class="text-center">
			<div
				class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"
			></div>
			<p class="text-surface-600-300-token">Loading match game...</p>
		</div>
	</div>
{:else if flashcardSet}
	<!-- Fullscreen Match Container -->
	<div class="bg-surface-50-900-token flex h-screen flex-col">
		<!-- Match Header -->
		<header
			class="bg-surface-100-800-token border-surface-300-600-token flex-shrink-0 border-b px-6 py-4"
		>
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-4">
					<!-- Back Button -->
					<button
						onclick={exitMatch}
						class="btn-icon btn-icon-sm preset-tonal-surface"
						title="Back to Quiz"
					>
						<ArrowLeft class="h-5 w-5" />
					</button>

					<div>
						<h1 class="text-xl font-semibold">{flashcardSet.title}</h1>
						<p class="text-surface-600-300-token text-sm">
							Match Mode • {gameCards.length / 2} pairs
						</p>
					</div>
				</div>

				<div class="flex items-center space-x-4">
					<!-- Game Stats -->
					<div class="text-center">
						<div class="text-surface-600-300-token text-sm">Time</div>
						<div class="font-mono text-lg font-semibold">{formatTime(gameTimer)}</div>
					</div>

					<div class="text-center">
						<div class="text-surface-600-300-token text-sm">Attempts</div>
						<div class="font-mono text-lg font-semibold">{attempts}</div>
					</div>

					<div class="text-center">
						<div class="text-surface-600-300-token text-sm">Matches</div>
						<div class="font-mono text-lg font-semibold">
							{matchedPairs.length}/{gameCards.length / 2}
						</div>
					</div>

					<!-- Reset Button -->
					<button onclick={resetGame} class="btn preset-tonal-surface" title="Reset Game">
						<RotateCcw class="mr-2 h-4 w-4" />
						Reset
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
						<p class="text-surface-600-300-token mb-6 text-lg">
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
				<!-- Pre-Game Start Screen -->
				<div class="flex h-full items-center justify-center">
					<div class="mx-auto max-w-2xl text-center">
						<h2 class="mb-4 text-3xl font-semibold">Match Game</h2>
						<p class="text-surface-600-300-token mb-6 text-lg">
							Match {gameCards.length / 2} terms with their definitions. Click on cards to select them
							and find matching pairs.
						</p>
						<div
							class="bg-surface-100-800-token border-surface-300-600-token mb-8 rounded-lg border p-6"
						>
							<h3 class="mb-3 font-semibold">How to Play:</h3>
							<ul class="text-surface-600-300-token space-y-2 text-left">
								<li>• Click on a term card, then click on its matching definition card</li>
								<li>• If they match, both cards will turn green</li>
								<li>• If they don't match, try again with different cards</li>
								<li>• Match all pairs as quickly as possible!</li>
							</ul>
						</div>
						<button onclick={startGame} class="btn preset-filled-primary-500 px-8 py-3 text-lg">
							Start Game
						</button>
					</div>
				</div>
			{:else}
				<!-- Game Grid -->
				<div class="mx-auto max-w-6xl">
					<!-- Instructions -->
					<div class="mb-6 text-center">
						<p class="text-surface-600-300-token text-lg">
							Click on cards to match terms with their definitions
						</p>
						<p class="text-surface-600-300-token mt-2 text-sm">
							Matched: {matchedPairs.length} / {gameCards.length / 2}
						</p>
					</div>

					<div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
						{#each gameCards as card (card.id)}
							<button
								class="group relative flex min-h-[120px] items-center justify-center overflow-hidden rounded-lg border-2 p-4 text-center transition-all duration-200 {card.matched
									? 'cursor-default border-green-500 bg-green-100 dark:bg-green-900'
									: card.selected
										? 'border-blue-500 bg-blue-100 dark:bg-blue-900'
										: 'border-surface-300-600-token bg-surface-100-800-token hover:border-surface-400-500-token hover:bg-surface-200-700-token'} {card.matched
									? ''
									: 'cursor-pointer active:scale-95'}"
								onclick={() => selectCard(card)}
								disabled={card.matched || !gameStarted}
							>
								<!-- Card Content - Always Visible -->
								<div class="text-sm font-medium break-words">
									{card.content}
								</div>

								<!-- Matched indicator -->
								{#if card.matched}
									<div class="absolute top-2 right-2">
										<div class="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
											<svg class="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
												<path
													fill-rule="evenodd"
													d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
													clip-rule="evenodd"
												/>
											</svg>
										</div>
									</div>
								{/if}

								<!-- Selected indicator -->
								{#if card.selected && !card.matched}
									<div class="absolute top-2 right-2">
										<div class="h-5 w-5 rounded-full bg-blue-500"></div>
									</div>
								{/if}

								<!-- Card type indicator -->
								<div class="absolute top-2 left-2">
									<div
										class="bg-surface-200-700-token text-surface-700-200-token rounded px-2 py-1 text-xs font-medium"
									>
										{card.type === 'term' ? 'Term' : 'Definition'}
									</div>
								</div>
							</button>
						{/each}
					</div>
				</div>
			{/if}
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
