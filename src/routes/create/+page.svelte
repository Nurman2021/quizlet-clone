<script>
	import { Plus, Image, Settings, Grid, Copy, Trash2, MoreHorizontal } from 'lucide-svelte';
	import { flashcardActions, folders, folderActions } from '$lib/stores/flashcards.js';
	import { supabase } from '$lib/supabase.js';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let title = '';
	let description = '';
	let suggestionToggle = true;
	let cards = [
		{ id: Date.now(), term: '', definition: '' },
		{ id: Date.now() + 1, term: '', definition: '' }
	];
	let isLoading = false;
	let selectedFolderId = null;

	onMount(async () => {
		// Get current user
		const {
			data: { user }
		} = await supabase.auth.getUser();

		if (user) {
			// Load folders
			await folderActions.loadFolders(user.id);
		}

		// Check if folder ID is passed via URL params
		const folderId = $page.url.searchParams.get('folder');
		if (folderId) {
			selectedFolderId = folderId;
		}
	});

	function addCard() {
		cards = [...cards, { id: Date.now(), term: '', definition: '' }];
	}

	function removeCard(id) {
		cards = cards.filter((card) => card.id !== id);
	}

	async function saveFlashcardSet() {
		const validCards = cards.filter((card) => card.term.trim() && card.definition.trim());

		if (validCards.length === 0) {
			alert('Add at least one card with term and definition!');
			return;
		}

		isLoading = true;

		try {
			// Get current user
			const {
				data: { user }
			} = await supabase.auth.getUser();

			if (!user) {
				alert('Please login first!');
				goto('/login');
				return;
			}

			const newSet = await flashcardActions.addSet(
				{
					title: title.trim(),
					description: description.trim(),
					cards: validCards,
					folderId: selectedFolderId // Include folder ID
				},
				user.id
			);

			alert('Flashcard set saved successfully!');

			// Reset form after successful save
			title = '';
			description = '';
			cards = [
				{ id: Date.now(), term: '', definition: '' },
				{ id: Date.now() + 1, term: '', definition: '' }
			];
			selectedFolderId = null;
		} catch (error) {
			console.error('Failed to save flashcard set:', error);
			alert('An error occurred while saving. Please try again.');
		} finally {
			isLoading = false;
		}
	}

	async function saveAndPractice() {
		const validCards = cards.filter((card) => card.term.trim() && card.definition.trim());

		if (validCards.length === 0) {
			alert('Add at least one card with term and definition!');
			return;
		}

		isLoading = true;

		try {
			const {
				data: { user }
			} = await supabase.auth.getUser();

			if (!user) {
				alert('Please login first!');
				goto('/login');
				return;
			}

			const newSet = await flashcardActions.addSet(
				{
					title: title.trim(),
					description: description.trim(),
					cards: validCards,
					folderId: selectedFolderId // Include folder ID
				},
				user.id
			);

			// Redirect to quiz page
			goto(`/quiz/${newSet.id}`);
		} catch (error) {
			console.error('Failed to save flashcard set:', error);
			alert('An error occurred while saving. Please try again.');
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Create new flashcard set</title>
</svelte:head>

<div class="bg-surface-50-900-token p-6">
	<div class="mx-auto max-w-4xl">
		<!-- Header -->
		<div class="mb-8 flex items-center justify-between">
			<h1 class="text-2xl font-bold">Create new flashcard set</h1>
			<div class="flex items-center space-x-4">
				<button class="variant-ghost-surface btn" on:click={saveFlashcardSet}> Create </button>
				<button class="variant-filled-primary btn" on:click={saveAndPractice}>
					Create and practice
				</button>
			</div>
		</div>

		<!-- Form Content -->
		<div class="space-y-6">
			<!-- Title Input -->
			<div>
				<input
					bind:value={title}
					type="text"
					placeholder="Title"
					class="input text-xl font-semibold"
					required
				/>
			</div>

			<!-- Description Input -->
			<div>
				<textarea
					bind:value={description}
					placeholder="Add description..."
					rows="3"
					class="textarea resize-none"
				></textarea>
			</div>

			<!-- Add Options -->
			<div class="flex items-center space-x-4">
				<button class="variant-ghost-surface btn btn-sm">
					<Plus class="h-4 w-4" />
					<span>Import</span>
				</button>
				<button class="variant-ghost-surface btn btn-sm">
					<Plus class="h-4 w-4" />
					<span>Add diagram</span>
					<span class="variant-filled-warning badge">BETA</span>
				</button>
			</div>

			<!-- Card Settings -->
			<div class="flex items-center justify-between py-4">
				<div class="flex items-center space-x-4">
					<div class="flex items-center space-x-2">
						<button class="variant-ghost-surface btn-icon btn btn-icon-sm">
							<Settings class="h-4 w-4" />
						</button>
						<span>Suggestions</span>
						<input type="checkbox" class="checkbox" bind:checked={suggestionToggle} />
					</div>
					<button class="variant-ghost-surface btn-icon btn btn-icon-sm">
						<Grid class="h-4 w-4" />
					</button>
					<button class="variant-ghost-surface btn-icon btn btn-icon-sm">
						<Copy class="h-4 w-4" />
					</button>
					<button class="variant-ghost-surface btn-icon btn btn-icon-sm">
						<MoreHorizontal class="h-4 w-4" />
					</button>
				</div>
			</div>

			<!-- Cards Section -->
			<div class="space-y-4">
				{#each cards as card, index (card.id)}
					<div class="variant-ghost-surface card p-6">
						<div class="mb-4 flex items-center justify-between">
							<span class="variant-filled-primary badge">{index + 1}</span>
							<div class="flex items-center space-x-2">
								{#if cards.length > 2}
									<button
										class="variant-ghost-surface btn-icon btn btn-icon-sm"
										on:click={() => removeCard(card.id)}
									>
										<Trash2 class="h-4 w-4" />
									</button>
								{/if}
								<button class="variant-ghost-surface btn-icon btn btn-icon-sm">
									<MoreHorizontal class="h-4 w-4" />
								</button>
								<button class="variant-ghost-surface btn-icon btn btn-icon-sm">
									<Image class="h-4 w-4" />
								</button>
								<span class="text-sm opacity-75">Image</span>
							</div>
						</div>

						<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
							<!-- Term -->
							<div>
								<label class="label mb-2" for="term-{card.id}">
									<span class="text-sm font-semibold">TERM</span>
								</label>
								<textarea
									id="term-{card.id}"
									bind:value={card.term}
									placeholder="Enter term"
									class="textarea min-h-[120px]"
									rows="4"
								></textarea>
							</div>

							<!-- Definition -->
							<div>
								<label class="label mb-2" for="definition-{card.id}">
									<span class="text-sm font-semibold">DEFINITION</span>
								</label>
								<textarea
									id="definition-{card.id}"
									bind:value={card.definition}
									placeholder="Enter definition"
									class="textarea min-h-[120px]"
									rows="4"
								></textarea>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Add Card Button -->
			<button
				on:click={addCard}
				class="variant-ghost-surface !border-surface-300-600-token btn w-full border-2 border-dashed"
			>
				Add card
			</button>

			<!-- Folder Selection (optional) -->
			<div>
				<label class="label" for="folder-select">
					<span>Folder (optional)</span>
					<p class="text-surface-600-300-token mb-2 text-sm">
						Select a folder to group this flashcard set
					</p>
				</label>
				<select
					id="folder-select"
					class="variant-form-material select"
					bind:value={selectedFolderId}
				>
					<option value={null}>-- No folder --</option>
					{#each $folders as folder}
						<option value={folder.id}>
							{folder.name}
						</option>
					{/each}
				</select>
				{#if $folders.length === 0}
					<p class="text-surface-600-300-token mt-2 text-sm">
						You don't have any folders yet. <a
							href="/folders"
							class="text-primary-500 hover:underline">Create folder</a
						>
					</p>
				{/if}
			</div>

			<!-- Bottom Actions -->
			<div class="flex items-center justify-between pt-8">
				<button class="variant-ghost-surface btn" on:click={saveFlashcardSet}> Create </button>
				<button class="variant-filled-primary btn" on:click={saveAndPractice}>
					Create and practice
				</button>
			</div>
		</div>
	</div>
</div>

{#if isLoading}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<div class="card p-4">
			<p>Saving flashcard set...</p>
		</div>
	</div>
{/if}
