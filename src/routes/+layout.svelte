<script>
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { Toaster } from '@skeletonlabs/skeleton-svelte';
	import { toaster } from '$lib/stores/toast.js';
	import { page } from '$app/stores';

	let { children } = $props();

	// Check if current route is quiz, flashcard, or learn (fullscreen modes)
	let isFullscreenRoute = $derived(
		$page.route.id?.includes('/flashcard') ||
			$page.route.id?.includes('/learn') ||
			$page.route.id?.includes('/match') ||
			$page.route.id?.includes('/test')
	);
</script>

{#if isFullscreenRoute}
	<!-- Fullscreen layout for quiz, flashcard, and learn modes -->
	<div class="bg-surface-50-900-token h-screen w-screen overflow-x-scroll">
		<main class="h-full w-full">
			{@render children()}
		</main>
	</div>
{:else}
	<!-- Normal layout with sidebar and header -->
	<div class="flex h-screen flex-col overflow-hidden">
		<div class="flex-shrink-0">
			<Header />
		</div>

		<div class="flex flex-1 overflow-hidden">
			<div class="flex-shrink-0 transition-all duration-300 ease-in-out">
				<Sidebar />
			</div>

			<main
				class="bg-surface-50-900-token flex-1 overflow-y-auto p-6 transition-all duration-300 ease-in-out"
			>
				{@render children()}
			</main>
		</div>
	</div>
{/if}

<!-- Global Toaster -->
<Toaster {toaster} />
