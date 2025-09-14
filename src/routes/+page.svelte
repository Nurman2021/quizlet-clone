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
	<div class="mx-auto max-w-4xl">
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
							</div>
						</div>
					{/each}
				</div>
			{:else if $recentActivities && $recentActivities.length > 0}
				<div class="space-y-4">
					{#each $recentActivities as activity}
						<div
							class="min-h-[100px] cursor-pointer card preset-tonal-surface p-4 shadow-lg transition-all duration-200 hover:preset-tonal"
							role="button"
							tabindex="0"
							onclick={() => goToQuiz(activity.id)}
							onkeydown={(e) => e.key === 'Enter' && goToQuiz(activity.id)}
						>
							<div class="flex h-full items-start space-x-4">
								<div
									class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded bg-primary-500"
								>
									<Book class="h-6 w-6 text-white" />
								</div>
								<div class="flex min-h-[68px] flex-1 flex-col justify-between">
									<div class="space-y-1">
										<h4 class="leading-tight font-semibold">
											{activity.title}
										</h4>
										<p class="text-sm opacity-75">
											{activity.total_cards} cards • {activity.users?.full_name || 'Anonymous'}
										</p>
									</div>
									<div class="mt-auto">
										{#if activity.description}
											<p class="line-clamp-2 text-sm opacity-60">{activity.description}</p>
										{:else}
											<div class="h-5"></div>
										{/if}
									</div>
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

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		line-height: 1.4;
		max-height: calc(1.4em * 2);
	}
</style>
