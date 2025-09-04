<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase.js';
	import { toast } from '$lib/stores/toast.js';
	import { Settings, Star, MoreVertical, Edit3, Trash2, Bookmark } from 'lucide-svelte';

	// Components
	import Flashcard from '$lib/components/Flashcard.svelte';
	import Learn from '$lib/components/Learn.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import ProgressSummary from '$lib/components/ProgressSumary.svelte';

	// image
	import flascardIcon from '$lib/images/flashcard-img.png';
	import learnIcon from '$lib/images/learn-img.png';
	import testIcon from '$lib/images/terst-img.png';
	import matchIcon from '$lib/images/match-img.png';

	let setId = $page.params.id;
	let flashcardSet = $state(null);
	let isLoading = $state(true);
	let currentCardIndex = $state(0);

	// UI state
	let showDropdown = $state(false);
	let showDeleteModal = $state(false);
	let isDeleting = $state(false);

	// Star functionality
	let starredCards = $state([]);

	function updateStarredCards() {
		if (flashcardSet?.flashcards) {
			starredCards = flashcardSet.flashcards.filter((card) => card.is_starred) || [];
		} else {
			starredCards = [];
		}
	}

	onMount(async () => {
		await loadFlashcardSet();
	});

	async function loadFlashcardSet() {
		try {
			isLoading = true;

			const { data: set, error: setError } = await supabase
				.from('flashcard_sets')
				.select(
					`
                *,
                users (
                    id,
                    full_name,
                    email,
                    avatar_url
                )
            `
				)
				.eq('id', setId)
				.single();

			if (setError) throw setError;

			const { data: cards, error: cardsError } = await supabase
				.from('flashcards')
				.select('id, term, definition, is_starred, created_at, updated_at, set_id')
				.eq('set_id', setId)
				.order('created_at');

			if (cardsError) throw cardsError;

			flashcardSet = { ...set, flashcards: cards || [] };
			updateStarredCards();
		} catch (error) {
			console.error('Error loading flashcard set:', error);
			toast.error('Failed to load flashcard set', error.message);
			goto('/');
		} finally {
			isLoading = false;
		}
	}

	function handleCardEdit(updatedCard) {
		updateStarredCards();
		console.log('Card updated in main page:', updatedCard);
	}

	function handleStarToggle(cardId) {
		updateStarredCards();
		console.log('Star toggled in main page:', cardId);
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

	// Function untuk toggle star pada flashcard
	async function toggleCardStar(cardId) {
		try {
			if (!flashcardSet?.flashcards) {
				toast.error('Flashcard set not loaded');
				return;
			}

			const card = flashcardSet.flashcards.find((c) => c.id === cardId);
			if (!card) {
				toast.error('Card not found');
				return;
			}

			const newStarredState = !card.is_starred;

			// Update di database
			const { error } = await supabase
				.from('flashcards')
				.update({ is_starred: newStarredState })
				.eq('id', cardId);

			if (error) throw error;

			// Update local state
			flashcardSet.flashcards = flashcardSet.flashcards.map((c) =>
				c.id === cardId ? { ...c, is_starred: newStarredState } : c
			);

			// Update starred cards array
			updateStarredCards();

			toast.success(newStarredState ? 'Card starred!' : 'Star removed');
		} catch (error) {
			console.error('Error toggling star:', error);
			toast.error('Failed to update star');
		}
	}

	async function toggleSetStar() {
		try {
			if (!flashcardSet?.flashcards?.length) {
				toast.error('No flashcards available');
				return;
			}

			const isCurrentlyStarred = starredCards.length > 0;
			const newStarredState = !isCurrentlyStarred;

			// Update semua cards di set
			const { error } = await supabase
				.from('flashcards')
				.update({ is_starred: newStarredState })
				.eq('set_id', setId);

			if (error) throw error;

			// Update local state
			flashcardSet.flashcards = flashcardSet.flashcards.map((card) => ({
				...card,
				is_starred: newStarredState
			}));

			updateStarredCards();

			toast.success(newStarredState ? 'All cards starred!' : 'All stars removed');
		} catch (error) {
			console.error('Error toggling set star:', error);
			toast.error('Failed to update stars');
		}
	}
</script>

<svelte:head>
	<title>{flashcardSet?.title || 'Quiz'} - Quizcard</title>
</svelte:head>

{#if isLoading}
	<div class="my-12 min-h-screen bg-surface-50-950">
		<!-- Skeleton Header -->
		<header class="preset-tonal-surface px-6 py-4">
			<div class="mx-auto max-w-6xl">
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-4">
						<div>
							<div class="mb-2 h-8 w-64 animate-pulse rounded bg-surface-300-700"></div>
						</div>
					</div>
					<div class="flex items-center space-x-3">
						<div class="h-10 w-20 animate-pulse rounded bg-surface-300-700"></div>
						<div class="h-10 w-24 animate-pulse rounded bg-surface-300-700"></div>
						<div class="h-10 w-10 animate-pulse rounded bg-surface-300-700"></div>
					</div>
				</div>
				<div class="mt-6">
					<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
						{#each Array(4) as _}
							<div class="flex-col rounded-xl bg-surface-200-800 px-4 py-3 text-center">
								<div class="mx-auto mb-1 h-9 w-9 animate-pulse rounded bg-surface-300-700"></div>
								<div class="mx-auto h-4 w-16 animate-pulse rounded bg-surface-300-700"></div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</header>

		<!-- Skeleton Flashcard -->
		<main class="mx-auto max-w-6xl">
			<section class="px-6 py-8">
				<div class="mx-auto max-w-4xl">
					<div class="min-h-[400px] animate-pulse rounded-xl bg-surface-200-800"></div>
					<div class="mt-6 flex items-center justify-between">
						<div class="h-10 w-32 animate-pulse rounded bg-surface-300-700"></div>
						<div class="flex gap-6">
							<div class="h-12 w-12 animate-pulse rounded-full bg-surface-300-700"></div>
							<div class="h-12 w-12 animate-pulse rounded-full bg-surface-300-700"></div>
						</div>
						<div class="flex space-x-2">
							<div class="h-10 w-10 animate-pulse rounded bg-surface-300-700"></div>
							<div class="h-10 w-10 animate-pulse rounded bg-surface-300-700"></div>
						</div>
					</div>
				</div>
			</section>
		</main>
	</div>
{:else if flashcardSet}
	<!-- Main Quiz Container -->
	<div class="my-12 min-h-screen bg-surface-50-950">
		<!-- Header Section -->
		<header class="preset-tonal-surface px-6 py-4">
			<div class="mx-auto max-w-6xl">
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-4">
						<div>
							<h1 class="mb-2 text-3xl font-bold">{flashcardSet.title}</h1>
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="flex items-center space-x-3">
						<button class="btn preset-tonal-surface" title="folder">
							<Bookmark class="mr-2 h-5 w-5" />
							Save
						</button>
						<button
							onclick={toggleSetStar}
							class="btn preset-tonal-surface {starredCards.length > 0 ? 'text-yellow-500' : ''}"
							title={starredCards.length > 0 ? 'Remove all stars' : 'Star all cards'}
						>
							<Star class="mr-2 h-5 w-5 {starredCards.length > 0 ? 'fill-current' : ''}" />
							Star {starredCards.length > 0 ? `(${starredCards.length})` : ''}
						</button>

						<!-- Actions Dropdown -->
						<div class="relative">
							<button
								onclick={toggleDropdown}
								class="btn-icon btn preset-tonal-surface"
								title="More actions"
							>
								<MoreVertical class="h-5 w-5" />
							</button>

							{#if showDropdown}
								<div
									class="absolute top-full right-0 z-10 mt-2 min-w-[160px] rounded-lg border border-surface-300-700 bg-surface-100-900 shadow-lg"
								>
									<button
										onclick={editFlashcardSet}
										class="flex w-full items-center px-4 py-3 text-left hover:bg-surface-200-800"
									>
										<Edit3 class="mr-3 h-4 w-4" />
										Edit
									</button>
									<button
										onclick={confirmDelete}
										class="flex w-full items-center px-4 py-3 text-left text-error-500 hover:bg-surface-200-800"
									>
										<Trash2 class="mr-3 h-4 w-4" />
										Delete
									</button>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<div class="mt-6">
					<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
						<a
							href="/quiz/{setId}/flashcard"
							class="btn flex-col rounded-xl preset-tonal px-4 py-3 text-center no-underline"
						>
							<img src={flascardIcon} alt="flashcard" class="mx-auto mb-1 h-9 w-9 object-contain" />
							<span class="text-sm font-semibold">Flashcards</span>
						</a>

						<a
							href="/quiz/{setId}/learn"
							class="btn flex-col rounded-xl preset-tonal px-4 py-3 text-center no-underline"
						>
							<img src={learnIcon} alt="learn" class="mx-auto mb-1 h-9 w-9 object-contain" />
							<span class="text-sm font-semibold">Learn</span>
						</a>

						<a
							href="/quiz/{setId}/test"
							class="btn flex-col rounded-xl preset-tonal px-4 py-3 text-center no-underline"
						>
							<img src={testIcon} alt="test" class="mx-auto mb-1 h-9 w-9 object-contain" />
							<span class="text-sm font-semibold">Test</span>
						</a>

						<!-- <a
							href="/quiz/{setId}/uji"
							class="btn flex-col rounded-xl preset-tonal px-4 py-3 text-center no-underline"
						>
							<img src={testIcon} alt="uji" class="mx-auto mb-1 h-9 w-9 object-contain" />
							<span class="text-sm font-semibold">Uji</span>
						</a> -->

						<a
							href="/quiz/{setId}/match"
							class="btn flex-col rounded-xl preset-tonal px-4 py-3 text-center no-underline"
						>
							<img src={matchIcon} alt="matchmaking" class="mx-auto mb-1 h-9 w-9 object-contain" />
							<span class="text-sm font-semibold">Match</span>
						</a>
					</div>
				</div>
			</div>
		</header>

		<main class="mx-auto max-w-6xl">
			<section>
				<Flashcard
					bind:flashcardSet
					bind:currentIndex={currentCardIndex}
					onCardEdit={handleCardEdit}
					onStarToggle={handleStarToggle}
					mode="inline"
				/>
			</section>
			<section class="my-12 px-8 py-8">
				<div class="mb-6 flex flex-wrap items-center gap-4 text-sm text-surface-600-400">
					<!-- User Avatar -->
					{#if flashcardSet.users?.avatar_url}
						<img
							src={flashcardSet.users.avatar_url}
							alt="Creator avatar"
							class="h-14 w-14 rounded-full object-cover"
							onerror={(e) => (e.target.style.display = 'none')}
						/>
					{:else}
						<div
							class="flex h-14 w-14 items-center justify-center rounded-full bg-primary-500 text-xl font-medium text-white"
						>
							{(flashcardSet.users?.full_name || 'Unknown').charAt(0).toUpperCase()}
						</div>
					{/if}

					<div class="flex flex-col">
						<span>Created by</span>

						<span class="font-medium text-surface-800-200">
							{flashcardSet.users?.full_name || 'Unknown'}
						</span>

						{#if flashcardSet.created_at}
							<div class="flex items-center gap-2">
								<span>Created</span>
								<span class="font-medium">
									{new Date(flashcardSet.created_at).toLocaleDateString('en-US', {
										year: 'numeric',
										month: 'long',
										day: 'numeric'
									})}
								</span>
							</div>
						{/if}
					</div>
				</div>
				<div>
					<p class="text-lg leading-relaxed text-surface-700-300">
						{flashcardSet.description}
					</p>
					<div class="flex items-center gap-2">
						<span class="font-medium">{flashcardSet.flashcards.length}</span>
						<span>terms</span>
					</div>
				</div>
			</section>
			<section>
				<Learn {flashcardSet} mode="inline" />
			</section>

			<section class="mt-12">
				<ProgressSummary {flashcardSet} onStarToggle={toggleCardStar} />
			</section>
		</main>
	</div>

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
			<p class="mt-2 text-surface-600-400">The requested flashcard set could not be loaded.</p>
			<button onclick={() => goto('/')} class="mt-4 btn preset-filled-primary-500">
				Go Home
			</button>
		</div>
	</div>
{/if}
