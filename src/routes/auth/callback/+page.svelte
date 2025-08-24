<!-- filepath: c:\Users\X1 Carbon\Desktop\QUIZ-FIVERR\quizlet-clone\src\routes\auth\callback\+page.svelte -->
<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase.js';

	onMount(async () => {
		// Handle OAuth callback
		const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);

		if (error) {
			console.error('Error during authentication:', error);
			goto('/login');
		} else {
			// Redirect ke halaman utama setelah berhasil
			goto('/');
		}
	});
</script>

<div class="flex min-h-screen items-center justify-center">
	<div class="text-center">
		<div class="mb-4">
			<div class="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary-500"></div>
		</div>
		<p class="text-surface-600-300-token">Sedang memproses autentikasi...</p>
	</div>
</div>
