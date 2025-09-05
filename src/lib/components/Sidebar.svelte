<script>
	import { Navigation } from '@skeletonlabs/skeleton-svelte';
	import { MenuIcon, HomeIcon, FolderOpenIcon, SettingsIcon } from 'lucide-svelte';
	import { sidebarExpanded } from '$lib/stores/sidebar.js';
	import CardIcon from './CardIcon.svelte';

	function toggleExpanded() {
		sidebarExpanded.update((expanded) => !expanded);
	}
</script>

<div class="h-full bg-surface-100-900">
	<Navigation.Rail expanded={$sidebarExpanded}>
		{#snippet tiles()}
			<!-- Main Navigation -->
			<Navigation.Tile labelExpanded="Home" href="/">
				<HomeIcon />
			</Navigation.Tile>

			<!-- Separator -->
			{#if $sidebarExpanded}
				<div class="mt-4 w-full border-t border-surface-300-700 px-4 py-2">
					<p class="my-4 text-xs font-semibold tracking-wider text-surface-600-400 uppercase">
						Your Subjects
					</p>
				</div>
			{/if}

			<Navigation.Tile labelExpanded="Your Folders" href="/folders">
				<FolderOpenIcon />
			</Navigation.Tile>

			<!-- Separator -->
			{#if $sidebarExpanded}
				<div class="mt-4 w-full border-t border-surface-300-700 px-4 py-2">
					<p class="my-4 text-xs font-semibold tracking-wider text-surface-600-400 uppercase">
						Start here
					</p>
				</div>
			{/if}

			<!-- Start here Section -->
			<Navigation.Tile labelExpanded="Flashcard" href="/create">
				<CardIcon size="auto" className="h-6 w-6" />
			</Navigation.Tile>
		{/snippet}

		{#snippet footer()}
			<Navigation.Tile labelExpanded="Settings" href="/settings" title="Settings">
				<SettingsIcon />
			</Navigation.Tile>
		{/snippet}
	</Navigation.Rail>
</div>
