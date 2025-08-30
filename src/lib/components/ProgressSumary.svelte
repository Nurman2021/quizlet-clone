<!-- src/lib/components/ProgressSummary.svelte -->
<script>
	import { onMount } from 'svelte';
	import { Star, Volume2, Edit, Sparkles } from 'lucide-svelte';
	import { ProgressService } from '$lib/services/progressService.js';

	let { flashcardSet } = $props();

	let stillLearning = $state([]);
	let mastered = $state([]);
	let isLoading = $state(true);
	let selectedTab = $state('all'); // 'all', 'starred', 'stats'

	onMount(async () => {
		await loadProgress();
	});

	async function loadProgress() {
		try {
			isLoading = true;
			const { stillLearning: sl, mastered: m } = await ProgressService.getSetProgress(
				flashcardSet.id
			);
			stillLearning = sl;
			mastered = m;
		} catch (error) {
			console.error('Error loading progress:', error);
		} finally {
			isLoading = false;
		}
	}

	async function selectAllStillLearning() {
		// TODO: Implement bulk operations
		console.log('Select all still learning');
	}

	async function selectAllMastered() {
		// TODO: Implement bulk operations
		console.log('Select all mastered');
	}

	function playAudio(text) {
		if ('speechSynthesis' in window) {
			const utterance = new SpeechSynthesisUtterance(text);
			utterance.rate = 0.8;
			speechSynthesis.speak(utterance);
		}
	}
</script>

