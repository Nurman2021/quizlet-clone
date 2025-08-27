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
		SettingsIcon,
		FolderSearchIcon
	} from 'lucide-svelte';
	import { sidebarExpanded } from '$lib/stores/sidebar.js';

	function toggleExpanded() {
		sidebarExpanded.update((expanded) => !expanded);
	}
</script>

<div class="bg-surface-100-800-token h-full">
	<Navigation.Rail expanded={$sidebarExpanded}>
		{#snippet tiles()}
			<!-- Main Navigation -->
			<Navigation.Tile labelExpanded="Home" href="/">
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

			<Navigation.Tile labelExpanded="Your Folders" href="/folders">
				<BookIcon />
			</Navigation.Tile>

			<!-- Separator -->
			{#if $sidebarExpanded}
				<div class="border-surface-300-600-token mt-4 w-full border-t px-4 py-2">
					<p class="text-surface-600-300-token my-4 text-xs font-semibold tracking-wider uppercase">
						Start here
					</p>
				</div>
			{/if}

			<!-- Start here Section -->
			<Navigation.Tile labelExpanded="Flashcard" href="/create">
				<ZapIcon />
			</Navigation.Tile>
		{/snippet}

		{#snippet footer()}
			<Navigation.Tile labelExpanded="Settings" href="/" title="Settings">
				<SettingsIcon />
			</Navigation.Tile>
		{/snippet}
	</Navigation.Rail>
</div>
