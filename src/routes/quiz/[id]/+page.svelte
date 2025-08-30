<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase.js';
	import { toast } from '$lib/stores/toast.js';
	import {
		ArrowLeft,
		Trophy,
		BookOpen,
		Target,
		Brain,
		Zap,
		Users,
		Settings,
		Star,
		Volume2,
		MoreVertical,
		Edit3,
		Trash2
	} from 'lucide-svelte';

	// Components
	import Flashcard from '$lib/components/Flashcard.svelte';
	import Learn from '$lib/components/Learn.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import ProgressSummary from '$lib/components/ProgressSumary.svelte';

	let setId = $page.params.id;
	let flashcardSet = $state(null);
	let isLoading = $state(true);
	let currentCardIndex = $state(0);

	// UI state
	let showDropdown = $state(false);
	let showDeleteModal = $state(false);
	let isDeleting = $state(false);

	// Learning progress tracking
	let stillLearning = $state([]); // Cards that were answered incorrectly
	let mastered = $state([]); // Cards that were answered correctly

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
			goto('/');
		} finally {
			isLoading = false;
		}
	}

	function exitQuiz() {
		goto('/');
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

	// Handle learning progress from Learn component (for future use)
	function handleLearningProgress(event) {
		const { stillLearning: newStillLearning, mastered: newMastered } = event.detail;
		stillLearning = newStillLearning || [];
		mastered = newMastered || [];
	}

	function toggleDropdown() {
		showDropdown = !showDropdown;
	}

	function closeDropdown() {
		showDropdown = false;
	}

	function editFlashcardSet() {
		closeDropdown();
		goto(`/quiz/${setId}/edit`);
	}

	function confirmDelete() {
		closeDropdown();
		showDeleteModal = true;
	}

	async function deleteFlashcardSet() {
		try {
			isDeleting = true;

			// Get current user
			const {
				data: { user }
			} = await supabase.auth.getUser();

			if (!user) {
				toast.error('Authentication Required', 'Please login first');
				return;
			}

			// Delete all flashcards first
			const { error: cardsError } = await supabase.from('flashcards').delete().eq('set_id', setId);

			if (cardsError) throw cardsError;

			// Delete the flashcard set
			const { error: setError } = await supabase
				.from('flashcard_sets')
				.delete()
				.eq('id', setId)
				.eq('user_id', user.id);

			if (setError) throw setError;

			toast.success('Success!', 'Flashcard set deleted successfully');
			goto('/');
		} catch (error) {
			console.error('Error deleting flashcard set:', error);
			toast.error('Delete Failed', 'An error occurred while deleting. Please try again.');
		} finally {
			isDeleting = false;
			showDeleteModal = false;
		}
	}
</script>

<svelte:head>
	<title>{flashcardSet?.title || 'Quiz'} - Quizcard</title>
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
	<!-- Main Quiz Container -->
	<div class="bg-surface-50-900-token min-h-screen">
		<!-- Header Section -->
		<header class="bg-surface-100-800-token border-surface-300-600-token border-b px-6 py-8">
			<div class="mx-auto max-w-6xl">
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-4">
						<!-- Back Button -->
						<button
							onclick={exitQuiz}
							class="btn-icon btn-icon-sm preset-tonal-surface"
							title="Back to Dashboard"
						>
							<ArrowLeft class="h-5 w-5" />
						</button>

						<div>
							<!-- Quiz Title -->
							<h1 class="mb-2 text-3xl font-bold">{flashcardSet.title}</h1>

							<div class="mt-3 flex items-center space-x-4">
								<span class="text-surface-600-300-token text-sm">
									{flashcardSet.flashcards.length} terms
								</span>
								<span class="text-surface-600-300-token text-sm">
									Created by {flashcardSet.user_email || 'Unknown'}
								</span>
							</div>
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="flex items-center space-x-3">
						<button class="btn preset-tonal-surface" title="Settings">
							<Settings class="mr-2 h-5 w-5" />
							Settings
						</button>
						<button class="btn preset-tonal-surface" title="Star">
							<Star class="mr-2 h-5 w-5" />
							Star
						</button>

						<!-- Actions Dropdown -->
						<div class="relative">
							<button
								onclick={toggleDropdown}
								class="btn preset-filled-primary-500"
								title="More actions"
							>
								<MoreVertical class="h-5 w-5" />
							</button>

							{#if showDropdown}
								<div
									class="bg-surface-100-800-token border-surface-300-600-token absolute top-full right-0 z-10 mt-2 min-w-[160px] rounded-lg border shadow-lg"
								>
									<button
										onclick={editFlashcardSet}
										class="hover:bg-surface-200-700-token flex w-full items-center px-4 py-3 text-left"
									>
										<Edit3 class="mr-3 h-4 w-4" />
										Edit
									</button>
									<button
										onclick={confirmDelete}
										class="hover:bg-surface-200-700-token flex w-full items-center px-4 py-3 text-left text-error-500"
									>
										<Trash2 class="mr-3 h-4 w-4" />
										Delete
									</button>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Mode Selection Buttons (Like Quizlet) -->
				<div class="mt-6">
					<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
						<!-- Flashcards -->
						<a
							href="/quiz/{setId}/flashcard"
							class="btn flex-col preset-tonal-surface px-4 py-3 text-center no-underline"
						>
							<Brain class="mx-auto mb-1 h-5 w-5" />
							<span class="text-sm">Flashcards</span>
						</a>

						<!-- Learn -->
						<a
							href="/quiz/{setId}/learn"
							class="btn flex-col preset-tonal-surface px-4 py-3 text-center no-underline"
						>
							<BookOpen class="mx-auto mb-1 h-5 w-5" />
							<span class="text-sm">Learn</span>
						</a>

						<!-- Test -->
						<a
							href="/quiz/{setId}/test"
							class="btn flex-col preset-tonal-surface px-4 py-3 text-center no-underline"
						>
							<Target class="mx-auto mb-1 h-5 w-5" />
							<span class="text-sm">Test</span>
						</a>

						<!-- Match -->
						<a
							href="/quiz/{setId}/match"
							class="btn flex-col preset-tonal-surface px-4 py-3 text-center no-underline"
						>
							<Users class="mx-auto mb-1 h-5 w-5" />
							<span class="text-sm">Match</span>
						</a>
					</div>
				</div>
			</div>
		</header>

		<!-- Content Section -->
		<main class="mx-auto max-w-6xl px-6 py-8">
			<!-- Flashcard Component -->
			<section>
				<Flashcard
					{flashcardSet}
					bind:currentIndex={currentCardIndex}
					onNext={nextCard}
					onPrevious={previousCard}
					onShuffle={shuffleCards}
					onEdit={handleCardEdit}
				/>
			</section>
			<section>
				<Learn {flashcardSet} on:learning-progress={handleLearningProgress} />
			</section>

			<section class="mt-12">
				<ProgressSummary {flashcardSet} />
			</section>
		</main>
	</div>

	<!-- Delete Confirmation Modal -->
	<Modal bind:showModal={showDeleteModal} title="Delete Flashcard Set">
		{#snippet children()}
			<p class="mb-4">
				Are you sure you want to delete <strong>"{flashcardSet?.title}"</strong>? This action cannot
				be undone.
			</p>
			<div class="flex items-center justify-end space-x-3">
				<button
					class="btn preset-tonal-surface"
					onclick={() => (showDeleteModal = false)}
					disabled={isDeleting}
				>
					Cancel
				</button>
				<button
					class="btn preset-filled-error-500"
					onclick={deleteFlashcardSet}
					disabled={isDeleting}
				>
					{isDeleting ? 'Deleting...' : 'Delete'}
				</button>
			</div>
		{/snippet}
	</Modal>

	<!-- Click outside to close dropdown -->
	{#if showDropdown}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="fixed inset-0 z-0" onclick={closeDropdown} role="button" tabindex="-1"></div>
	{/if}
{:else}
	<div class="flex h-screen items-center justify-center">
		<div class="text-center">
			<h2 class="text-xl font-bold">Flashcard set not found</h2>
			<p class="text-surface-600-300-token mt-2">
				The requested flashcard set could not be loaded.
			</p>
			<button onclick={() => goto('/')} class="mt-4 btn preset-filled-primary-500">
				Go Home
			</button>
		</div>
	</div>
{/if}
