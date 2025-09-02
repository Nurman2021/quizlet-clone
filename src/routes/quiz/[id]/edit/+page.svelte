<script>
	import { Plus, Trash2, ArrowLeft } from 'lucide-svelte';
	import { flashcardActions, folders, folderActions } from '$lib/stores/flashcards.js';
	import { supabase } from '$lib/supabase.js';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { toast } from '$lib/stores/toast.js';

	let setId = $page.params.id;
	let title = '';
	let description = '';
	let cards = [];
	let isLoading = false;
	let isSaving = false;
	let selectedFolderId = null;
	let flashcardSet = null;

	onMount(async () => {
		await loadFlashcardSet();

		// Get current user and load folders
		const {
			data: { user }
		} = await supabase.auth.getUser();

		if (user) {
			await folderActions.loadFolders(user.id);
		}
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

			const { data: flashcards, error: cardsError } = await supabase
				.from('flashcards')
				.select('*')
				.eq('set_id', setId)
				.order('created_at');

			if (cardsError) throw cardsError;

			flashcardSet = { ...set, flashcards };

			// Populate form with existing data
			title = set.title || '';
			description = set.description || '';
			selectedFolderId = set.folder_id;

			// Convert flashcards to editable format
			cards = flashcards.map((card) => ({
				id: card.id,
				term: card.term,
				definition: card.definition,
				isExisting: true
			}));

			// Add empty cards if none exist
			if (cards.length === 0) {
				cards = [
					{ id: Date.now(), term: '', definition: '', isExisting: false },
					{ id: Date.now() + 1, term: '', definition: '', isExisting: false }
				];
			}
		} catch (error) {
			console.error('Error loading flashcard set:', error);
			toast.error('Failed to load flashcard set', error.message);
			goto('/');
		} finally {
			isLoading = false;
		}
	}

	function addCard() {
		cards = [...cards, { id: Date.now(), term: '', definition: '', isExisting: false }];
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

		if (!title.trim()) {
			toast.error('Validation Error', 'Title is required');
			return;
		}

		isSaving = true;

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

			// Update flashcard set
			const { error: setError } = await supabase
				.from('flashcard_sets')
				.update({
					title: title.trim(),
					description: description.trim(),
					folder_id: selectedFolderId,
					updated_at: new Date().toISOString()
				})
				.eq('id', setId);

			if (setError) throw setError;

			// Smart flashcard handling - preserve existing IDs to maintain progress
			const existingCards = validCards.filter((card) => card.isExisting && card.id);
			const newCards = validCards.filter((card) => !card.isExisting);

			// Get current flashcards from database to determine what to delete
			const { data: currentFlashcards, error: fetchError } = await supabase
				.from('flashcards')
				.select('id')
				.eq('set_id', setId);

			if (fetchError) throw fetchError;

			// Find cards to delete (existing in DB but not in current cards)
			const currentCardIds = existingCards.map((card) => card.id);
			const cardsToDelete = currentFlashcards
				.filter((dbCard) => !currentCardIds.includes(dbCard.id))
				.map((card) => card.id);

			// Delete removed cards (this will also cascade delete their progress)
			if (cardsToDelete.length > 0) {
				const { error: deleteError } = await supabase
					.from('flashcards')
					.delete()
					.in('id', cardsToDelete);

				if (deleteError) throw deleteError;
			}

			// Update existing cards (preserves their IDs and associated progress)
			for (const card of existingCards) {
				if (card.id) {
					const { error: updateError } = await supabase
						.from('flashcards')
						.update({
							term: card.term.trim(),
							definition: card.definition.trim(),
							updated_at: new Date().toISOString()
						})
						.eq('id', card.id);

					if (updateError) throw updateError;
				}
			}

			// Insert new cards only
			if (newCards.length > 0) {
				const flashcardsToInsert = newCards.map((card) => ({
					set_id: setId,
					term: card.term.trim(),
					definition: card.definition.trim()
				}));

				const { error: insertError } = await supabase.from('flashcards').insert(flashcardsToInsert);

				if (insertError) throw insertError;
			}

			toast.success('Success!', 'Flashcard set updated successfully');
			goto(`/quiz/${setId}`);
		} catch (error) {
			console.error('Failed to update flashcard set:', error);
			toast.error('Update Failed', 'An error occurred while updating. Please try again.');
		} finally {
			isSaving = false;
		}
	}

	function cancelEdit() {
		goto(`/quiz/${setId}`);
	}
</script>

<svelte:head>
	<title>Edit {flashcardSet?.title || 'Flashcard Set'} - Quizcard</title>
</svelte:head>

{#if isLoading}
	<div class="flex h-screen items-center justify-center">
		<div class="text-center">
			<div
				class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"
			></div>
			<p class="text-surface-600-400">Loading flashcard set...</p>
		</div>
	</div>
{:else}
	<div class="bg-surface-50-950 p-6">
		<div class="mx-auto max-w-4xl">
			<!-- Header -->
			<div class="mb-8 flex items-center justify-between">
				<div class="flex items-center space-x-4">
					<button
						onclick={cancelEdit}
						class="btn-icon btn-icon-sm preset-tonal-surface"
						title="Back to Quiz"
					>
						<ArrowLeft class="h-5 w-5" />
					</button>
					<h1 class="text-2xl font-bold">Back to set</h1>
				</div>
				<div class="flex items-center space-x-4">
					<button class="btn preset-tonal" onclick={cancelEdit} disabled={isSaving}>
						Cancel
					</button>
					<button
						class="btn preset-filled-primary-500"
						onclick={saveFlashcardSet}
						disabled={isSaving}
					>
						{isSaving ? 'Saving...' : 'Done'}
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
						disabled={isSaving}
					/>
				</div>

				<!-- Description Input -->
				<div>
					<textarea
						bind:value={description}
						placeholder="Add description..."
						rows="3"
						class="textarea resize-none"
						disabled={isSaving}
					></textarea>
				</div>

				<!-- Cards Section -->
				<div class="space-y-4">
					{#each cards as card, index (card.id)}
						<div class="card preset-tonal p-6">
							<div class="mb-4 flex items-center justify-between">
								<span class="badge preset-filled">{index + 1}</span>
								<div class="flex items-center space-x-2">
									{#if cards.length > 1}
										<button
											class="btn-icon btn btn-icon-sm preset-tonal"
											onclick={() => removeCard(card.id)}
											disabled={isSaving}
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
										disabled={isSaving}
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
										disabled={isSaving}
									></textarea>
								</div>
							</div>
						</div>
					{/each}
				</div>

				<!-- Add Card Button -->
				<button
					onclick={addCard}
					class="btn w-full border-2 border-dashed border-surface-300-700 preset-tonal"
					disabled={isSaving}
				>
					<Plus class="mr-2 h-4 w-4" />
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
					<select
						id="folder-select"
						class="select"
						bind:value={selectedFolderId}
						disabled={isSaving}
					>
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
					<button class="btn preset-tonal" onclick={cancelEdit} disabled={isSaving}>
						Cancel
					</button>
					<button
						class="btn preset-filled-primary-500"
						onclick={saveFlashcardSet}
						disabled={isSaving}
					>
						{isSaving ? 'Saving...' : 'Done'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if isSaving}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<div class="card p-4">
			<p>Updating flashcard set...</p>
		</div>
	</div>
{/if}
