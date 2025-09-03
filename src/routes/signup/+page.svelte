<script>
	import { supabase } from '$lib/supabase.js';
	import { goto } from '$app/navigation';
	import { Mail, Lock, User, Loader2 } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let email = '';
	let password = '';
	let confirmPassword = '';
	let fullName = '';
	let isLoading = false;
	let errorMessage = '';
	let successMessage = '';

	// Check if user is already logged in
	onMount(async () => {
		const {
			data: { session }
		} = await supabase.auth.getSession();
		if (session) {
			goto('/');
		}
	});

	async function handleSignup() {
		// Validation
		if (!email || !password || !confirmPassword || !fullName) {
			errorMessage = 'All fields must be filled';
			return;
		}

		if (password.length < 6) {
			errorMessage = 'Password must be at least 6 characters';
			return;
		}

		if (password !== confirmPassword) {
			errorMessage = 'Passwords do not match';
			return;
		}

		isLoading = true;
		errorMessage = '';

		try {
			// Signup user
			const { data, error } = await supabase.auth.signUp({
				email: email.trim(),
				password: password,
				options: {
					data: {
						full_name: fullName.trim()
					}
				}
			});

			if (error) throw error;

			// Show success message
			successMessage = 'Registration successful! Please check your email for verification.';

			// Reset form
			email = '';
			password = '';
			confirmPassword = '';
			fullName = '';

			// Redirect after 3 seconds
			setTimeout(() => {
				goto('/login');
			}, 3000);
		} catch (error) {
			errorMessage =
				error.message === 'User already registered' ? 'Email already registered' : error.message;
		} finally {
			isLoading = false;
		}
	}

	async function handleGoogleSignup() {
		try {
			const { error } = await supabase.auth.signInWithOAuth({
				provider: 'google',
				options: {
					redirectTo: `${window.location.origin}/auth/callback`
				}
			});

			if (error) throw error;
		} catch (error) {
			errorMessage = 'Failed to signup with Google: ' + error.message;
		}
	}
</script>

<svelte:head>
	<title>Signup | Quizcard</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-surface-50-950 p-4">
	<div class="w-full max-w-md card preset-tonal-surface p-8">
		<!-- Logo -->
		<div class="mb-8 text-center">
			<div class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-lg bg-primary-500">
				<span class="text-3xl font-bold text-white">Q</span>
			</div>
			<h1 class="text-2xl font-bold">Signup to Quizcard</h1>
			<p class="mt-2 text-surface-600-400">
				Already have an account?
				<a href="/login" class="text-primary-500 hover:underline">Log in</a>
			</p>
		</div>

		<!-- Messages -->
		{#if errorMessage}
			<div class="alert mb-4 preset-tonal-error">
				<div class="alert-message">
					<p>{errorMessage}</p>
				</div>
			</div>
		{/if}

		{#if successMessage}
			<div class="alert mb-4 preset-tonal-success">
				<div class="alert-message">
					<p>{successMessage}</p>
				</div>
			</div>
		{/if}

		<!-- Signup Form -->
		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleSignup();
			}}
			class="space-y-4"
		>
			<!-- Full Name Input -->
			<label class="label">
				<span>Full Name</span>
				<div class="input-group-divider input-group grid-cols-[auto_1fr]">
					<div class="ig-cell preset-tonal">
						<User class="h-4 w-4" />
					</div>
					<input
						type="text"
						bind:value={fullName}
						placeholder="John Doe"
						class="input"
						required
						disabled={isLoading}
					/>
				</div>
			</label>

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
						placeholder="name@email.com"
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
						minlength="6"
					/>
				</div>
				<p class="mt-1 text-xs text-surface-600-400">Minimum 6 characters</p>
			</label>

			<!-- Confirm Password Input -->
			<label class="label">
				<span>Confirm Password</span>
				<div class="input-group-divider input-group grid-cols-[auto_1fr]">
					<div class="ig-cell preset-tonal">
						<Lock class="h-4 w-4" />
					</div>
					<input
						type="password"
						bind:value={confirmPassword}
						placeholder="••••••••"
						class="input"
						required
						disabled={isLoading}
					/>
				</div>
			</label>

			<!-- Terms -->
			<!-- <label class="flex items-center space-x-2">
				<input type="checkbox" class="checkbox" required />
				<span class="text-sm">
					Saya setuju dengan
					<a href="/terms" class="text-primary-500 hover:underline">Syarat & Ketentuan</a>
				</span>
			</label> -->

			<!-- Submit Button -->
			<button type="submit" class="btn w-full preset-tonal-primary" disabled={isLoading}>
				{#if isLoading}
					<Loader2 class="h-4 w-4 animate-spin" />
					<span>Signing up...</span>
				{:else}
					<span>Sign up</span>
				{/if}
			</button>
		</form>

		<p class="my-6 flex w-full items-center">
			<span class="flex-grow rounded border-t border-surface-300-700"></span>
			<span class="mx-4 text-sm">or</span>
			<span class="flex-grow rounded border-t border-surface-300-700"></span>
		</p>

		<!-- Social Signup -->
		<div class="space-y-3">
			<button type="button" onclick={handleGoogleSignup} class="btn w-full preset-tonal-surface">
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
