<script>
	import { Search, User, Plus, Menu, LogOut } from 'lucide-svelte';
	import { sidebarExpanded } from '$lib/stores/sidebar.js';
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import { supabase } from '$lib/supabase.js';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let user = null;

	function toggleSidebar() {
		sidebarExpanded.update((expanded) => !expanded);
	}

	onMount(async () => {
		// Get current user
		const {
			data: { user: currentUser }
		} = await supabase.auth.getUser();
		user = currentUser;

		// Listen for auth changes
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((event, session) => {
			user = session?.user || null;
		});

		return () => subscription.unsubscribe();
	});

	async function handleLogout() {
		await supabase.auth.signOut();
		goto('/login');
	}
</script>

<header class="bg-surface-100-800-token border-surface-300-600-token border-b px-4 py-4">
	<div class="flex w-full items-center justify-between">
		<!-- Logo, Toggle, dan Brand -->
		<div class="flex items-center space-x-3">
			<!-- Sidebar Toggle Button -->
			<button
				class="variant-ghost-surface btn btn-lg"
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
				<span class="text-surface-900-50-token hidden text-xl font-bold sm:block">Quizcard</span>
			</div>
		</div>

		<!-- Search Bar -->
		<div class="mx-8 max-w-xl flex-1">
			<div class="input-group-divider input-group grid-cols-[auto_1fr_auto]">
				<div class="input-group-shim ig-cell">
					<Search class="h-4 w-4" />
				</div>
				<input
					type="search"
					placeholder="Search for flashcards, textbooks, questions"
					class="input"
					disabled
				/>
			</div>
		</div>

		<!-- User Actions -->
		<div class="flex items-center space-x-2">
			{#if user}
				<a href="/create" class="variant-ghost-surface btn btn-sm" aria-label="Tambah konten">
					<Plus class="h-5 w-5" />
				</a>

				<div class="relative">
					<button class="variant-ghost-surface btn btn-sm" aria-label="Profil pengguna">
						{#if user.user_metadata?.avatar_url}
							<Avatar src={user.user_metadata.avatar_url} width="w-8" />
						{:else}
							<User class="h-5 w-5" />
						{/if}
					</button>

					<!-- Dropdown menu (you can add this later) -->
				</div>

				<button
					class="variant-ghost-surface btn btn-sm"
					on:click={handleLogout}
					aria-label="Logout"
				>
					<LogOut class="h-5 w-5" />
				</button>
			{:else}
				<a href="/login" class="variant-ghost-surface btn btn-sm"> Sign In </a>
				<a href="/signup" class="variant-filled-primary btn btn-sm"> Register </a>
			{/if}
		</div>
	</div>
</header>
