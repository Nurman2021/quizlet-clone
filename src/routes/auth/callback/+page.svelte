<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase.js';

	onMount(async () => {
		console.log('Auth callback page loaded');
		console.log('Current URL:', window.location.href);

		try {
			// Handle OAuth callback
			const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);

			console.log('Auth callback result:', { data, error });

			if (error) {
				console.error('Error during authentication:', error);
				goto('/login?error=' + encodeURIComponent(error.message));
			} else if (data?.session?.user) {
				console.log('Authentication successful:', data.session.user);
				// Wait a bit for the auth state to propagate
				setTimeout(() => {
					goto('/');
				}, 500);
			} else {
				console.log('No session created, redirecting to login');
				goto('/login');
			}
		} catch (error) {
			console.error('Callback processing error:', error);
			goto('/login?error=' + encodeURIComponent('Authentication failed'));
		}
	});
</script>

<div class="flex min-h-screen items-center justify-center">
	<div class="text-center">
		<div class="mb-4">
			<div class="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary-500"></div>
		</div>
		<p class="text-surface-600-400">Processing authentication...</p>
	</div>
</div>
