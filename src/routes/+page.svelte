<script>
	import { FolderOpen, Book, BarChart3, Plus, Eye } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { flashcardActions, recentActivities } from '$lib/stores/flashcards.js';

	onMount(async () => {
		// Load recent activities saat halaman dimuat
		await flashcardActions.loadRecentActivities();
	});
</script>

<svelte:head>
	<title>International English Language Testing System - Academic</title>
	<meta name="description" content="Quizcard - Interactive learning platform" />
</svelte:head>

<div class="bg-surface-50-900-token p-6">
	<div class="mx-auto max-w-5xl">
		<!-- Popular Content Section -->
		<div class="mt-12">
			<h3 class="mb-6 text-xl font-semibold">Recents</h3>

			{#if $recentActivities && $recentActivities.length > 0}
				<div class="space-y-4">
					{#each $recentActivities as activity}
						<div class="variant-ghost-surface card p-4">
							<div class="flex items-center space-x-4">
								<div class="flex h-12 w-12 items-center justify-center rounded bg-primary-500">
									<Book class="h-6 w-6 text-white" />
								</div>
								<div class="flex-1">
									<h4 class="font-semibold">
										{activity.title}
									</h4>
									<p class="text-sm opacity-75">
										{activity.total_cards} kartu • {activity.users?.full_name || 'Anonymous'}
									</p>
									{#if activity.description}
										<p class="mt-1 text-sm opacity-60">{activity.description}</p>
									{/if}
								</div>
								<div class="flex items-center space-x-2">
									<span class="text-xs opacity-60">
										{new Date(activity.last_studied_at || activity.created_at).toLocaleDateString(
											'id-ID'
										)}
									</span>
									<a href="/quiz/{activity.id}" class="variant-filled-primary btn btn-sm">
										<Eye class="h-4 w-4" />
										<span>Lihat</span>
									</a>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="variant-ghost-surface card p-8 text-center">
					<Book class="mx-auto mb-4 h-12 w-12 opacity-30" />
					<h4 class="mb-2 font-semibold">Belum ada aktivitas terbaru</h4>
					<p class="mb-4 text-sm opacity-75">
						Mulai buat atau pelajari flashcard untuk melihat aktivitas terbaru
					</p>
					<a href="/create" class="variant-filled-primary btn">
						<Plus class="h-4 w-4" />
						<span>Buat Flashcard</span>
					</a>
				</div>
			{/if}
		</div>
	</div>
</div>
