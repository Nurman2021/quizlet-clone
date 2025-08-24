<script>
	import { supabase } from '$lib/supabase.js';
	import { goto } from '$app/navigation';
	import { Mail, Lock, User, Loader2 } from 'lucide-svelte';

	let email = '';
	let password = '';
	let confirmPassword = '';
	let fullName = '';
	let isLoading = false;
	let errorMessage = '';
	let successMessage = '';

	async function handleSignup() {
		// Validasi
		if (!email || !password || !confirmPassword || !fullName) {
			errorMessage = 'Semua field harus diisi';
			return;
		}

		if (password.length < 6) {
			errorMessage = 'Password minimal 6 karakter';
			return;
		}

		if (password !== confirmPassword) {
			errorMessage = 'Password tidak cocok';
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

			// Tampilkan pesan sukses
			successMessage = 'Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.';

			// Reset form
			email = '';
			password = '';
			confirmPassword = '';
			fullName = '';

			// Redirect setelah 3 detik
			setTimeout(() => {
				goto('/login');
			}, 3000);
		} catch (error) {
			errorMessage =
				error.message === 'User already registered' ? 'Email sudah terdaftar' : error.message;
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
			errorMessage = 'Gagal daftar dengan Google: ' + error.message;
		}
	}
</script>

<svelte:head>
	<title>Daftar | Quizlet Clone</title>
</svelte:head>

<div class="bg-surface-50-900-token flex min-h-screen items-center justify-center p-4">
	<div class="variant-ghost-surface w-full max-w-md card p-8">
		<!-- Logo -->
		<div class="mb-8 text-center">
			<div class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-lg bg-primary-500">
				<span class="text-3xl font-bold text-white">Q</span>
			</div>
			<h1 class="text-2xl font-bold">Daftar ke Quizlet</h1>
			<p class="text-surface-600-300-token mt-2">
				Sudah punya akun?
				<a href="/login" class="text-primary-500 hover:underline">Masuk</a>
			</p>
		</div>

		<!-- Messages -->
		{#if errorMessage}
			<div class="alert variant-filled-error mb-4">
				<div class="alert-message">
					<p>{errorMessage}</p>
				</div>
			</div>
		{/if}

		{#if successMessage}
			<div class="alert variant-filled-success mb-4">
				<div class="alert-message">
					<p>{successMessage}</p>
				</div>
			</div>
		{/if}

		<!-- Signup Form -->
		<form on:submit|preventDefault={handleSignup} class="space-y-4">
			<!-- Full Name Input -->
			<label class="label">
				<span>Nama Lengkap</span>
				<div class="input-group-divider input-group grid-cols-[auto_1fr]">
					<div class="input-group-shim">
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
					<div class="input-group-shim">
						<Mail class="h-4 w-4" />
					</div>
					<input
						type="email"
						bind:value={email}
						placeholder="nama@email.com"
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
					<div class="input-group-shim">
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
				<p class="text-surface-600-300-token mt-1 text-xs">Minimal 6 karakter</p>
			</label>

			<!-- Confirm Password Input -->
			<label class="label">
				<span>Konfirmasi Password</span>
				<div class="input-group-divider input-group grid-cols-[auto_1fr]">
					<div class="input-group-shim">
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
			<label class="flex items-center space-x-2">
				<input type="checkbox" class="checkbox" required />
				<span class="text-sm">
					Saya setuju dengan
					<a href="/terms" class="text-primary-500 hover:underline">Syarat & Ketentuan</a>
				</span>
			</label>

			<!-- Submit Button -->
			<button type="submit" class="variant-filled-primary btn w-full" disabled={isLoading}>
				{#if isLoading}
					<Loader2 class="h-4 w-4 animate-spin" />
					<span>Sedang mendaftar...</span>
				{:else}
					<span>Daftar</span>
				{/if}
			</button>
		</form>

		<!-- Divider -->
		<div class="relative my-6">
			<div class="absolute inset-0 flex items-center">
				<div class="border-surface-300-600-token w-full border-t"></div>
			</div>
			<div class="relative flex justify-center text-sm">
				<span class="bg-surface-50-900-token text-surface-600-300-token px-2">atau</span>
			</div>
		</div>

		<!-- Social Signup -->
		<div class="space-y-3">
			<button type="button" on:click={handleGoogleSignup} class="variant-ghost-surface btn w-full">
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
				<span>Lanjutkan dengan Google</span>
			</button>
		</div>
	</div>
</div>
