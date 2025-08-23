<script>
	import { BookOpen } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Perpustakaan Anda</title>
</svelte:head>

<div class="min-h-screen bg-slate-900 p-6">
	<div class="mx-auto max-w-7xl">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="mb-6 text-3xl font-bold text-white">Perpustakaan Anda</h1>

			<!-- Tab Navigation -->
			<div class="border-b border-slate-700">
				<nav class="flex space-x-8">
					<button class="border-b-2 border-blue-500 px-1 pb-4 font-medium text-blue-400">
						Set flashcard
					</button>
					<button
						class="border-b-2 border-transparent px-1 pb-4 text-slate-400 transition-colors hover:text-white"
					>
						Tes latihan
					</button>
					<button
						class="border-b-2 border-transparent px-1 pb-4 text-slate-400 transition-colors hover:text-white"
					>
						Solusi yang diverifikasi oleh para ahli
					</button>
					<button
						class="border-b-2 border-transparent px-1 pb-4 text-slate-400 transition-colors hover:text-white"
					>
						Folder
					</button>
					<button
						class="border-b-2 border-transparent px-1 pb-4 text-slate-400 transition-colors hover:text-white"
					>
						Kelas
					</button>
				</nav>
			</div>
		</div>

		<!-- Filter Button -->
		<div class="mb-8">
			<button
				class="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-white transition-colors hover:bg-slate-700"
			>
				Set terbaru ↓
			</button>
		</div>

		<!-- Empty State -->
		<div class="py-16 text-center">
			<div class="mb-8">
				<!-- Flashcard Icon -->
				<div
					class="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-700"
				>
					<BookOpen class="h-12 w-12 text-slate-400" />
				</div>
			</div>

			<h2 class="mb-4 text-2xl font-semibold text-white">Anda belum memiliki set</h2>
			<p class="mx-auto mb-8 max-w-md text-slate-400">
				Set yang Anda buat atau pelajari akan ditampilkan di sini
			</p>

			<a
				href="/create"
				class="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
			>
				Buat set
			</a>
		</div>
	</div>
</div>
