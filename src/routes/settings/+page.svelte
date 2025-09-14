<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Camera, Save, User, Mail, Calendar, Check } from 'lucide-svelte';
	import { supabase } from '$lib/supabase.js';
	import { toast } from '$lib/stores/toast.js';
	import { avatarImages, getAvatarUrl, DEFAULT_AVATAR } from '$lib/config/avatars.js';
	import Avatar from '$lib/components/Avatar.svelte';
	import {
		userProfile,
		loadUserProfile,
		updateUserProfile,
		isLoadingProfile
	} from '$lib/stores/user.js';

	// State management - use stores instead of local state
	let isSaving = false;
	let selectedAvatarId = '';
	let displayName = '';
	let email = '';
	let authUser = null;

	// Reactive statements for store data
	$: currentUser = $userProfile;
	$: isLoading = $isLoadingProfile;

	// Create reactive user object for Avatar component preview
	$: previewUser = {
		avatar_id: selectedAvatarId,
		display_name: displayName,
		avatar_url: currentUser?.avatar_url
	};

	// Watch for profile changes and update local state
	$: if (currentUser && !isSaving) {
		// Only update if values are different to prevent loops
		if (selectedAvatarId !== currentUser.avatar_id) {
			selectedAvatarId = currentUser.avatar_id || DEFAULT_AVATAR.id;
		}
		if (displayName !== currentUser.display_name) {
			displayName = currentUser.display_name || '';
		}
	}

	// Load user data on mount
	onMount(async () => {
		await initializeProfile();
	});

	async function initializeProfile() {
		try {
			// Get auth user first
			const {
				data: { user },
				error: authError
			} = await supabase.auth.getUser();

			if (authError || !user) {
				goto('/login');
				return;
			}

			authUser = user;
			email = user.email || '';

			// Load profile using store (with caching)
			const profile = await loadUserProfile();

			if (profile) {
				selectedAvatarId = profile.avatar_id || DEFAULT_AVATAR.id;
				displayName =
					profile.display_name ||
					profile.full_name ||
					user.user_metadata?.full_name ||
					user.email?.split('@')[0] ||
					'';
			} else {
				// Fallback values
				selectedAvatarId = DEFAULT_AVATAR.id;
				displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || '';
			}
		} catch (error) {
			console.error('Error initializing profile:', error);
			toast.error('Failed to load profile: ' + error.message);
		}
	}

	async function saveProfile() {
		try {
			isSaving = true;

			if (!displayName.trim()) {
				toast.error('Display name is required');
				return;
			}

			// Use store function for update
			const updatedProfile = await updateUserProfile({
				display_name: displayName.trim(),
				avatar_id: selectedAvatarId
			});

			// Update local state with saved values
			if (updatedProfile) {
				selectedAvatarId = updatedProfile.avatar_id;
				displayName = updatedProfile.display_name;
			}

			// Force refresh to get updated profile data
			await loadUserProfile(true);

			toast.success('Profile updated successfully!');
		} catch (error) {
			console.error('Error saving profile:', error);
			toast.error('Failed to save profile: ' + error.message);
		} finally {
			isSaving = false;
		}
	}

	function getCurrentAvatarUrl() {
		if (selectedAvatarId) {
			return getAvatarUrl(selectedAvatarId);
		}
		return currentUser?.avatar_url || DEFAULT_AVATAR.url;
	}

	function formatJoinDate(dateString) {
		if (!dateString) return 'Recently';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Settings - Profile</title>
</svelte:head>

<div class="min-h-screen bg-surface-50-950 p-6">
	<div class="mx-auto max-w-4xl">
		<!-- Header -->
		<div class="mb-8">
			<button
				class="mb-4 btn rounded-full preset-outlined-surface-500 text-sm font-semibold"
				on:click={() => goto('/')}
			>
				<span>Back to Home</span>
			</button>

			<h1 class="text-3xl font-bold">Profile Settings</h1>
			<p class="text-surface-600-400">Customize your profile photo and display name</p>
		</div>

		{#if isLoading}
			<!-- Loading Skeleton -->
			<div class="space-y-6">
				<!-- Current Profile Skeleton -->
				<div class="card preset-filled-surface-100-900 p-6">
					<div class="flex items-center space-x-6">
						<div class="h-20 w-20 animate-pulse rounded-full bg-surface-300-700"></div>
						<div class="space-y-3">
							<div class="h-6 w-32 animate-pulse rounded bg-surface-300-700"></div>
							<div class="h-4 w-48 animate-pulse rounded bg-surface-300-700"></div>
							<div class="h-4 w-28 animate-pulse rounded bg-surface-300-700"></div>
						</div>
					</div>
				</div>

				<!-- Form Skeletons -->
				<div class="grid gap-6 lg:grid-cols-2">
					<div class="card preset-filled-surface-100-900 p-6">
						<div class="mb-4 h-6 w-32 animate-pulse rounded bg-surface-300-700"></div>
						<div class="h-10 w-full animate-pulse rounded bg-surface-300-700"></div>
					</div>
					<div class="card preset-filled-surface-100-900 p-6">
						<div class="mb-4 h-6 w-40 animate-pulse rounded bg-surface-300-700"></div>
						<div class="grid grid-cols-3 gap-3">
							{#each Array(6) as _}
								<div class="aspect-square animate-pulse rounded-lg bg-surface-300-700"></div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		{:else if !authUser}
			<!-- Not authenticated -->
			<div class="py-12 text-center">
				<p class="mb-4 text-surface-600-400">You need to be logged in to access settings</p>
				<button class="btn preset-filled-primary-500" on:click={() => goto('/login')}>
					Go to Login
				</button>
			</div>
		{:else}
			<!-- Current Profile Preview -->
			<div class="mb-8 card rounded-xl preset-filled-surface-100-900 p-6">
				<div class="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6">
					<Avatar user={previewUser} size="xl" ring={true} />
					<div class="text-center sm:text-left">
						<h2 class="text-2xl font-bold">{displayName || 'Your Name'}</h2>
						<p class="flex items-center justify-center text-surface-600-400 sm:justify-start">
							<Mail class="mr-2 h-4 w-4" />
							{email}
						</p>
						<p class="flex items-center justify-center text-sm text-surface-500 sm:justify-start">
							<Calendar class="mr-2 h-4 w-4" />
							Joined {formatJoinDate(currentUser?.created_at)}
						</p>
					</div>
				</div>
			</div>

			<form on:submit|preventDefault={saveProfile}>
				<div class="grid gap-6 lg:grid-cols-2">
					<!-- Display Name Section -->
					<div class="card rounded-xl preset-filled-surface-100-900 p-6">
						<h3 class="mb-4 flex items-center text-lg font-semibold">
							<User class="mr-2 h-5 w-5 text-primary-500" />
							Display Name
						</h3>
						<input
							type="text"
							bind:value={displayName}
							placeholder="Enter your display name"
							class="input w-full"
							maxlength="100"
							required
						/>
						<p class="mt-2 text-sm text-surface-500">
							This name will be displayed throughout the app
						</p>
					</div>

					<!-- Avatar Selection Section -->
					<div class="card rounded-xl preset-filled-surface-100-900 p-6">
						<h3 class="mb-4 flex items-center text-lg font-semibold">
							<Camera class="mr-2 h-5 w-5 text-primary-500" />
							Choose Avatar
						</h3>

						<div class="grid grid-cols-3 gap-3">
							{#each avatarImages as avatar}
								<button
									type="button"
									on:click={() => (selectedAvatarId = avatar.id)}
									class="group relative aspect-square overflow-hidden rounded-xl border-2 transition-all duration-200 hover:scale-105 {selectedAvatarId ===
									avatar.id
										? 'border-primary-500 ring-2 ring-primary-500 ring-offset-2 ring-offset-surface-100-900'
										: 'border-surface-300-700 hover:border-surface-400-600'}"
									title={avatar.name}
								>
									<img
										src={avatar.url}
										alt={avatar.name}
										class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-110"
									/>

									<!-- Selected indicator -->
									{#if selectedAvatarId === avatar.id}
										<div
											class="absolute inset-0 flex items-center justify-center bg-primary-500/20"
										>
											<div class="rounded-full bg-primary-500 p-1">
												<Check class="h-4 w-4 text-white" />
											</div>
										</div>
									{/if}

									<!-- Hover overlay -->
									<div
										class="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/10"
									></div>
								</button>
							{/each}
						</div>

						<!-- Google Profile Photo (if available) -->
						{#if currentUser?.avatar_url && currentUser.avatar_url.includes('googleusercontent')}
							<div class="mt-4 border-t border-surface-300-700 pt-4">
								<p class="mb-3 text-sm font-medium text-surface-600-400">Google Profile</p>
								<button
									type="button"
									on:click={() => (selectedAvatarId = currentUser.avatar_url)}
									class="group relative aspect-square w-16 overflow-hidden rounded-xl border-2 transition-all duration-200 hover:scale-105 {selectedAvatarId ===
									currentUser.avatar_url
										? 'border-primary-500 ring-2 ring-primary-500 ring-offset-2 ring-offset-surface-100-900'
										: 'border-surface-300-700 hover:border-surface-400-600'}"
									title="Google Profile Photo"
								>
									<img
										src={currentUser.avatar_url}
										alt="Google Profile"
										class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-110"
									/>

									<!-- Google badge -->
									<div
										class="absolute top-1 left-1 rounded bg-blue-500 px-1 py-0.5 text-xs text-white"
									>
										Google
									</div>

									<!-- Selected indicator -->
									{#if selectedAvatarId === currentUser.avatar_url}
										<div
											class="absolute inset-0 flex items-center justify-center bg-primary-500/20"
										>
											<div class="rounded-full bg-primary-500 p-1">
												<Check class="h-3 w-3 text-white" />
											</div>
										</div>
									{/if}
								</button>
							</div>
						{/if}
					</div>
				</div>

				<!-- Action Buttons -->
				<div class="mt-8 flex flex-col justify-end space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
					<button
						type="button"
						on:click={() => goto('/')}
						class="preset-outlined-surface btn w-full sm:w-auto"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isSaving || !displayName.trim()}
						class="btn w-full preset-filled-primary-500 sm:w-auto {isSaving || !displayName.trim()
							? 'opacity-50'
							: ''}"
					>
						{#if isSaving}
							<div
								class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
							></div>
							Saving...
						{:else}
							<Save class="mr-2 h-4 w-4" />
							Save Changes
						{/if}
					</button>
				</div>
			</form>
		{/if}
	</div>
</div>
