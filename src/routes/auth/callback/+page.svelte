<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase.js';
	import { page } from '$app/stores';

	let loading = true;
	let errorMessage = '';

	onMount(async () => {
		console.log('Auth callback page loaded');
		console.log('Current URL:', window.location.href);
		console.log('URL search params:', $page.url.searchParams.toString());

		try {
			// Get URL parameters
			const urlParams = new URLSearchParams(window.location.search);
			const code = urlParams.get('code');
			const error = urlParams.get('error');
			const errorDescription = urlParams.get('error_description');

			console.log('URL params:', { code: !!code, error, errorDescription });

			// Check for OAuth errors first
			if (error) {
				console.error('OAuth error:', error, errorDescription);
				errorMessage = errorDescription || error;
				loading = false;
				setTimeout(() => {
					goto('/login?error=' + encodeURIComponent(errorMessage));
				}, 2000);
				return;
			}

			// Check if we have an authorization code
			if (!code) {
				console.error('No authorization code found in URL');
				errorMessage = 'No authorization code received';
				loading = false;
				setTimeout(() => {
					goto('/login?error=' + encodeURIComponent('Authentication failed'));
				}, 2000);
				return;
			}

			// Handle OAuth callback with the current URL
			const { data, error: authError } = await supabase.auth.exchangeCodeForSession(
				window.location.href
			);

			console.log('Auth callback result:', { data: !!data, error: authError });

			if (authError) {
				console.error('Error during authentication:', authError);
				errorMessage = authError.message;
				loading = false;

				// Handle specific auth errors
				if (authError.message.includes('code verifier')) {
					// Clear any stored auth state and redirect to fresh login
					await supabase.auth.signOut();
					setTimeout(() => {
						goto('/login?message=' + encodeURIComponent('Please try signing in again'));
					}, 2000);
				} else {
					setTimeout(() => {
						goto('/login?error=' + encodeURIComponent(authError.message));
					}, 2000);
				}
				return;
			}

			if (data?.session?.user) {
				console.log('Authentication successful:', data.session.user);
				loading = false;

				// Wait a bit for the auth state to propagate
				setTimeout(() => {
					goto('/');
				}, 1000);
			} else {
				console.log('No session created, redirecting to login');
				errorMessage = 'No session created';
				loading = false;
				setTimeout(() => {
					goto('/login');
				}, 2000);
			}
		} catch (error) {
			console.error('Callback processing error:', error);
			errorMessage = error.message || 'Authentication failed';
			loading = false;
			setTimeout(() => {
				goto('/login?error=' + encodeURIComponent('Authentication failed'));
			}, 2000);
		}
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-surface-50-950">
	<div class="text-center">
		{#if loading}
			<div class="mb-4">
				<div
					class="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary-500"
				></div>
			</div>
			<p class="text-surface-600-400">Processing authentication...</p>
		{:else if errorMessage}
			<div class="mb-4">
				<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-error-500">
					<span class="text-xl text-white">!</span>
				</div>
			</div>
			<p class="mb-2 text-error-500">Authentication failed</p>
			<p class="text-sm text-surface-600-400">{errorMessage}</p>
			<p class="mt-2 text-xs text-surface-500">Redirecting to login...</p>
		{:else}
			<div class="mb-4">
				<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-500">
					<span class="text-xl text-white">✓</span>
				</div>
			</div>
			<p class="mb-2 text-success-500">Authentication successful!</p>
			<p class="text-xs text-surface-500">Redirecting...</p>
		{/if}
	</div>
</div>
