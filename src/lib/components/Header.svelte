<script>
	import { Search, User, Plus } from 'lucide-svelte';
</script>

<header class="bg-surface-100-800-token border-surface-300-600-token border-b px-6 py-4">
	<div class="mx-auto flex max-w-7xl items-center justify-between">
		<!-- Logo dan Brand -->
		<div class="flex items-center space-x-2">
			<div class="flex h-8 w-8 items-center justify-center rounded bg-primary-500">
				<span class="text-lg font-bold text-white">Q</span>
			</div>
		</div>

		<!-- Search Bar -->
		<div class="mx-8 max-w-xl flex-1">
			<div class="input-group-divider input-group grid-cols-[auto_1fr_auto]">
				<div class="input-group-shim">
					<Search class="h-4 w-4" />
				</div>
				<input
					type="search"
					placeholder="Cari flashcard, buku pelajaran, pertanyaan"
					class="input"
				/>
			</div>
		</div>

		<!-- User Actions -->
		<div class="flex items-center space-x-2">
			<a href="/create" class="variant-ghost-surface btn btn-sm" aria-label="Tambah konten">
				<Plus class="h-5 w-5" />
			</a>
			<button class="variant-ghost-surface btn btn-sm" aria-label="Profil pengguna">
				<User class="h-5 w-5" />
			</button>
		</div>
	</div>
</header>
