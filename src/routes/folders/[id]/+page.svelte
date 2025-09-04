<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { ArrowLeft, Plus, MoreVertical, Edit, Trash2, FileText } from 'lucide-svelte';
	import { folderActions, currentFolder } from '$lib/stores/flashcards.js';
	import { supabase } from '$lib/supabase.js';
	import { toast } from '$lib/stores/toast.js';
	import Modal from '$lib/components/Modal.svelte';
	import CreateFolderModal from '$lib/components/CreateFolder.svelte';

	let folderId;
	let isLoading = true;
	let folderSets = [];
	let showRemoveModal = false;
	let setToRemove = null;
	let showEditModal = false;

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
		goto(`/quiz/${setId}`);
	}

	async function removeSetFromFolder(setId) {
		// Show remove modal instead of confirm
		setToRemove = folderSets.find((s) => s.id === setId);
		showRemoveModal = true;
	}

	function handleEdit() {
		showEditModal = true;
	}

	async function handleUpdateFolder(event) {
		try {
			const folderData = event.detail;

			const { error } = await supabase
				.from('folders')
				.update({
					name: folderData.name,
					description: folderData.description,
					color: folderData.color
				})
				.eq('id', folderId);

			if (error) throw error;

			toast.success('Folder updated successfully!');
			showEditModal = false;

			// Update the current folder in the store
			currentFolder.update((folder) => ({
				...folder,
				...folderData
			}));
		} catch (error) {
			toast.error('Failed to update folder: ' + error.message);
		}
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

<div class="min-h-screen bg-surface-50-950 p-6">
	<div class="mx-auto max-w-6xl">
		{#if isLoading}
			<!-- Skeleton Loading State -->
			<div class="mb-8">
				<!-- Skeleton Back Button -->
				<div class="mb-4 h-8 w-32 animate-pulse rounded bg-surface-300-700"></div>

				<!-- Skeleton Header -->
				<div class="flex items-start justify-between">
					<div class="flex items-center space-x-4">
						<div class="h-16 w-16 animate-pulse rounded-xl bg-surface-300-700"></div>
						<div class="space-y-2">
							<div class="h-8 w-48 animate-pulse rounded bg-surface-300-700"></div>
							<div class="h-4 w-32 animate-pulse rounded bg-surface-300-700"></div>
							<div class="h-4 w-24 animate-pulse rounded bg-surface-300-700"></div>
						</div>
					</div>
					<div class="flex items-center space-x-2">
						<div class="h-10 w-20 animate-pulse rounded bg-surface-300-700"></div>
						<div class="h-10 w-24 animate-pulse rounded bg-surface-300-700"></div>
					</div>
				</div>
			</div>

			<!-- Skeleton Flashcard Sets Grid -->
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each Array(6) as _}
					<div class="card preset-filled-surface-100-900 p-6">
						<div class="mb-4 flex items-start justify-between">
							<div class="h-6 w-3/4 animate-pulse rounded bg-surface-300-700"></div>
							<div class="h-8 w-8 animate-pulse rounded bg-surface-300-700"></div>
						</div>
						<div class="mb-4 space-y-2">
							<div class="h-4 w-full animate-pulse rounded bg-surface-300-700"></div>
							<div class="h-4 w-2/3 animate-pulse rounded bg-surface-300-700"></div>
						</div>
						<div class="mb-4 flex items-center justify-between">
							<div class="h-4 w-16 animate-pulse rounded bg-surface-300-700"></div>
							<div class="h-4 w-20 animate-pulse rounded bg-surface-300-700"></div>
						</div>
						<div class="flex space-x-2">
							<div class="h-8 w-16 animate-pulse rounded bg-surface-300-700"></div>
							<div class="h-8 w-16 animate-pulse rounded bg-surface-300-700"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if $currentFolder}
			<!-- Header -->
			<div class="mb-8">
				<button class="mb-4 btn preset-tonal-surface btn-sm" onclick={() => goto('/folders')}>
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
								<p class="mt-1 text-surface-600-400">{$currentFolder.description}</p>
							{/if}
							<p class="mt-2 text-sm text-surface-600-400">
								{folderSets.length} flashcard sets
							</p>
						</div>
					</div>

					<div class="flex items-center space-x-2">
						<button class="btn preset-tonal-surface" onclick={handleEdit}>
							<Edit class="h-4 w-4" />
							<span>Edit</span>
						</button>
						<a href="/create?folder={folderId}" class="btn preset-tonal">
							<Plus class="h-4 w-4" />
							<span>Add Set</span>
						</a>
					</div>
				</div>
			</div>

			<!-- Flashcard Sets -->
			{#if folderSets.length === 0}
				<div class="card preset-tonal-surface p-16 text-center">
					<div class="mb-6">
						<div
							class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-200-800"
						>
							<Plus class="h-8 w-8 text-surface-600-400" />
						</div>
					</div>
					<h3 class="mb-2 text-xl font-semibold">This folder is empty</h3>
					<p class="mb-6 text-surface-600-400">
						Add flashcard sets to this folder to organize them better
					</p>
					<a href="/create?folder={folderId}" class="btn preset-filled-primary-500">
						<Plus class="h-4 w-4" />
						<span>Create flashcard set</span>
					</a>
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each folderSets as set}
						<div
							class="group cursor-pointer divide-surface-200-800 card border border-surface-200-800 preset-filled-surface-100-900 transition-all duration-200 hover:shadow-lg"
							role="button"
							tabindex="0"
							onclick={() => goToSet(set.id)}
							onkeydown={(e) => e.key === 'Enter' && goToSet(set.id)}
						>
							<div class="p-6">
								<div class="mb-4 flex items-start justify-between">
									<h3
										class="mr-2 line-clamp-2 flex-1 font-semibold transition-colors group-hover:text-primary-500"
									>
										{set.title}
									</h3>
									<button
										class="btn-icon btn-icon-sm preset-tonal-surface opacity-0 transition-opacity group-hover:opacity-100"
										onclick={(e) => {
											e.stopPropagation();
											removeSetFromFolder(set.id);
										}}
									>
										<Trash2 class="h-4 w-4" />
									</button>
								</div>

								{#if set.description}
									<p class="mb-4 line-clamp-3 text-sm text-surface-600-400">
										{set.description}
									</p>
								{/if}

								<div class="mb-4 flex items-center justify-between text-sm">
									<div class="flex items-center space-x-4">
										<span class="flex items-center space-x-1 text-surface-600-400">
											<FileText class="h-4 w-4" />
											<span>{set.total_cards} cards</span>
										</span>
										{#if set.last_studied_at}
											<span class="text-primary-500">Recently studied</span>
										{/if}
									</div>
								</div>

								<div class="mb-4 text-xs text-surface-500">
									Created {new Date(set.created_at).toLocaleDateString('en-US', {
										year: 'numeric',
										month: 'short',
										day: 'numeric'
									})}
								</div>

								<div class="flex space-x-2">
									<button
										class="group-hover:preset-soft-primary-500 btn flex-1 preset-tonal-surface btn-sm transition-all"
										onclick={(e) => {
											e.stopPropagation();
											goToSet(set.id);
										}}
									>
										View
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
			<p class="text-center text-sm text-surface-600-400">
				The flashcard set will be moved to "No folder" but won't be deleted.
			</p>

			<div class="flex space-x-3 pt-4">
				<button class="btn flex-1 preset-tonal-surface" onclick={() => (showRemoveModal = false)}>
					Cancel
				</button>
				<button class="preset-filled-warning-500-900 btn flex-1" onclick={confirmRemoveSet}>
					Remove
				</button>
			</div>
		</div>
	{/snippet}
</Modal>

<!-- Edit Folder Modal -->
<CreateFolderModal
	bind:show={showEditModal}
	editMode={true}
	folderData={$currentFolder}
	on:update={handleUpdateFolder}
/>
