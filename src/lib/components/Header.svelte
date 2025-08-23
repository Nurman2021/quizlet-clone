<script>
	import { Search, User, Plus, Menu } from 'lucide-svelte';
	import { sidebarExpanded } from '$lib/stores/sidebar.js';
	import { Avatar } from '@skeletonlabs/skeleton-svelte';

	function toggleSidebar() {
		sidebarExpanded.update((expanded) => !expanded);
	}
</script>

<header class="bg-surface-100-800-token border-surface-300-600-token border-b px-4 py-4">
	<div class="flex w-full items-center justify-between">
		<!-- Logo, Toggle, dan Brand -->
		<div class="flex items-center space-x-3">
			<!-- Sidebar Toggle Button -->
			<button
				class="variant-ghost-surface btn btn-sm"
				on:click={toggleSidebar}
				aria-label="Toggle sidebar"
			>
				<Menu class="h-8 w-8" />
			</button>

			<!-- Logo -->
			<div class="flex items-center space-x-2">
				<div class="flex h-8 w-8 items-center justify-center rounded bg-primary-500">
					<span class="text-lg font-bold text-white">Q</span>
				</div>
				<span class="text-surface-900-50-token hidden text-xl font-bold sm:block">Quizlet</span>
			</div>
		</div>

		<!-- Search Bar -->
		<div class="mx-8 max-w-xl flex-1">
			<div class="input-group-divider input-group grid-cols-[auto_1fr_auto]">
				<div class="input-group-shim">
					<Search class="h-4 w-4" />
				</div>
				<input
					type="search"
					placeholder="Cari flashcard, buku pelajaran, pertanyaan"
					class="input"
				/>
			</div>
		</div>

		<!-- User Actions -->
		<div class="flex items-center space-x-2">
			<a href="/create" class="variant-ghost-surface btn btn-sm" aria-label="Tambah konten">
				<Plus class="h-5 w-5" />
			</a>
			<!-- <button class="variant-ghost-surface btn btn-sm" aria-label="Profil pengguna">
				<User class="h-5 w-5" />
			</button> -->

			<Avatar src="https://i.pravatar.cc/150?img=48" classes="h-8 w-8" name="skeleton" />
		</div>
	</div>
</header>
