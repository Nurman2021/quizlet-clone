<script>
	import { FolderOpen, Book, BarChart3, Plus, Eye } from 'lucide-svelte';
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
</script>

<svelte:head>
	<title>International English Language Testing System - Academic</title>
	<meta name="description" content="Quizlet Clone - Platform pembelajaran interaktif" />
</svelte:head>

<div class="bg-surface-50-900-token p-6">
	<div class="mx-auto max-w-5xl">
		<!-- Header Section -->
		<div class="mb-8">
			<h1 class="mb-2 text-3xl font-bold">
				International English Language Testing System - Academic
			</h1>
			<div class="flex items-center space-x-4">
				<button class="variant-filled-surface btn"> Semua </button>
				<button class="variant-ghost-surface btn-icon btn">
					<Plus class="h-5 w-5" />
				</button>
			</div>
		</div>

		<!-- Main Content Area -->
		<div class="variant-glass-surface card p-12 text-center">
			<!-- Folder Icons -->
			<div class="mb-8 flex justify-center space-x-4">
				<div class="text-primary-500">
					<FolderOpen class="h-16 w-16" />
				</div>
				<div class="text-secondary-500">
					<Book class="h-16 w-16" />
				</div>
				<div class="text-tertiary-500">
					<BarChart3 class="h-16 w-16" />
				</div>
				<Avatar src="https://i.pravatar.cc/150?img=48" name="skeleton" />
			</div>

			<!-- Info Message -->
			<div class="mx-auto mb-8 max-w-md">
				<aside class="alert variant-ghost-surface">
					<div class="alert-message">
						<p class="text-sm">Anda dapat menambahkan tag di sini kapan saja</p>
					</div>
				</aside>
			</div>

			<!-- Main Message -->
			<h2 class="mb-8 text-2xl font-semibold">Mari mulai membuat folder Anda</h2>

			<!-- Add Content Button -->
			<a href="/create" class="variant-filled-primary btn"> Tambahkan konten </a>
		</div>

		<!-- Popular Content Section -->
		<div class="mt-12">
			<h3 class="mb-6 text-xl font-semibold">Terbaru</h3>

			<div class="variant-ghost-surface card p-4">
				<div class="flex items-center space-x-4">
					<div class="flex h-12 w-12 items-center justify-center rounded bg-success-500">
						<Book class="h-6 w-6 text-white" />
					</div>
					<div>
						<h4 class="font-semibold">
							Linear Algebra and Its Applications, Bab. 1, Hlm. 10, Ch. 1
						</h4>
						<p class="text-sm opacity-75">Buku pelajaran</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Popular Sections -->
		<div class="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
			<!-- Set Flashcard Populer -->
			<div>
				<h3 class="mb-4 text-xl font-semibold">Set flashcard populer</h3>
				<div class="space-y-4">
					<div class="variant-ghost-surface card p-4">
						<h4 class="mb-2 font-semibold">bahasa Inggris</h4>
						<p class="mb-3 text-sm opacity-75">40 istilah</p>
						<div class="flex items-center space-x-2">
							<div class="avatar w-6 bg-warning-500">
								<span class="text-xs font-bold text-white">S</span>
							</div>
							<span class="text-sm">semangatalisma</span>
						</div>
					</div>

					<div class="variant-ghost-surface card p-4">
						<h4 class="mb-2 font-semibold">HORMON ENDOKRIN</h4>
						<p class="mb-3 text-sm opacity-75">27 istilah</p>
						<div class="flex items-center space-x-2">
							<div class="avatar w-6 bg-primary-500">
								<span class="text-xs font-bold text-white">W</span>
							</div>
							<span class="text-sm"
								>Widiam <span class="variant-filled-surface badge">Guru</span></span
							>
						</div>
					</div>

					<div class="variant-ghost-surface card p-4">
						<h4 class="mb-2 font-semibold">Fukushuu Minna 1 Bab 8 📝</h4>
						<p class="mb-3 text-sm opacity-75">45 istilah</p>
						<div class="flex items-center space-x-2">
							<div class="avatar w-6 bg-error-500">
								<span class="text-xs font-bold text-white">D</span>
							</div>
							<span class="text-sm"
								>Dita_Ridha <span class="variant-filled-surface badge">Guru</span></span
							>
						</div>
					</div>
				</div>
			</div>

			<!-- Buku Pelajaran Populer -->
			<div>
				<h3 class="mb-4 text-xl font-semibold">Buku pelajaran populer</h3>
				<div class="space-y-4">
					<div class="variant-ghost-surface card p-4">
						<div class="flex space-x-4">
							<div class="avatar h-20 w-15 rounded-lg bg-error-500"></div>
							<div>
								<h4 class="mb-1 text-sm font-semibold">
									Mathematical Methods in the Physical Sciences
								</h4>
								<p class="mb-1 text-xs opacity-75">3rd Edition • ISBN: 9780471984607</p>
								<p class="mb-2 text-xs opacity-75">Mary L. Boas</p>
								<div class="flex items-center space-x-1">
									<Eye class="h-3 w-3" />
									<span class="text-xs opacity-75">3.350 solusi</span>
								</div>
							</div>
						</div>
					</div>

					<div class="variant-ghost-surface card p-4">
						<div class="flex space-x-4">
							<div class="avatar h-20 w-15 rounded-lg bg-primary-500"></div>
							<div>
								<h4 class="mb-1 text-sm font-semibold">
									Cambridge IGCSE and O Level Business Studies
								</h4>
								<p class="mb-1 text-xs opacity-75">5th Edition • ISBN: 9781510421233</p>
								<p class="mb-2 text-xs opacity-75">Karen Borrington, Peter Stimpson</p>
								<div class="flex items-center space-x-1">
									<Eye class="h-3 w-3" />
									<span class="text-xs opacity-75">735 solusi</span>
								</div>
							</div>
						</div>
					</div>

					<div class="variant-ghost-surface card p-4">
						<div class="flex space-x-4">
							<div class="avatar h-20 w-15 rounded-lg bg-success-500"></div>
							<div>
								<h4 class="mb-1 text-sm font-semibold">Fundamentals of Organic Chemistry</h4>
								<p class="mb-1 text-xs opacity-75">7th Edition • ISBN: 9781430016723</p>
								<p class="mb-2 text-xs opacity-75">John E. McMurry</p>
								<div class="flex items-center space-x-1">
									<Eye class="h-3 w-3" />
									<span class="text-xs opacity-75">690 solusi</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Pertanyaan Populer -->
			<div>
				<h3 class="mb-4 text-xl font-semibold">Pertanyaan populer</h3>
				<div class="space-y-4">
					<div class="variant-ghost-surface card p-4">
						<h4 class="mb-2 font-semibold">Ilmu Kebumian</h4>
						<p class="text-sm opacity-75">100 juta dolar berapa rupiah ?</p>
					</div>

					<div class="variant-ghost-surface card p-4">
						<h4 class="mb-2 font-semibold">Ilmu Komputer</h4>
						<p class="text-sm opacity-75">
							Sebuah perangkat untuk meneruskan internet ke client yang terhubung dengan server,
							disebut juga dengan...
						</p>
						<div class="mt-2 flex items-center space-x-2">
							<span class="text-xs opacity-75">💡 senterkp</span>
						</div>
					</div>

					<div class="variant-ghost-surface card p-4">
						<h4 class="mb-2 font-semibold">Musik</h4>
						<p class="text-sm opacity-75">
							Carilah kata yang tidak sama dari kata-kata berikut ____
						</p>
						<div class="mt-2 flex items-center space-x-2">
							<span class="text-xs opacity-75">🎵 senterkp</span>
							<span class="variant-filled-success badge text-xs">terjawab</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
