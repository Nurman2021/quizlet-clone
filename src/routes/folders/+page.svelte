<script>
	import { FolderPlus, Folder, MoreVertical, Edit, Trash2, FileText } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { folders, folderActions } from '$lib/stores/flashcards.js';
	import { supabase } from '$lib/supabase.js';
	import CreateFolderModal from '$lib/components/CreateFolderModal.svelte';
	import { toast } from '$lib/stores/toast.js';

	let showCreateModal = false;
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
		if (!confirm('Are you sure you want to delete this folder?')) {
			return;
		}

		try {
			await folderActions.deleteFolder(folderId);
		} catch (error) {
			toast.error('Failed to delete folder: ' + error.message);
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

<div class="bg-surface-50-900-token min-h-screen p-6">
	<div class="mx-auto max-w-5xl">
		<!-- Header -->
		<div class="mb-8 flex items-center justify-between">
			<h1 class="text-3xl font-bold">Folders</h1>
			<button class="variant-filled-primary btn" on:click={() => (showCreateModal = true)}>
				<FolderPlus class="h-5 w-5" />
				<span>Create folder</span>
			</button>
		</div>

		{#if isLoading}
			<!-- Loading State -->
			<div class="py-16 text-center">
				<div class="mx-auto mb-4 placeholder animate-pulse"></div>
				<p class="text-surface-600-300-token">Loading folders...</p>
			</div>
		{:else if $folders.length === 0}
			<!-- Empty State -->
			<div class="py-16 text-center">
				<div class="mb-8">
					<!-- Folder Icon -->
					<div
						class="bg-surface-200-700-token mb-6 inline-flex h-24 w-24 items-center justify-center rounded-2xl"
					>
						<Folder class="text-surface-600-300-token h-12 w-12" />
					</div>
				</div>

				<h2 class="mb-4 text-2xl font-semibold">You don't have any folders yet</h2>
				<p class="text-surface-600-300-token mx-auto mb-8 max-w-md">
					Folders help you organize flashcard sets and practice tests
				</p>

				<button class="variant-filled-primary btn" on:click={() => (showCreateModal = true)}>
					<FolderPlus class="h-5 w-5" />
					<span>Create folder</span>
				</button>
			</div>
		{:else}
			<!-- Folders Grid -->
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each $folders as folder}
					<div class="variant-ghost-surface hover:variant-soft-surface card transition-all">
						<div class="p-6">
							<!-- Folder Header -->
							<div class="mb-4 flex items-start justify-between">
								<button
									class="flex flex-1 items-center space-x-3 text-left"
									on:click={() => openFolder(folder.id)}
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
											<p class="text-surface-600-300-token truncate text-sm">
												{folder.description}
											</p>
										{/if}
									</div>
								</button>

								<!-- Dropdown Menu -->
								<div class="relative">
									<button
										class="variant-ghost-surface btn-icon btn-icon-sm"
										on:click|stopPropagation={() => toggleDropdown(folder.id)}
									>
										<MoreVertical class="h-4 w-4" />
									</button>

									{#if showDropdown === folder.id}
										<div
											class="variant-filled-surface absolute right-0 z-10 mt-2 w-48 card shadow-xl"
										>
											<nav class="list-nav p-2">
												<button
													class="variant-ghost-surface btn w-full justify-start btn-sm"
													on:click={() => {
														// TODO: Implement edit
														showDropdown = null;
													}}
												>
													<Edit class="h-4 w-4" />
													<span>Edit</span>
												</button>
												<button
													class="variant-ghost-surface btn w-full justify-start btn-sm text-error-500"
													on:click={() => {
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
							<div class="text-surface-600-300-token flex items-center justify-between text-sm">
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
<CreateFolderModal bind:show={showCreateModal} on:create={handleCreateFolder} />

<!-- Click outside to close dropdown -->
{#if showDropdown}
	<div
		class="fixed inset-0 z-0"
		on:click={() => (showDropdown = null)}
		on:keydown={() => {}}
		role="button"
		tabindex="-1"
	></div>
{/if}
