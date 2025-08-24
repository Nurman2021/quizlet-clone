<script>
	import { supabase } from '$lib/supabase.js';
	import { goto } from '$app/navigation';
	import { Mail, Lock, Loader2 } from 'lucide-svelte';

	let email = '';
	let password = '';
	let isLoading = false;
	let errorMessage = '';

	async function handleLogin() {
		if (!email || !password) {
			errorMessage = 'Email dan password harus diisi';
			return;
		}

		isLoading = true;
		errorMessage = '';

		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email: email.trim(),
				password: password
			});

			if (error) throw error;

			// Redirect ke halaman utama setelah login berhasil
			goto('/');
		} catch (error) {
			errorMessage =
				error.message === 'Invalid login credentials' ? 'Email atau password salah' : error.message;
		} finally {
			isLoading = false;
		}
	}

	async function handleGoogleLogin() {
		try {
			const { error } = await supabase.auth.signInWithOAuth({
				provider: 'google',
				options: {
					redirectTo: `${window.location.origin}/auth/callback`
				}
			});

			if (error) throw error;
		} catch (error) {
			errorMessage = 'Gagal login dengan Google: ' + error.message;
		}
	}
</script>

<svelte:head>
	<title>Login | Quizcard</title>
</svelte:head>

<div class="bg-surface-50-900-token flex min-h-screen items-center justify-center p-4">
	<div class="variant-ghost-surface w-full max-w-md card p-8">
		<!-- Logo -->
		<div class="mb-8 text-center">
			<div class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-lg bg-primary-500">
				<span class="text-3xl font-bold text-white">Q</span>
			</div>
			<h1 class="text-2xl font-bold">Log in to Quizcard</h1>
			<p class="text-surface-600-300-token mt-2">
				Don't have an account yet?
				<a href="/signup" class="text-primary-500 hover:underline">Signup</a>
			</p>
		</div>

		<!-- Error Message -->
		{#if errorMessage}
			<div class="alert variant-filled-error mb-4">
				<div class="alert-message">
					<p>{errorMessage}</p>
				</div>
			</div>
		{/if}

		<!-- Login Form -->
		<form on:submit|preventDefault={handleLogin} class="space-y-4">
			<!-- Email Input -->
			<label class="label">
				<span>Email</span>
				<div class="input-group-divider input-group grid-cols-[auto_1fr]">
					<div class="ig-cell preset-tonal">
						<Mail class="h-4 w-4" />
					</div>
					<input
						type="email"
						bind:value={email}
						placeholder="your@email.com"
						class="input"
						required
						disabled={isLoading}
					/>
				</div>
			</label>

			<!-- Password Input -->
			<label class="label">
				<span>Password</span>
				<div class="input-group-divider input-group grid-cols-[auto_1fr]">
					<div class="ig-cell preset-tonal">
						<Lock class="h-4 w-4" />
					</div>
					<input
						type="password"
						bind:value={password}
						placeholder="••••••••"
						class="input"
						required
						disabled={isLoading}
					/>
				</div>
			</label>

			<!-- Remember & Forgot -->
			<div class="flex items-center justify-between">
				<label class="flex items-center space-x-2">
					<input type="checkbox" class="checkbox" />
					<span class="text-sm">Remember me</span>
				</label>
				<!-- <a href="/forgot-password" class="text-sm text-primary-500 hover:underline">
					Forgot password?
				</a> -->
			</div>

			<!-- Submit Button -->
			<button type="submit" class="variant-filled-primary btn w-full" disabled={isLoading}>
				{#if isLoading}
					<Loader2 class="h-4 w-4 animate-spin" />
					<span>Logging in...</span>
				{:else}
					<span>Login</span>
				{/if}
			</button>
		</form>

		<!-- Divider -->
		<p class="my-6 flex w-full items-center">
			<span class="border-surface-300-600-token flex-grow rounded border-t"></span>
			<span class="mx-4 text-sm">or</span>
			<span class="border-surface-300-600-token flex-grow rounded border-t"></span>
		</p>
		<!-- Social Login -->
		<div class="space-y-3">
			<button type="button" on:click={handleGoogleLogin} class="variant-ghost-surface btn w-full">
				<svg class="h-5 w-5" viewBox="0 0 24 24">
					<path
						fill="#4285F4"
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
					/>
					<path
						fill="#34A853"
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
					/>
					<path
						fill="#FBBC05"
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
					/>
					<path
						fill="#EA4335"
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
					/>
				</svg>
				<span>Continue with Google</span>
			</button>
		</div>
	</div>
</div>
