<script>
	import { Plus, Image, Settings, Grid, Copy, Trash2, MoreHorizontal } from 'lucide-svelte';
	import { flashcardActions } from '$lib/stores/flashcards.js';
	import { supabase } from '$lib/supabase.js';
	import { goto } from '$app/navigation';

	let title = '';
	let description = '';
	let suggestionToggle = true;
	let cards = [
		{ id: 1, term: '', definition: '' },
		{ id: 2, term: '', definition: '' }
	];
	let isLoading = false;

	function addCard() {
		cards = [...cards, { id: Date.now(), term: '', definition: '' }];
	}

	function removeCard(id) {
		cards = cards.filter((card) => card.id !== id);
	}

	async function saveFlashcardSet() {
		if (!title.trim()) {
			alert('Judul tidak boleh kosong!');
			return;
		}

		const validCards = cards.filter((card) => card.term.trim() && card.definition.trim());

		if (validCards.length === 0) {
			alert('Minimal harus ada satu kartu dengan istilah dan definisi!');
			return;
		}

		isLoading = true;

		try {
			// Get current user
			const {
				data: { user }
			} = await supabase.auth.getUser();

			if (!user) {
				alert('Silakan login terlebih dahulu!');
				goto('/login');
				return;
			}

			const newSet = await flashcardActions.addSet(
				{
					title: title.trim(),
					description: description.trim(),
					cards: validCards
				},
				user.id
			);

			alert('Flashcard set berhasil disimpan!');

			// Reset form setelah berhasil save
			title = '';
			description = '';
			cards = [
				{ id: Date.now(), term: '', definition: '' },
				{ id: Date.now() + 1, term: '', definition: '' }
			];
		} catch (error) {
			alert('Gagal menyimpan flashcard set: ' + error.message);
		} finally {
			isLoading = false;
		}
	}

	async function saveAndPractice() {
		if (!title.trim()) {
			alert('Judul tidak boleh kosong!');
			return;
		}

		const validCards = cards.filter((card) => card.term.trim() && card.definition.trim());

		if (validCards.length === 0) {
			alert('Minimal harus ada satu kartu dengan istilah dan definisi!');
			return;
		}

		isLoading = true;

		try {
			// Get current user
			const {
				data: { user }
			} = await supabase.auth.getUser();

			if (!user) {
				alert('Silakan login terlebih dahulu!');
				goto('/login');
				return;
			}

			const newSet = await flashcardActions.addSet(
				{
					title: title.trim(),
					description: description.trim(),
					cards: validCards
				},
				user.id
			);

			// Redirect ke halaman quiz
			goto(`/quiz/${newSet.id}`);
		} catch (error) {
			alert('Gagal menyimpan flashcard set: ' + error.message);
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Buat set flashcard baru</title>
</svelte:head>

<div class="bg-surface-50-900-token p-6">
	<div class="mx-auto max-w-4xl">
		<!-- Header -->
		<div class="mb-8 flex items-center justify-between">
			<h1 class="text-2xl font-bold">Buat set flashcard baru</h1>
			<div class="flex items-center space-x-4">
				<button class="variant-ghost-surface btn" on:click={saveFlashcardSet}> Buat </button>
				<button class="variant-filled-primary btn" on:click={saveAndPractice}>
					Buat dan latihan
				</button>
			</div>
		</div>

		<!-- Form Content -->
		<div class="space-y-6">
			<!-- Title Input -->
			<div>
				<input
					bind:value={title}
					type="text"
					placeholder="Judul"
					class="input text-xl font-semibold"
					required
				/>
			</div>

			<!-- Description Input -->
			<div>
				<textarea
					bind:value={description}
					placeholder="Tambahkan deskripsi..."
					rows="3"
					class="textarea resize-none"
				></textarea>
			</div>

			<!-- Add Options -->
			<div class="flex items-center space-x-4">
				<button class="variant-ghost-surface btn btn-sm">
					<Plus class="h-4 w-4" />
					<span>Masukkan</span>
				</button>
				<button class="variant-ghost-surface btn btn-sm">
					<Plus class="h-4 w-4" />
					<span>Tambahkan diagram</span>
					<span class="variant-filled-warning badge">BETA</span>
				</button>
			</div>

			<!-- Card Settings -->
			<div class="flex items-center justify-between py-4">
				<div class="flex items-center space-x-4">
					<div class="flex items-center space-x-2">
						<button class="variant-ghost-surface btn-icon btn btn-icon-sm">
							<Settings class="h-4 w-4" />
						</button>
						<span>Saran</span>
						<input type="checkbox" class="checkbox" bind:checked={suggestionToggle} />
					</div>
					<button class="variant-ghost-surface btn-icon btn btn-icon-sm">
						<Grid class="h-4 w-4" />
					</button>
					<button class="variant-ghost-surface btn-icon btn btn-icon-sm">
						<Copy class="h-4 w-4" />
					</button>
					<button class="variant-ghost-surface btn-icon btn btn-icon-sm">
						<MoreHorizontal class="h-4 w-4" />
					</button>
				</div>
			</div>

			<!-- Cards Section -->
			<div class="space-y-4">
				{#each cards as card, index (card.id)}
					<div class="variant-ghost-surface card p-6">
						<div class="mb-4 flex items-center justify-between">
							<span class="variant-filled-primary badge">{index + 1}</span>
							<div class="flex items-center space-x-2">
								{#if cards.length > 2}
									<button
										class="variant-ghost-surface btn-icon btn btn-icon-sm"
										on:click={() => removeCard(card.id)}
									>
										<Trash2 class="h-4 w-4" />
									</button>
								{/if}
								<button class="variant-ghost-surface btn-icon btn btn-icon-sm">
									<MoreHorizontal class="h-4 w-4" />
								</button>
								<button class="variant-ghost-surface btn-icon btn btn-icon-sm">
									<Image class="h-4 w-4" />
								</button>
								<span class="text-sm opacity-75">Gambar</span>
							</div>
						</div>

						<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
							<!-- Term -->
							<div>
								<label class="label mb-2" for="term-{card.id}">
									<span class="text-sm font-semibold">ISTILAH</span>
								</label>
								<textarea
									id="term-{card.id}"
									bind:value={card.term}
									placeholder="Masukkan istilah"
									class="textarea min-h-[120px]"
									rows="4"
								></textarea>
							</div>

							<!-- Definition -->
							<div>
								<label class="label mb-2" for="definition-{card.id}">
									<span class="text-sm font-semibold">DEFINISI</span>
								</label>
								<textarea
									id="definition-{card.id}"
									bind:value={card.definition}
									placeholder="Masukkan definisi"
									class="textarea min-h-[120px]"
									rows="4"
								></textarea>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Add Card Button -->
			<button
				on:click={addCard}
				class="variant-ghost-surface !border-surface-300-600-token btn w-full border-2 border-dashed"
			>
				Tambahkan kartu
			</button>

			<!-- Bottom Actions -->
			<div class="flex items-center justify-between pt-8">
				<button class="variant-ghost-surface btn" on:click={saveFlashcardSet}> Buat </button>
				<button class="variant-filled-primary btn" on:click={saveAndPractice}>
					Buat dan latihan
				</button>
			</div>
		</div>
	</div>
</div>

{#if isLoading}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<div class="card p-4">
			<p>Menyimpan flashcard set...</p>
		</div>
	</div>
{/if}
