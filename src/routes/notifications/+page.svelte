<script>
	import { Bell } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Pemberitahuan</title>
</svelte:head>

<div class="min-h-screen bg-slate-900 p-6">
	<div class="mx-auto max-w-5xl">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="mb-6 text-3xl font-bold text-white">Pemberitahuan</h1>
		</div>

		<!-- Empty State -->
		<div class="py-16 text-center">
			<div class="mb-8">
				<!-- Bell Icon -->
				<div
					class="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-700"
				>
					<Bell class="h-12 w-12 text-slate-400" />
				</div>
			</div>

			<h2 class="mb-4 text-2xl font-semibold text-white">Tidak ada pemberitahuan</h2>
			<p class="mx-auto mb-8 max-w-md text-slate-400">
				Pemberitahuan tentang aktivitas belajar Anda akan muncul di sini
			</p>
		</div>
	</div>
</div>
