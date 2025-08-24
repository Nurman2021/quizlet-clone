<script>
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { children } = $props();
</script>

<div class="flex h-screen flex-col overflow-hidden">
	<div class="flex-shrink-0">
		<Header />
	</div>

	<div class="flex flex-1 overflow-hidden">
		<div class="flex-shrink-0">
			<Sidebar />
		</div>

		<main class="bg-surface-50-900-token flex-1 overflow-y-auto p-6">
			{@render children()}
		</main>
	</div>
</div>
