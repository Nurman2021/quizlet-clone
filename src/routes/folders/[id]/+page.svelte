<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { ArrowLeft, Plus, MoreVertical, Edit, Trash2, Play } from 'lucide-svelte';
	import { folderActions, currentFolder } from '$lib/stores/flashcards.js';
	import { supabase } from '$lib/supabase.js';
	import { toast } from '$lib/stores/toast.js';
	import Modal from '$lib/components/Modal.svelte';

	let folderId;
	let isLoading = true;
	let folderSets = [];
	let showRemoveModal = false;
	let setToRemove = null;

	onMount(async () => {
		folderId = $page.params.id;

		try {
			// Get current user
			const {
				data: { user }
			} = await supabase.auth.getUser();

			if (!user) {
				goto('/login');
				return;
			}

			// Load folder with sets
			const { data: folder, error } = await supabase
				.from('folders')
				.select(
					`
                    *,
                    flashcard_sets (
                        id,
                        title,
                        description,
                        total_cards,
                        created_at,
                        last_studied_at
                    )
                `
				)
				.eq('id', folderId)
				.eq('user_id', user.id)
				.single();

			if (error) {
				console.error('Error loading folder:', error);
				throw error;
			}

			if (!folder) {
				goto('/folders');
				return;
			}

			currentFolder.set(folder);
			folderSets = folder.flashcard_sets || [];
			isLoading = false;
		} catch (error) {
			console.error('Error loading folder:', error);
			goto('/folders');
		}
	});

	function goToSet(setId) {
		goto(`/sets/${setId}`);
	}

	function startQuiz(setId) {
		goto(`/quiz/${setId}`);
	}

	async function removeSetFromFolder(setId) {
		// Show remove modal instead of confirm
		setToRemove = folderSets.find((s) => s.id === setId);
		showRemoveModal = true;
	}

	async function confirmRemoveSet() {
		if (!setToRemove) return;

		try {
			await folderActions.removeSetFromFolder(setToRemove.id);
			toast.success('Set removed from folder successfully');
			// Reload folder to refresh data
			location.reload();
		} catch (error) {
			toast.error('Failed to remove set from folder: ' + error.message);
		} finally {
			showRemoveModal = false;
			setToRemove = null;
		}
	}
</script>

<svelte:head>
	<title>{$currentFolder?.name || 'Loading...'} - Folder</title>
</svelte:head>

<div class="bg-surface-50-900-token min-h-screen p-6">
	<div class="mx-auto max-w-6xl">
		{#if isLoading}
			<!-- Loading -->
			<div class="py-16 text-center">
				<div class="mx-auto mb-4 placeholder animate-pulse"></div>
				<p class="text-surface-600-300-token">Loading folder...</p>
			</div>
		{:else if $currentFolder}
			<!-- Header -->
			<div class="mb-8">
				<button class="variant-ghost-surface mb-4 btn btn-sm" onclick={() => goto('/folders')}>
					<ArrowLeft class="h-4 w-4" />
					<span>Back to Folders</span>
				</button>

				<div class="flex items-start justify-between">
					<div class="flex items-center space-x-4">
						<div
							class="flex h-16 w-16 items-center justify-center rounded-xl"
							style="background-color: {$currentFolder.color}"
						>
							<span class="text-3xl">📁</span>
						</div>
						<div>
							<h1 class="text-3xl font-bold">{$currentFolder.name}</h1>
							{#if $currentFolder.description}
								<p class="text-surface-600-300-token mt-1">{$currentFolder.description}</p>
							{/if}
							<p class="text-surface-600-300-token mt-2 text-sm">
								{folderSets.length} flashcard sets
							</p>
						</div>
					</div>

					<div class="flex items-center space-x-2">
						<button class="variant-ghost-surface btn">
							<Edit class="h-4 w-4" />
							<span>Edit</span>
						</button>
						<a href="/create?folder={folderId}" class="variant-filled-primary btn">
							<Plus class="h-4 w-4" />
							<span>Add Set</span>
						</a>
					</div>
				</div>
			</div>

			<!-- Flashcard Sets -->
			{#if folderSets.length === 0}
				<div class="variant-ghost-surface card p-16 text-center">
					<h3 class="mb-2 text-xl font-semibold">This folder is empty</h3>
					<p class="text-surface-600-300-token mb-6">
						Add flashcard sets to this folder to organize them better
					</p>
					<a href="/create?folder={folderId}" class="variant-filled-primary btn">
						<Plus class="h-4 w-4" />
						<span>Create flashcard set</span>
					</a>
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each folderSets as set}
						<div
							class="divide-surface-200-800 card border-[1px] border-surface-200-800 preset-filled-surface-100-900 card-hover transition-all"
						>
							<div class="p-6">
								<div class="mb-4 flex items-start justify-between">
									<h3 class="mr-2 flex-1 font-semibold">{set.title}</h3>
									<button
										class="variant-ghost-surface btn-icon btn-icon-sm"
										onclick={() => removeSetFromFolder(set.id)}
									>
										<Trash2 class="h-4 w-4" />
									</button>
								</div>

								{#if set.description}
									<p class="text-surface-600-300-token mb-4 line-clamp-2 text-sm">
										{set.description}
									</p>
								{/if}

								<div class="mb-4 flex items-center justify-between">
									<span class="text-surface-600-300-token text-sm">
										{set.total_cards} cards
									</span>
									<span class="text-surface-600-300-token text-sm">
										{new Date(set.created_at).toLocaleDateString('en-US')}
									</span>
								</div>

								<div class="flex space-x-2">
									<button
										class="variant-ghost-surface btn flex-1 btn-sm"
										onclick={() => goToSet(set.id)}
									>
										View
									</button>
									<button
										class="variant-filled-primary btn flex-1 btn-sm"
										onclick={() => startQuiz(set.id)}
									>
										<Play class="h-4 w-4" />
										<span>Start</span>
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>

<!-- Remove Set Confirmation Modal -->
<Modal bind:showModal={showRemoveModal} size="sm" title="Remove Set from Folder">
	{#snippet children()}
		<div class="space-y-4">
			<p class="text-center">
				Are you sure you want to remove
				<span class="font-semibold text-primary-500">"{setToRemove?.title}"</span>
				from this folder?
			</p>
			<p class="text-surface-600-300-token text-center text-sm">
				The flashcard set will be moved to "No folder" but won't be deleted.
			</p>

			<div class="flex space-x-3 pt-4">
				<button
					class="preset-ghost-neutral-500-900 btn flex-1"
					onclick={() => (showRemoveModal = false)}
				>
					Cancel
				</button>
				<button class="preset-filled-warning-500-900 btn flex-1" onclick={confirmRemoveSet}>
					Remove
				</button>
			</div>
		</div>
	{/snippet}
</Modal>
