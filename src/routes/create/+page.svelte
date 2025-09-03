<script>
	import { Plus, Trash2 } from 'lucide-svelte';
	import { flashcardActions, folders, folderActions } from '$lib/stores/flashcards.js';
	import { supabase } from '$lib/supabase.js';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { toast } from '$lib/stores/toast.js';

	let title = '';
	let description = '';
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
			toast.error('Validation Error', 'Add at least one card with term and definition');
			return;
		}

		isLoading = true;

		try {
			// Get current user
			const {
				data: { user }
			} = await supabase.auth.getUser();

			if (!user) {
				toast.error('Authentication Required', 'Please login first');
				goto('/login');
				return;
			}

			const newSet = await flashcardActions.addSet(
				{
					title: title.trim(),
					description: description.trim(),
					cards: validCards,
					folderId: selectedFolderId
				},
				user.id
			);

			toast.success('Success!', 'Flashcard set saved successfully');

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
			toast.error('Save Failed', 'An error occurred while saving. Please try again.');
		} finally {
			isLoading = false;
		}
	}

	async function saveAndPractice() {
		const validCards = cards.filter((card) => card.term.trim() && card.definition.trim());

		if (validCards.length === 0) {
			toast.error('Validation Error', 'Add at least one card with term and definition');
			return;
		}

		isLoading = true;

		try {
			const {
				data: { user }
			} = await supabase.auth.getUser();

			if (!user) {
				toast.error('Authentication Required', 'Please login first');
				goto('/login');
				return;
			}

			const newSet = await flashcardActions.addSet(
				{
					title: title.trim(),
					description: description.trim(),
					cards: validCards,
					folderId: selectedFolderId
				},
				user.id
			);

			toast.success('Success!', 'Flashcard set created. Starting practice...');

			// Redirect to quiz page
			goto(`/quiz/${newSet.id}`);
		} catch (error) {
			console.error('Failed to save flashcard set:', error);
			toast.error('Save Failed', 'An error occurred while saving. Please try again.');
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Create new flashcard set</title>
</svelte:head>

<div class="bg-surface-50-950 p-6">
	<div class="mx-auto max-w-4xl">
		<!-- Header -->
		<div class="mb-8 flex items-center justify-between">
			<h1 class="text-2xl font-bold">Create new flashcard set</h1>
			<div class="flex items-center space-x-4">
				<button class="btn preset-tonal" onclick={saveFlashcardSet}> Create </button>
				<button class="btn preset-filled-primary-300-700" onclick={saveAndPractice}>
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

			<!-- Cards Section -->
			<div class="space-y-4">
				{#each cards as card, index (card.id)}
					<div class="card preset-tonal p-6">
						<div class="mb-4 flex items-center justify-between">
							<span class="badge preset-filled">{index + 1}</span>
							<div class="flex items-center space-x-2">
								{#if cards.length > 2}
									<button
										class="btn-icon btn btn-icon-sm preset-tonal"
										onclick={() => removeCard(card.id)}
									>
										<Trash2 class="h-4 w-4" />
									</button>
								{/if}
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
				onclick={addCard}
				class="btn w-full border-2 border-dashed !border-surface-300-700 preset-tonal"
			>
				Add card
			</button>

			<!-- Folder Selection (optional) -->
			<div>
				<label class="label" for="folder-select">
					<span>Folder (optional)</span>
					<p class="mb-2 text-sm text-surface-600-400">
						Select a folder to group this flashcard set
					</p>
				</label>
				<select id="folder-select" class="select" bind:value={selectedFolderId}>
					<option value={null}>-- No folder --</option>
					{#each $folders as folder}
						<option value={folder.id}>
							{folder.name}
						</option>
					{/each}
				</select>
				{#if $folders.length === 0}
					<p class="mt-2 text-sm text-surface-600-400">
						You don't have any folders yet. <a
							href="/folders"
							class="text-primary-500 hover:underline">Create folder</a
						>
					</p>
				{/if}
			</div>

			<!-- Bottom Actions -->
			<div class="flex items-center justify-between pt-8">
				<button class="btn preset-tonal" onclick={saveFlashcardSet}> Create </button>
				<button class="btn preset-filled-primary-300-700" onclick={saveAndPractice}>
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
