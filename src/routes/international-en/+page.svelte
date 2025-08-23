<script>
	import { Book, FileText, Users, Settings } from 'lucide-svelte';
</script>

<svelte:head>
	<title>International English Language Testing System - Academic</title>
</svelte:head>

<div class="min-h-screen bg-slate-900 p-6">
	<div class="mx-auto max-w-5xl">
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="mb-2 text-3xl font-bold text-white">
						International English Language Testing System - Academic
					</h1>
					<p class="text-slate-400">Folder pembelajaran bahasa Inggris</p>
				</div>
				<button class="text-slate-400 transition-colors hover:text-white">
					<Settings class="h-6 w-6" />
				</button>
			</div>
		</div>

		<!-- Tabs -->
		<div class="mb-8 border-b border-slate-700">
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
					Anggota
				</button>
			</nav>
		</div>

		<!-- Content Area -->
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			<!-- Sample Flashcard Set -->
			<div class="hover:bg-slate-750 cursor-pointer rounded-lg bg-slate-800 p-6 transition-colors">
				<div class="mb-4 flex items-start justify-between">
					<div class="flex items-center space-x-3">
						<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
							<Book class="h-6 w-6 text-white" />
						</div>
						<div>
							<h3 class="font-semibold text-white">IELTS Academic Vocabulary</h3>
							<p class="text-sm text-slate-400">50 istilah</p>
						</div>
					</div>
				</div>
				<p class="mb-4 text-sm text-slate-300">Kosakata penting untuk tes IELTS Academic module</p>
				<div class="flex items-center space-x-2">
					<div class="h-6 w-6 rounded-full bg-green-500"></div>
					<span class="text-sm text-slate-300">Teacher</span>
				</div>
			</div>

			<!-- Sample Test -->
			<div class="hover:bg-slate-750 cursor-pointer rounded-lg bg-slate-800 p-6 transition-colors">
				<div class="mb-4 flex items-start justify-between">
					<div class="flex items-center space-x-3">
						<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600">
							<FileText class="h-6 w-6 text-white" />
						</div>
						<div>
							<h3 class="font-semibold text-white">Reading Practice Test</h3>
							<p class="text-sm text-slate-400">15 pertanyaan</p>
						</div>
					</div>
				</div>
				<p class="mb-4 text-sm text-slate-300">Latihan soal reading comprehension untuk IELTS</p>
				<div class="flex items-center space-x-2">
					<div class="h-6 w-6 rounded-full bg-blue-500"></div>
					<span class="text-sm text-slate-300">Admin</span>
				</div>
			</div>

			<!-- Sample Writing Module -->
			<div class="hover:bg-slate-750 cursor-pointer rounded-lg bg-slate-800 p-6 transition-colors">
				<div class="mb-4 flex items-start justify-between">
					<div class="flex items-center space-x-3">
						<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-600">
							<FileText class="h-6 w-6 text-white" />
						</div>
						<div>
							<h3 class="font-semibold text-white">Writing Task 1 & 2</h3>
							<p class="text-sm text-slate-400">25 template</p>
						</div>
					</div>
				</div>
				<p class="mb-4 text-sm text-slate-300">
					Template dan struktur penulisan untuk IELTS Writing
				</p>
				<div class="flex items-center space-x-2">
					<div class="h-6 w-6 rounded-full bg-red-500"></div>
					<span class="text-sm text-slate-300">Expert</span>
				</div>
			</div>
		</div>

		<!-- Add New Content -->
		<div class="mt-8 text-center">
			<a
				href="/create"
				class="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
			>
				Tambah konten baru
			</a>
		</div>
	</div>
</div>
