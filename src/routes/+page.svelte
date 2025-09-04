<script>
	import { FolderOpen, Book, BarChart3, Plus, Eye, MoreVertical, Folder } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import {
		flashcardActions,
		recentActivities,
		folders,
		folderActions
	} from '$lib/stores/flashcards.js';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase.js';
	import { toast } from '$lib/stores/toast.js';

	let showDropdown = $state(null);
	let showMoveToFolderModal = $state(false);
	let selectedSetId = null;
	let selectedFolderId = $state(null);
	let isLoading = $state(true);

	onMount(async () => {
		try {
			isLoading = true;
			// Load recent activities when page loads
			await flashcardActions.loadRecentActivities();

			// Load folders
			const {
				data: { user }
			} = await supabase.auth.getUser();
			if (user) {
				await folderActions.loadFolders(user.id);
			}
		} finally {
			isLoading = false;
		}
	});

	function toggleDropdown(setId) {
		showDropdown = showDropdown === setId ? null : setId;
	}

	function openMoveToFolder(setId) {
		selectedSetId = setId;
		selectedFolderId = null;
		showMoveToFolderModal = true;
		showDropdown = null;
	}

	async function moveToFolder() {
		if (!selectedSetId || !selectedFolderId) {
			toast.error('Selection Required', 'Please select a destination folder');
			return;
		}

		try {
			await folderActions.addSetToFolder(selectedSetId, selectedFolderId);
			await flashcardActions.loadRecentActivities();

			toast.success('Moved Successfully', 'Flashcard set moved to folder');
			showMoveToFolderModal = false;
		} catch (error) {
			toast.error('Move Failed', 'Failed to move set: ' + error.message);
		}
	}

	function closeModal() {
		showMoveToFolderModal = false;
	}

	function closeDropdown() {
		showDropdown = null;
	}
</script>

<svelte:head>
	<title>Quizcard</title>
	<meta name="description" content="Quizcard - Interactive learning platform" />
</svelte:head>

<div class="bg-surface-50-950 p-6">
	<div class="mx-auto max-w-5xl">
		<!-- Popular Content Section -->
		<div class="mt-12">
			<h3 class="mb-6 text-xl font-semibold">Recents</h3>

			{#if isLoading}
				<!-- Skeleton Loading for Recent Activities -->
				<div class="space-y-4">
					{#each Array(6) as _}
						<div class="card preset-tonal-surface p-4">
							<div class="flex items-center space-x-4">
								<div class="h-12 w-12 animate-pulse rounded bg-surface-300-700"></div>
								<div class="flex-1 space-y-2">
									<div class="h-5 w-3/4 animate-pulse rounded bg-surface-300-700"></div>
									<div class="h-4 w-1/2 animate-pulse rounded bg-surface-300-700"></div>
									<div class="h-3 w-full animate-pulse rounded bg-surface-300-700"></div>
								</div>
								<div class="flex items-center space-x-2">
									<div class="h-4 w-16 animate-pulse rounded bg-surface-300-700"></div>
									<div class="h-8 w-8 animate-pulse rounded bg-surface-300-700"></div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else if $recentActivities && $recentActivities.length > 0}
				<div class="space-y-4">
					{#each $recentActivities as activity}
						<div class="card preset-tonal-surface p-4">
							<div class="flex items-center space-x-4">
								<div class="flex h-12 w-12 items-center justify-center rounded bg-primary-500">
									<Book class="h-6 w-6 text-white" />
								</div>
								<div class="flex-1">
									<h4 class="font-semibold">
										{activity.title}
									</h4>
									<p class="text-sm opacity-75">
										{activity.total_cards} cards • {activity.users?.full_name || 'Anonymous'}
									</p>
									{#if activity.description}
										<p class="mt-1 text-sm opacity-60">{activity.description}</p>
									{/if}
								</div>
								<div class="flex items-center space-x-2">
									<span class="text-xs opacity-60">
										{new Date(activity.last_studied_at || activity.created_at).toLocaleDateString(
											'en-US'
										)}
									</span>

									<!-- Dropdown Menu -->
									<div class="relative">
										<button
											class="btn-icon btn-icon-sm preset-tonal-surface"
											onclick={() => toggleDropdown(activity.id)}
										>
											<MoreVertical class="h-4 w-4" />
										</button>

										{#if showDropdown === activity.id}
											<div
												class="absolute right-0 z-10 mt-2 w-48 card preset-tonal-surface shadow-xl"
											>
												<nav class="list-nav p-2">
													<button
														class="btn w-full justify-start preset-tonal-surface btn-sm"
														onclick={() => goto(`/quiz/${activity.id}`)}
													>
														<Eye class="h-4 w-4" />
														<span>View</span>
													</button>
													<button
														class="btn w-full justify-start preset-tonal-surface btn-sm"
														onclick={() => openMoveToFolder(activity.id)}
													>
														<Folder class="h-4 w-4" />
														<span>Move to Folder</span>
													</button>
												</nav>
											</div>
										{/if}
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="card preset-tonal-surface p-8 text-center">
					<Book class="mx-auto mb-4 h-12 w-12 opacity-30" />
					<h4 class="mb-2 font-semibold">There are no recent activities</h4>
					<p class="mb-4 text-sm opacity-75">
						Start creating or studying flashcards to see recent activities
					</p>
					<a href="/create" class="btn preset-tonal">
						<Plus class="h-4 w-4" />
						<span>Create Flashcards</span>
					</a>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Move to Folder Modal -->
{#if showMoveToFolderModal}
	<div
		class="fixed inset-0 z-40 bg-surface-50-950"
		onclick={closeModal}
		role="button"
		tabindex="-1"
		onkeydown={(e) => e.key === 'Escape' && closeModal()}
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="rounded-container bg-surface-100-900 shadow-xl">
				<div class="p-6">
					<h3 class="mb-4 text-xl font-bold">Move to Folder</h3>

					<label class="label">
						<span>Select destination folder</span>
						<select class="select" bind:value={selectedFolderId}>
							<option value={null}>-- Select Folder --</option>
							{#each $folders as folder}
								<option value={folder.id}>{folder.name}</option>
							{/each}
						</select>
					</label>

					{#if $folders.length === 0}
						<p class="mt-2 text-sm text-surface-600-400">
							No folders yet. <a href="/folders" class="text-primary-500">Create a new folder</a>
						</p>
					{/if}

					<div class="mt-6 flex justify-end space-x-2">
						<button class="btn preset-tonal-surface" onclick={closeModal}> Cancel </button>
						<button class="btn preset-tonal" onclick={moveToFolder} disabled={!selectedFolderId}>
							Move
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Click outside to close dropdown -->
{#if showDropdown}
	<div
		class="fixed inset-0 z-0"
		onclick={closeDropdown}
		onkeydown={() => {}}
		role="button"
		tabindex="-1"
	></div>
{/if}