{#if !isLoading}
	<div class="space-y-8">
		<!-- Tab Navigation -->
		<div class="flex items-center justify-between">
			<h2 class="text-2xl font-bold">Terms in this set ({flashcardSet.flashcards.length})</h2>

			<div class="flex items-center space-x-4">
				<button
					class="btn {selectedTab === 'all' ? 'preset-filled-primary-500' : 'preset-tonal-surface'}"
					onclick={() => (selectedTab = 'all')}
				>
					All
				</button>
				<button
					class="btn {selectedTab === 'starred'
						? 'preset-filled-primary-500'
						: 'preset-tonal-surface'}"
					onclick={() => (selectedTab = 'starred')}
				>
					Starred ({stillLearning.filter((item) => item.flashcards?.is_starred).length})
				</button>
				<button
					class="btn {selectedTab === 'stats'
						? 'preset-filled-primary-500'
						: 'preset-tonal-surface'}"
					onclick={() => (selectedTab = 'stats')}
				>
					Your stats
				</button>
			</div>
		</div>

		{#if selectedTab === 'all'}
			<!-- Still Learning Section -->
			{#if stillLearning.length > 0}
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<h3 class="flex items-center text-xl font-semibold text-orange-500">
							<Sparkles class="mr-2 h-5 w-5" />
							Still learning ({stillLearning.length})
						</h3>
						<button class="btn preset-tonal-surface" onclick={selectAllStillLearning}>
							Select all {stillLearning.length}
						</button>
					</div>
					<p class="text-surface-600-300-token text-sm">
						You've started learning these terms. Keep it up!
					</p>

					<div class="space-y-3">
						{#each stillLearning as item}
							{#if item.flashcards}
								<div
									class="bg-surface-100-800-token flex items-center justify-between rounded-lg border-l-4 border-orange-500 p-4"
								>
									<div class="flex-1">
										<div class="flex items-start space-x-4">
											<div class="flex-1">
												<h4 class="text-lg font-medium">{item.flashcards.term}</h4>
												<p class="text-surface-600-300-token mt-1">{item.flashcards.definition}</p>

												<!-- Progress Info -->
												<div class="text-surface-500-400-token mt-2 text-xs">
													Confidence: {item.confidence_level}/5 •
													{item.correct_attempts}/{item.total_attempts} correct • Last seen: {new Date(
														item.last_attempt_at
													).toLocaleDateString()}
												</div>
											</div>
										</div>
									</div>

									<div class="flex items-center space-x-2">
										<button
											class="btn-icon btn-icon-sm preset-tonal-surface"
											onclick={() => playAudio(item.flashcards.term)}
											title="Play audio"
										>
											<Volume2 class="h-4 w-4" />
										</button>
										<button class="btn-icon btn-icon-sm preset-tonal-surface" title="Edit">
											<Edit class="h-4 w-4" />
										</button>
										<button
											class="btn-icon btn-icon-sm preset-tonal-surface"
											class:text-yellow-500={item.flashcards.is_starred}
											title="Star"
										>
											<span class:fill-current={item.flashcards.is_starred}>
												<Star class="h-4 w-4" />
											</span>
										</button>
									</div>
								</div>
							{/if}
						{/each}
					</div>
				</div>
			{/if}

			<!-- Mastered Section -->
			{#if mastered.length > 0}
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<h3 class="flex items-center text-xl font-semibold text-green-500">
							<Star class="mr-2 h-5 w-5" />
							Mastered ({mastered.length})
						</h3>
						<button class="btn preset-tonal-surface" onclick={selectAllMastered}>
							Select these {mastered.length}
						</button>
					</div>
					<p class="text-surface-600-300-token text-sm">You've been getting these terms right!</p>

					<div class="space-y-3">
						{#each mastered as item}
							{#if item.flashcards}
								<div
									class="bg-surface-100-800-token flex items-center justify-between rounded-lg border-l-4 border-green-500 p-4"
								>
									<div class="flex-1">
										<div class="flex items-start space-x-4">
											<div class="flex-1">
												<h4 class="text-lg font-medium">{item.flashcards.term}</h4>
												<p class="text-surface-600-300-token mt-1">{item.flashcards.definition}</p>

												<!-- Progress Info -->
												<div class="text-surface-500-400-token mt-2 text-xs">
													Mastered on: {new Date(item.mastered_at).toLocaleDateString()} •
													{item.correct_attempts}/{item.total_attempts} correct
												</div>
											</div>
										</div>
									</div>

									<div class="flex items-center space-x-2">
										<span class="rounded bg-green-500 px-2 py-1 text-xs font-medium text-white">
											Mastered
										</span>
										<button
											class="btn-icon btn-icon-sm preset-tonal-surface"
											onclick={() => playAudio(item.flashcards.term)}
											title="Play audio"
										>
											<Volume2 class="h-4 w-4" />
										</button>
										<button
											class="btn-icon btn-icon-sm preset-tonal-surface"
											class:text-yellow-500={item.flashcards.is_starred}
											title="Star"
										>
											<span class:fill-current={item.flashcards.is_starred}>
												<Star class="h-4 w-4" />
											</span>
										</button>
									</div>
								</div>
							{/if}
						{/each}
					</div>
				</div>
			{/if}

			<!-- No Progress Yet -->
			{#if stillLearning.length === 0 && mastered.length === 0}
				<div class="py-12 text-center">
					<div class="bg-surface-100-800-token rounded-lg p-8">
						<h3 class="mb-2 text-xl font-semibold">No progress tracked yet</h3>
						<p class="text-surface-600-300-token mb-4">
							Start studying with flashcards, learn mode, or take tests to see your progress here.
						</p>
						<div class="flex justify-center space-x-4">
							<a href="/quiz/{flashcardSet.id}/learn" class="btn preset-filled-primary-500">
								Start Learning
							</a>
							<a href="/quiz/{flashcardSet.id}/test" class="btn preset-tonal-surface">
								Take Test
							</a>
						</div>
					</div>
				</div>
			{/if}
		{:else if selectedTab === 'starred'}
			<!-- Starred Terms -->
			<div class="py-12 text-center">
				<p class="text-surface-600-300-token">Starred terms feature coming soon...</p>
			</div>
		{:else if selectedTab === 'stats'}
			<!-- Statistics -->
			<div class="py-12 text-center">
				<p class="text-surface-600-300-token">Detailed statistics coming soon...</p>
			</div>
		{/if}
	</div>
{:else}
	<div class="flex items-center justify-center py-12">
		<div class="text-center">
			<div
				class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"
			></div>
			<p class="text-surface-600-300-token">Loading progress...</p>
		</div>
	</div>
{/if}
