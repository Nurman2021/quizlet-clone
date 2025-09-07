<script>
	import { FolderPlus, Folder, FileText } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { folders, folderActions } from '$lib/stores/flashcards.js';
	import { supabase } from '$lib/supabase.js';
	import CreateFolder from '$lib/components/CreateFolder.svelte';
	import { toast } from '$lib/stores/toast.js';

	let showCreateModal = false;
	let isLoading = true;

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

	function openFolder(folderId) {
		goto(`/folders/${folderId}`);
	}
</script>

<svelte:head>
	<title>Your Folders</title>
</svelte:head>

<div class="min-h-screen bg-surface-50-950 p-6">
	<div class="mx-auto max-w-4xl">
		<!-- Header -->
		<div class="mb-8 flex items-center justify-between">
			<h1 class="text-3xl font-bold">Folders</h1>
			<button class="btn preset-filled-primary-100-900" onclick={() => (showCreateModal = true)}>
				<FolderPlus class="h-5 w-5" />
				<span>Create folder</span>
			</button>
		</div>

		{#if isLoading}
			<!-- Simplified Skeleton Loading State -->
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each Array(6) as _}
					<div class="animate-pulse card p-6">
						<!-- Folder Icon & Title -->
						<div class="mb-4 flex items-center space-x-3">
							<div class="h-12 w-12 rounded-lg bg-surface-300-700"></div>
							<div class="flex-1 space-y-2">
								<div class="h-5 w-3/4 rounded bg-surface-300-700"></div>
								<div class="h-4 w-1/2 rounded bg-surface-300-700"></div>
							</div>
						</div>

						<!-- Content Area -->
						<div class="mb-4 space-y-3">
							<div class="h-4 w-full rounded bg-surface-300-700"></div>
							<div class="h-4 w-2/3 rounded bg-surface-300-700"></div>
						</div>

						<!-- Stats -->
						<div class="flex justify-between border-t border-surface-200-800 pt-4">
							<div class="h-4 w-16 rounded bg-surface-300-700"></div>
							<div class="h-4 w-20 rounded bg-surface-300-700"></div>
						</div>
					</div>
				{/each}
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

				<button class="btn preset-filled-primary-100-900" onclick={() => (showCreateModal = true)}>
					<FolderPlus class="h-5 w-5" />
					<span>Create folder</span>
				</button>
			</div>
		{:else}
			<!-- Folders Grid -->
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each $folders as folder}
					<div
						class="group cursor-pointer card preset-tonal-surface transition-all hover:preset-tonal"
						role="button"
						tabindex="0"
						onclick={() => openFolder(folder.id)}
						onkeydown={(e) => e.key === 'Enter' && openFolder(folder.id)}
					>
						<div class="p-6">
							<!-- Folder Header -->
							<div class="mb-4 flex items-center space-x-3">
								<div
									class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
									style="background-color: {folder.color}"
								>
									<Folder class="h-6 w-6 text-white" />
								</div>
								<div class="min-w-0 flex-1">
									<h3 class="truncate font-semibold transition-colors group-hover:text-primary-500">
										{folder.name}
									</h3>
									{#if folder.description}
										<p class="truncate text-sm text-surface-600-400">
											{folder.description}
										</p>
									{/if}
								</div>
							</div>

							<!-- Folder Content Preview -->
							{#if folder.flashcard_sets && folder.flashcard_sets.length > 0}
								<div class="mb-4 space-y-2">
									<p class="text-xs tracking-wide text-surface-500 uppercase">Recent Sets</p>
									<div class="space-y-1">
										{#each folder.flashcard_sets.slice(0, 3) as set}
											<div class="flex items-center space-x-2 text-sm">
												<div class="h-1.5 w-1.5 rounded-full bg-surface-400"></div>
												<span class="truncate text-surface-600-400">{set.title}</span>
												<span class="text-xs text-surface-500">({set.total_cards || 0})</span>
											</div>
										{/each}
										{#if folder.flashcard_sets.length > 3}
											<p class="text-xs text-surface-500">
												+{folder.flashcard_sets.length - 3} more sets
											</p>
										{/if}
									</div>
								</div>
							{:else}
								<div class="mb-4 py-4 text-center">
									<p class="text-sm text-surface-500">No sets yet</p>
								</div>
							{/if}

							<!-- Folder Stats -->
							<div
								class="flex items-center justify-between border-t border-surface-200-800 pt-4 text-sm text-surface-600-400"
							>
								<div class="flex items-center space-x-1">
									<FileText class="h-4 w-4" />
									<span>{folder.flashcard_sets?.length || 0} sets</span>
								</div>
								<span>
									{new Date(folder.created_at).toLocaleDateString('en-US', {
										month: 'short',
										day: 'numeric'
									})}
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
