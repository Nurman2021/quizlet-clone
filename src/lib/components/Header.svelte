<script>
	import { Search, User, Plus, Menu, LogOut, Settings, ChevronDown } from 'lucide-svelte';
	import { sidebarExpanded } from '$lib/stores/sidebar.js';
	import { supabase } from '$lib/supabase.js';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { clickOutside } from '$lib/utils/clickOutside.js';
	import Avatar from './Avatar.svelte';
	import { userProfile, loadUserProfile } from '$lib/stores/user.js';

	let user = null;
	let showUserMenu = false;

	// Use store for user profile
	$: currentUserProfile = $userProfile;

	function toggleSidebar() {
		sidebarExpanded.update((expanded) => !expanded);
	}

	// Listen for auth changes with debouncing
	let authChangeTimeout;
	onMount(async () => {
		// Get current user
		const {
			data: { user: currentUser }
		} = await supabase.auth.getUser();
		user = currentUser;

		// Load user profile if user exists (store will handle caching)
		if (currentUser) {
			await loadUserProfile();
		}

		// Listen for auth changes
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			console.log('Header: Auth state changed:', event, session?.user);

			// Clear previous timeout
			if (authChangeTimeout) {
				clearTimeout(authChangeTimeout);
			}

			// Debounce auth state changes
			authChangeTimeout = setTimeout(async () => {
				user = session?.user || null;

				// Force refresh profile data if user signed in
				if (event === 'SIGNED_IN' && session?.user) {
					await loadUserProfile(true);
				}
			}, 100);
		});

		return () => {
			subscription.unsubscribe();
			if (authChangeTimeout) {
				clearTimeout(authChangeTimeout);
			}
		};
	});

	async function handleLogout() {
		await supabase.auth.signOut();
		goto('/login');
	}

	function toggleUserMenu() {
		showUserMenu = !showUserMenu;
	}

	function closeUserMenu() {
		showUserMenu = false;
	}
</script>

<header class="border-b border-surface-300-700 preset-tonal-surface px-4 py-4">
	<div class="flex w-full items-center justify-between">
		<!-- Logo, Toggle, dan Brand -->
		<div class="flex items-center space-x-3">
			<!-- Sidebar Toggle Button -->
			<button
				class="btn preset-tonal-surface btn-lg"
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

				<div class="relative" use:clickOutside={closeUserMenu}>
					<button
						class="btn flex items-center space-x-2 preset-tonal-surface btn-sm"
						on:click={toggleUserMenu}
						aria-label="User profile menu"
					>
						<Avatar user={currentUserProfile} size="sm" />
						<ChevronDown
							class="h-4 w-4 transition-transform duration-200 {showUserMenu ? 'rotate-180' : ''}"
						/>
					</button>

					<!-- Dropdown Menu -->
					{#if showUserMenu}
						<div
							class="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-surface-300-700 bg-surface-100-900 py-2 shadow-lg"
						>
							<div class="border-b border-surface-300-700 px-4 py-2">
								<p class="truncate text-sm font-medium">
									{currentUserProfile?.display_name ||
										currentUserProfile?.full_name ||
										user.email?.split('@')[0] ||
										'User'}
								</p>
								<p class="truncate text-xs text-surface-500">{user.email}</p>
							</div>

							<a
								href="/settings"
								class="flex items-center space-x-2 px-4 py-2 text-sm transition-colors hover:bg-surface-200-800"
								on:click={closeUserMenu}
							>
								<Settings class="h-4 w-4" />
								<span>Settings</span>
							</a>

							<button
								class="flex w-full items-center space-x-2 px-4 py-2 text-left text-sm transition-colors hover:bg-surface-200-800"
								on:click={() => {
									closeUserMenu();
									handleLogout();
								}}
							>
								<LogOut class="h-4 w-4" />
								<span>Sign Out</span>
							</button>
						</div>
					{/if}
				</div>
			{:else}
				<a href="/login" class="btn preset-tonal-surface btn-sm"> Sign In </a>
				<a href="/signup" class="btn preset-tonal-success btn-sm"> Register </a>
			{/if}
		</div>
	</div>
</header>
