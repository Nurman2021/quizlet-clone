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

	let { children } = $props();
	let isExpanded = $state(true);

	function toggleExpanded() {
		isExpanded = !isExpanded;
	}
</script>

<div class="grid h-[100vh] w-full grid-cols-[auto_1fr] card border-[1px] border-surface-100-900">
	<!-- Navigation Component -->
	<Navigation.Rail expanded={isExpanded}>
		{#snippet header()}
			<Navigation.Tile labelExpanded="Menu" onclick={toggleExpanded} title="Toggle Menu Width">
				<MenuIcon />
			</Navigation.Tile>
		{/snippet}

		{#snippet tiles()}
			<!-- Main Navigation -->
			<Navigation.Tile labelExpanded="Beranda" href="/">
				<HomeIcon />
			</Navigation.Tile>
			<Navigation.Tile labelExpanded="Perpustakaan Anda" href="/library">
				<LibraryIcon />
			</Navigation.Tile>
			<Navigation.Tile labelExpanded="Pemberitahuan" href="/notifications">
				<BellIcon />
			</Navigation.Tile>

			<!-- Separator -->
			{#if isExpanded}
				<div class="border-surface-300-600-token mt-4 border-t px-4 py-2">
					<p class="text-surface-600-300-token mb-2 text-xs font-semibold tracking-wider uppercase">
						Pelajaran Anda
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
			{#if isExpanded}
				<div class="border-surface-300-600-token mt-4 border-t px-4 py-2">
					<p class="text-surface-600-300-token mb-2 text-xs font-semibold tracking-wider uppercase">
						Mulai di sini
					</p>
				</div>
			{/if}

			<!-- Mulai di sini Section -->
			<Navigation.Tile labelExpanded="Flashcard" href="/flashcards">
				<ZapIcon />
			</Navigation.Tile>
			<Navigation.Tile labelExpanded="Solusi yang dive..." href="/solutions">
				<BookOpenIcon />
			</Navigation.Tile>
		{/snippet}

		{#snippet footer()}
			<Navigation.Tile labelExpanded="Settings" href="/settings" title="Settings">
				<SettingsIcon />
			</Navigation.Tile>
		{/snippet}
	</Navigation.Rail>

	<!-- Content -->
	<div class="flex-1 overflow-hidden">
		{@render children()}
	</div>
</div>
