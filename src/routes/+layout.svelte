<script>
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { children } = $props();
</script>

<div class="bg-surface-50-900-token flex h-screen flex-col">
	<!-- Header -->
	<Header />

	<!-- Main content dengan sidebar -->
	<div class="flex flex-1 overflow-hidden">
		<Sidebar>
			<!-- Konten utama akan ditampilkan di sini -->
			<main class="bg-surface-50-900-token flex-1 overflow-y-auto p-6">
				{@render children()}
			</main>
		</Sidebar>
	</div>
</div>
