<script>
	import { Search, User, Plus, Menu, LogOut } from 'lucide-svelte';
	import { sidebarExpanded } from '$lib/stores/sidebar.js';
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
			console.log('Auth state changed:', event, session?.user);
			user = session?.user || null;
		});

		return () => subscription.unsubscribe();
	});

	async function handleLogout() {
		await supabase.auth.signOut();
		goto('/login');
	}

	// Helper function to safely get avatar URL
	$: avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
	$: userDisplayName =
		user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'User';
</script>

<header class="border-b border-surface-300-700 preset-tonal-surface px-4 py-4">
	<div class="flex w-full items-center justify-between">
		<!-- Logo, Toggle, dan Brand -->
		<div class="flex items-center space-x-3">
			<!-- Sidebar Toggle Button -->
			<button
				class="btn preset-tonal-surface btn-lg"
				onclick={toggleSidebar}
				aria-label="Toggle sidebar"
			>
				<Menu class="h-8 w-8" />
			</button>

			<!-- Logo -->
			<div class="flex items-center space-x-2">
				<div class="flex h-8 w-8 items-center justify-center rounded bg-primary-500">
					<span class="text-lg font-bold text-white">Q</span>
				</div>
				<span class="hidden text-xl font-bold text-surface-900-100 sm:block">Quizcard</span>
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
				<a href="/create" class="btn preset-tonal-surface btn-sm" aria-label="Add content">
					<Plus class="h-5 w-5" />
				</a>

				<div class="relative">
					<button class="btn preset-tonal-surface btn-sm" aria-label="User profile">
						{#if avatarUrl}
							<img
								src={avatarUrl}
								alt="User avatar"
								class="h-8 w-8 rounded-full object-cover"
								onerror={(e) => (e.target.style.display = 'none')}
							/>
						{:else}
							<div
								class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-sm font-medium text-white"
							>
								{userDisplayName.charAt(0).toUpperCase()}
							</div>
						{/if}
					</button>

					<!-- Dropdown menu (you can add this later) -->
				</div>

				<button class="btn preset-tonal-surface btn-sm" onclick={handleLogout} aria-label="Logout">
					<LogOut class="h-5 w-5" />
				</button>
			{:else}
				<a href="/login" class="btn preset-tonal-surface btn-sm"> Sign In </a>
				<a href="/signup" class="btn preset-tonal-success btn-sm"> Register </a>
			{/if}
		</div>
	</div>
</header>
