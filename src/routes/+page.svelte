<script>
	import { Book, Plus } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { flashcardActions, recentActivities } from '$lib/stores/flashcards.js';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase.js';

	let isLoading = $state(true);

	onMount(async () => {
		try {
			isLoading = true;
			// Load recent activities when page loads
			await flashcardActions.loadRecentActivities();
		} finally {
			isLoading = false;
		}
	});

	function goToQuiz(activityId) {
		goto(`/quiz/${activityId}`);
	}
</script>

<svelte:head>
	<title>Quizcard</title>
	<meta name="description" content="Quizcard - Interactive learning platform" />
</svelte:head>

<div class="bg-surface-50-950 p-6">
	<div class="mx-auto max-w-5xl">
		<!-- Popular Content Section -->
		<div class="mt-12">
			<h3 class="mb-6 text-xl font-semibold">Recents</h3>

			{#if isLoading}
				<!-- Skeleton Loading for Recent Activities -->
				<div class="space-y-4">
					{#each Array(6) as _}
						<div
							class="cursor-pointer card preset-tonal-surface p-4 transition-shadow hover:shadow-lg"
						>
							<div class="flex items-center space-x-4">
								<div class="h-12 w-12 animate-pulse rounded bg-surface-300-700"></div>
								<div class="flex-1 space-y-2">
									<div class="h-5 w-3/4 animate-pulse rounded bg-surface-300-700"></div>
									<div class="h-4 w-1/2 animate-pulse rounded bg-surface-300-700"></div>
									<div class="h-3 w-full animate-pulse rounded bg-surface-300-700"></div>
								</div>
								<div class="flex items-center space-x-2">
									<div class="h-4 w-16 animate-pulse rounded bg-surface-300-700"></div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else if $recentActivities && $recentActivities.length > 0}
				<div class="space-y-4">
					{#each $recentActivities as activity}
						<div
							class="cursor-pointer card preset-tonal-surface p-4 transition-all duration-200 hover:shadow-lg"
							role="button"
							tabindex="0"
							onclick={() => goToQuiz(activity.id)}
							onkeydown={(e) => e.key === 'Enter' && goToQuiz(activity.id)}
						>
							<div class="flex items-center space-x-4">
								<div class="flex h-12 w-12 items-center justify-center rounded bg-primary-500">
									<Book class="h-6 w-6 text-white" />
								</div>
								<div class="flex-1">
									<h4 class="font-semibold">
										{activity.title}
									</h4>
									<p class="text-sm opacity-75">
										{activity.total_cards} cards • {activity.users?.full_name || 'Anonymous'}
									</p>
									{#if activity.description}
										<p class="mt-1 text-sm opacity-60">{activity.description}</p>
									{/if}
								</div>
								<div class="flex items-center space-x-2">
									<span class="text-xs opacity-60">
										{new Date(activity.last_studied_at || activity.created_at).toLocaleDateString(
											'en-US'
										)}
									</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="card preset-tonal-surface p-8 text-center">
					<Book class="mx-auto mb-4 h-12 w-12 opacity-30" />
					<h4 class="mb-2 font-semibold">There are no recent activities</h4>
					<p class="mb-4 text-sm opacity-75">
						Start creating or studying flashcards to see recent activities
					</p>
					<a href="/create" class="btn preset-tonal">
						<Plus class="h-4 w-4" />
						<span>Create Flashcards</span>
					</a>
				</div>
			{/if}
		</div>
	</div>
</div>
