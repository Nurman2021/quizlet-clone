<script>
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { Toaster } from '@skeletonlabs/skeleton-svelte';
	import { toaster } from '$lib/stores/toast.js';

	let { children } = $props();
</script>

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

<!-- Global Toaster -->
<Toaster {toaster} />
