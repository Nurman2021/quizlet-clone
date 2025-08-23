<script>
	import { Navigation } from '@skeletonlabs/skeleton-svelte';
	import {
		MenuIcon,
		HomeIcon,
		LibraryIcon,
		BellIcon,
		BookIcon,
		FolderPlusIcon,
		ZapIcon,
		BookOpenIcon,
		SettingsIcon
	} from 'lucide-svelte';
	import { sidebarExpanded } from '$lib/stores/sidebar.js';

	let { children } = $props();
	function toggleExpanded() {
		sidebarExpanded.update((expanded) => !expanded);
	}
</script>

<div class="grid h-full w-full grid-cols-[auto_1fr] card border-[1px] border-surface-100-900">
	<!-- Navigation Component -->
	<Navigation.Rail expanded={$sidebarExpanded}>
		{#snippet tiles()}
			<!-- Main Navigation -->
			<Navigation.Tile labelExpanded="Beranda" href="/">
				<HomeIcon />
			</Navigation.Tile>

			<!-- Separator -->
			{#if $sidebarExpanded}
				<div class="border-surface-300-600-token mt-4 w-full border-t px-4 py-2">
					<p class="text-surface-600-300-token my-4 text-xs font-semibold tracking-wider uppercase">
						Your Subjects
					</p>
				</div>
			{/if}

			<!-- Pelajaran Anda Section -->
			<Navigation.Tile labelExpanded="International En..." href="/international-en">
				<BookIcon />
			</Navigation.Tile>
			<Navigation.Tile labelExpanded="Folder baru" href="/create-folder">
				<FolderPlusIcon />
			</Navigation.Tile>

			<!-- Separator -->
			{#if $sidebarExpanded}
				<div class="border-surface-300-600-token mt-4 w-full border-t px-4 py-2">
					<p class="text-surface-600-300-token my-4 text-xs font-semibold tracking-wider uppercase">
						Start here
					</p>
				</div>
			{/if}

			<!-- Mulai di sini Section -->
			<Navigation.Tile labelExpanded="Flashcard" href="/flashcards">
				<ZapIcon />
			</Navigation.Tile>
		{/snippet}

		{#snippet footer()}
			<Navigation.Tile labelExpanded="Settings" href="/settings" title="Settings">
				<SettingsIcon />
			</Navigation.Tile>
		{/snippet}
	</Navigation.Rail>

	<!-- Content -->
	<div class="flex-1">
		{@render children()}
	</div>
</div>
