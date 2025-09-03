<script>
	import { FolderPlus, Folder, MoreVertical, Edit, Trash2, FileText } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { folders, folderActions } from '$lib/stores/flashcards.js';
	import { supabase } from '$lib/supabase.js';
	import CreateFolder from '$lib/components/CreateFolder.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { toast } from '$lib/stores/toast.js';

	let showCreateModal = false;
	let showDeleteModal = false;
	let folderToDelete = null;
	let isLoading = true;
	let selectedFolder = null;
	let showDropdown = null;

	onMount(async () => {
		// Get current user
		const {
			data: { user }
		} = await supabase.auth.getUser();

		if (!user) {
			goto('/login');
			return;
		}

		// Load folders
		await folderActions.loadFolders(user.id);
		isLoading = false;
	});

	async function handleCreateFolder(event) {
		const folderData = event.detail;

		try {
			const {
				data: { user }
			} = await supabase.auth.getUser();
			if (!user) {
				toast.error('Please login first!');
				return;
			}

			await folderActions.createFolder(folderData, user.id);
			showCreateModal = false;
		} catch (error) {
			toast.error('Failed to create folder: ' + error.message);
		}
	}

	async function deleteFolder(folderId) {
		// Show delete modal instead of confirm
		folderToDelete = $folders.find((f) => f.id === folderId);
		showDeleteModal = true;
	}

	async function confirmDeleteFolder() {
		if (!folderToDelete) return;

		try {
			await folderActions.deleteFolder(folderToDelete.id);
			toast.success('Folder deleted successfully');
		} catch (error) {
			toast.error('Failed to delete folder: ' + error.message);
		} finally {
			showDeleteModal = false;
			folderToDelete = null;
		}
	}

	function openFolder(folderId) {
		goto(`/folders/${folderId}`);
	}

	function toggleDropdown(folderId) {
		showDropdown = showDropdown === folderId ? null : folderId;
	}
</script>

<svelte:head>
	<title>Your Folders</title>
</svelte:head>

<div class="min-h-screen bg-surface-50-950 p-6">
	<div class="mx-auto max-w-5xl">
		<!-- Header -->
		<div class="mb-8 flex items-center justify-between">
			<h1 class="text-3xl font-bold">Folders</h1>
			<button class="preset-filled-primary-500-900 btn" onclick={() => (showCreateModal = true)}>
				<FolderPlus class="h-5 w-5" />
				<span>Create folder</span>
			</button>
		</div>

		{#if isLoading}
			<!-- Loading State -->
			<div class="py-16 text-center">
				<div class="mx-auto mb-4 placeholder animate-pulse"></div>
				<p class="text-surface-600-400">Loading folders...</p>
			</div>
		{:else if $folders.length === 0}
			<!-- Empty State -->
			<div class="py-16 text-center">
				<div class="mb-8">
					<!-- Folder Icon -->
					<div
						class="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-2xl bg-surface-200-800"
					>
						<Folder class="h-12 w-12 text-surface-600-400" />
					</div>
				</div>

				<h2 class="mb-4 text-2xl font-semibold">You don't have any folders yet</h2>
				<p class="mx-auto mb-8 max-w-md text-surface-600-400">
					Folders help you organize flashcard sets and practice tests
				</p>

				<button class="preset-filled-primary-500-900 btn" onclick={() => (showCreateModal = true)}>
					<FolderPlus class="h-5 w-5" />
					<span>Create folder</span>
				</button>
			</div>
		{:else}
			<!-- Folders Grid -->
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each $folders as folder}
					<div
						class="preset-ghost-neutral-500-900 hover:preset-soft-neutral-500-900 card transition-all"
					>
						<div class="p-6">
							<!-- Folder Header -->
							<div class="mb-4 flex items-start justify-between">
								<button
									class="flex flex-1 items-center space-x-3 text-left"
									onclick={() => openFolder(folder.id)}
								>
									<div
										class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg"
										style="background-color: {folder.color}"
									>
										<Folder class="h-6 w-6 text-white" />
									</div>
									<div class="min-w-0">
										<h3 class="truncate font-semibold">{folder.name}</h3>
										{#if folder.description}
											<p class="truncate text-sm text-surface-600-400">
												{folder.description}
											</p>
										{/if}
									</div>
								</button>

								<!-- Dropdown Menu -->
								<div class="relative">
									<button
										class="preset-ghost-neutral-500-900 btn-icon btn-icon-sm"
										onclick={(e) => {
											e.stopPropagation();
											toggleDropdown(folder.id);
										}}
									>
										<MoreVertical class="h-4 w-4" />
									</button>

									{#if showDropdown === folder.id}
										<div
											class="preset-filled-neutral-500-900 absolute right-0 z-10 mt-2 w-48 card shadow-xl"
										>
											<nav class="list-nav p-2">
												<button
													class="preset-ghost-neutral-500-900 btn w-full justify-start btn-sm"
													onclick={() => {
														// TODO: Implement edit
														showDropdown = null;
													}}
												>
													<Edit class="h-4 w-4" />
													<span>Edit</span>
												</button>
												<button
													class="preset-ghost-neutral-500-900 btn w-full justify-start btn-sm text-error-500"
													onclick={() => {
														deleteFolder(folder.id);
														showDropdown = null;
													}}
												>
													<Trash2 class="h-4 w-4" />
													<span>Delete</span>
												</button>
											</nav>
										</div>
									{/if}
								</div>
							</div>

							<!-- Folder Stats -->
							<div class="flex items-center justify-between text-sm text-surface-600-400">
								<div class="flex items-center space-x-1">
									<FileText class="h-4 w-4" />
									<span>{folder.flashcard_sets?.length || 0} sets</span>
								</div>
								<span>
									{new Date(folder.created_at).toLocaleDateString('en-US')}
								</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Create Folder Modal -->
<CreateFolder bind:show={showCreateModal} on:create={handleCreateFolder} />

<!-- Delete Confirmation Modal -->
<Modal bind:showModal={showDeleteModal} size="sm" title="Delete Folder">
	{#snippet children()}
		<div class="space-y-4">
			<p class="text-center">
				Are you sure you want to delete the folder
				<span class="font-semibold text-primary-500">"{folderToDelete?.name}"</span>?
			</p>
			<p class="text-center text-sm text-surface-600-400">
				This action cannot be undone. All flashcard sets in this folder will be moved to "No
				folder".
			</p>

			<div class="flex space-x-3 pt-4">
				<button
					class="preset-ghost-neutral-500-900 btn flex-1"
					onclick={() => (showDeleteModal = false)}
				>
					Cancel
				</button>
				<button class="preset-filled-error-500-900 btn flex-1" onclick={confirmDeleteFolder}>
					Delete
				</button>
			</div>
		</div>
	{/snippet}
</Modal>

<!-- Click outside to close dropdown -->
{#if showDropdown}
	<div
		class="fixed inset-0 z-0"
		onclick={() => (showDropdown = null)}
		onkeydown={() => {}}
		role="button"
		tabindex="-1"
	></div>
{/if}
