<script>
	import { onMount } from 'svelte';
	import {
		Star,
		Volume2,
		Edit,
		Sparkles,
		ArrowLeftRight,
		Eye,
		EyeOff,
		ChevronDown
	} from 'lucide-svelte';
	import { ProgressService } from '$lib/services/progressService.js';

	let { flashcardSet, onStarToggle } = $props();

	let stillLearning = $state([]);
	let mastered = $state([]);
	let isLoading = $state(true);
	let selectedTab = $state('all'); // 'all', 'starred', 'stats'

	// Starred terms dari progress
	let starredTerms = $state([]);

	// New state for features
	let isTermFirst = $state(true); // true = term first, false = definition first
	let blurMode = $state('none'); // 'none', 'term', 'definition'
	let showBlurDropdown = $state(false);

	// Stats dropdown state
	let showStatsDropdown = $state(false);
	let selectedStatsMode = $state('your-stats'); // 'your-stats', 'alphabetical', 'original'

	// Calculate starred count from flashcard set
	let starredCount = $derived(
		flashcardSet?.flashcards?.filter((card) => card.is_starred)?.length || 0
	);

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

			// Filter starred terms
			starredTerms = [...sl, ...m].filter((item) => item.flashcards?.is_starred);
		} catch (error) {
			console.error('Error loading progress:', error);
		} finally {
			isLoading = false;
		}
	}

	function playAudio(text) {
		if ('speechSynthesis' in window) {
			const utterance = new SpeechSynthesisUtterance(text);
			utterance.rate = 0.8;
			speechSynthesis.speak(utterance);
		}
	}

	// Get the text to play based on current position
	function getAudioText(item) {
		return isTermFirst ? item.flashcards.term : item.flashcards.definition;
	}

	// Handle star toggle for progress items
	async function handleStarToggle(cardId) {
		if (onStarToggle) {
			await onStarToggle(cardId);
			// Reload progress to get updated starred status
			await loadProgress();
		}
	}

	// New functions for features
	function togglePosition() {
		isTermFirst = !isTermFirst;
	}

	function toggleBlurDropdown() {
		showBlurDropdown = !showBlurDropdown;
	}

	function setBlurMode(mode) {
		blurMode = mode;
		showBlurDropdown = false;
	}

	// Get blur class based on current mode
	function getBlurClass(isTermSection) {
		if (blurMode === 'none') return 'transition-all duration-300';
		if (blurMode === 'term' && isTermSection) return 'blur-sm transition-all duration-300';
		if (blurMode === 'definition' && !isTermSection) return 'blur-sm transition-all duration-300';
		return 'transition-all duration-300';
	}

	// Get blur label for dropdown
	function getBlurLabel() {
		switch (blurMode) {
			case 'term':
				return 'Hide Terms';
			case 'definition':
				return 'Hide Definitions';
			default:
				return 'Show All';
		}
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event) {
		if (showBlurDropdown && !event.target.closest('.dropdown-container')) {
			showBlurDropdown = false;
		}
		if (showStatsDropdown && !event.target.closest('.stats-dropdown-container')) {
			showStatsDropdown = false;
		}
	}

	// Stats dropdown functions
	function toggleStatsDropdown() {
		showStatsDropdown = !showStatsDropdown;
	}

	function setStatsMode(mode) {
		selectedStatsMode = mode;
		selectedTab = 'stats';
		showStatsDropdown = false;
	}

	function getStatsLabel() {
		switch (selectedStatsMode) {
			case 'alphabetical':
				return 'Alphabetical';
			case 'original':
				return 'Original';
			default:
				return 'Your stats';
		}
	}

	// Get sorted flashcards based on mode
	function getSortedFlashcards() {
		if (!flashcardSet?.flashcards) return [];

		const cards = flashcardSet.flashcards;

		switch (selectedStatsMode) {
			case 'alphabetical':
				return [...cards].sort((a, b) => a.term.localeCompare(b.term));
			case 'original':
				return cards;
			default:
				return cards; // For 'your-stats', we'll show progress data
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

{#if !isLoading}
	<div class="space-y-8">
		<!-- Tab Navigation -->
		<div class="flex items-center justify-between">
			<h2 class="text-2xl font-bold">Terms in this set ({flashcardSet.flashcards.length})</h2>

			<div class="flex items-center space-x-4">
				<!-- Control Buttons -->
				<div class="flex items-center space-x-2 border-r border-surface-300-700 pr-4">
					<!-- Switch Position Button -->
					<button
						class="btn-icon btn-icon-sm preset-tonal-surface"
						onclick={togglePosition}
						title="Switch term and definition positions"
					>
						<ArrowLeftRight class="h-4 w-4" />
					</button>

					<!-- Blur Dropdown -->
					<div class="dropdown-container relative">
						<button
							class="btn flex items-center space-x-1 preset-tonal-surface"
							onclick={toggleBlurDropdown}
							title="Toggle visibility"
						>
							{#if blurMode === 'none'}
								<Eye class="h-4 w-4" />
							{:else}
								<EyeOff class="h-4 w-4" />
							{/if}
							<span class="text-sm">{getBlurLabel()}</span>
							<ChevronDown class="h-3 w-3" />
						</button>

						{#if showBlurDropdown}
							<div
								class="absolute top-full right-0 z-10 mt-1 w-40 rounded-lg border border-surface-300-700 preset-tonal shadow-lg"
							>
								<button
									class="flex w-full items-center space-x-2 rounded-t-lg px-3 py-2 text-left text-sm hover:bg-surface-200-800"
									onclick={() => setBlurMode('none')}
								>
									<Eye class="h-4 w-4" />
									<span>Show All</span>
								</button>
								<button
									class="flex w-full items-center space-x-2 px-3 py-2 text-left text-sm hover:bg-surface-200-800"
									onclick={() => setBlurMode('term')}
								>
									<EyeOff class="h-4 w-4" />
									<span>Hide Terms</span>
								</button>
								<button
									class="flex w-full items-center space-x-2 rounded-b-lg px-3 py-2 text-left text-sm hover:bg-surface-200-800"
									onclick={() => setBlurMode('definition')}
								>
									<EyeOff class="h-4 w-4" />
									<span>Hide Definitions</span>
								</button>
							</div>
						{/if}
					</div>
				</div>

				<!-- Tab Buttons -->
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
					Starred ({starredCount})
				</button>

				<!-- Stats Dropdown -->
				<div class="stats-dropdown-container relative">
					<button
						class="btn flex items-center space-x-1 {selectedTab === 'stats'
							? 'preset-filled-primary-500'
							: 'preset-tonal-surface'}"
						onclick={toggleStatsDropdown}
					>
						<span>{getStatsLabel()}</span>
						<ChevronDown class="h-3 w-3" />
					</button>

					{#if showStatsDropdown}
						<div
							class="absolute top-full right-0 z-10 mt-1 w-40 rounded-lg border border-surface-300-700 preset-tonal shadow-lg"
						>
							<button
								class="flex w-full items-center space-x-2 rounded-t-lg px-3 py-2 text-left text-sm hover:bg-surface-200-800"
								onclick={() => setStatsMode('your-stats')}
							>
								<span>Your stats</span>
							</button>
							<button
								class="flex w-full items-center space-x-2 px-3 py-2 text-left text-sm hover:bg-surface-200-800"
								onclick={() => setStatsMode('alphabetical')}
							>
								<span>Alphabetical</span>
							</button>
							<button
								class="flex w-full items-center space-x-2 rounded-b-lg px-3 py-2 text-left text-sm hover:bg-surface-200-800"
								onclick={() => setStatsMode('original')}
							>
								<span>Original</span>
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>

		{#if selectedTab === 'all'}
			<!-- Still Learning Section -->
			{#if stillLearning.length > 0}
				<div class="space-y-4">
					<h3 class="flex items-center text-xl font-semibold text-orange-500">
						<Sparkles class="mr-2 h-5 w-5" />
						Still learning ({stillLearning.length})
					</h3>
					<p class="text-sm text-surface-600-400">
						You've started learning these terms. Keep it up!
					</p>

					<div class="space-y-3">
						{#each stillLearning as item}
							{#if item.flashcards}
								<div class="min-h-[120px] overflow-hidden rounded-lg preset-tonal">
									<!-- Main Content -->
									<div class="flex min-h-[120px] flex-col justify-center md:flex-row">
										{#if isTermFirst}
											<!-- Term Section (First) -->
											<div
												class="flex-1 p-6 text-white {getBlurClass(
													true
												)} flex min-h-[120px] items-center"
											>
												<h4 class="text-lg font-medium break-words">{item.flashcards.term}</h4>
											</div>

											<!-- Definition Section (Second) -->
											<div
												class="flex-1 border-t border-surface-300-700 p-6 md:border-t-0 md:border-l {getBlurClass(
													false
												)} flex min-h-[120px] items-center"
											>
												<p class="text-base leading-relaxed break-words text-surface-700-300">
													{item.flashcards.definition}
												</p>
											</div>
										{:else}
											<!-- Definition Section (First) -->
											<div
												class="flex-1 p-6 text-white {getBlurClass(
													false
												)} flex min-h-[120px] items-center"
											>
												<h4 class="text-lg font-medium break-words">
													{item.flashcards.definition}
												</h4>
											</div>

											<!-- Term Section (Second) -->
											<div
												class="flex-1 border-t border-surface-300-700 p-6 md:border-t-0 md:border-l {getBlurClass(
													true
												)} flex min-h-[120px] items-center"
											>
												<p class="text-base leading-relaxed break-words text-surface-700-300">
													{item.flashcards.term}
												</p>
											</div>
										{/if}

										<!-- Action Buttons -->
										<div class="flex items-center justify-center space-x-2 p-4">
											<button
												class="btn-icon btn-icon-sm transition-transform hover:scale-110"
												class:text-yellow-500={item.flashcards.is_starred}
												title={item.flashcards.is_starred ? 'Remove star' : 'Add star'}
												onclick={() => handleStarToggle(item.flashcards.id)}
											>
												<span class:fill-current={item.flashcards.is_starred}>
													<Star class="h-4 w-4" />
												</span>
											</button>
											<button
												class="btn-icon btn-icon-sm transition-transform hover:scale-110"
												onclick={() => playAudio(getAudioText(item))}
												title="Play audio"
											>
												<Volume2 class="h-4 w-4" />
											</button>
											<button
												class="btn-icon btn-icon-sm transition-transform hover:scale-110"
												title="Edit"
											>
												<Edit class="h-4 w-4" />
											</button>
										</div>
									</div>

									<!-- Progress Info Footer -->
									<!-- <div class="px-6 py-3">
										<div class="text-surface-500-400-token text-xs">
											Confidence: {item.confidence_level}/5 •
											{item.correct_attempts}/{item.total_attempts} correct • Last seen: {new Date(
												item.last_attempt_at
											).toLocaleDateString()}
										</div>
									</div> -->
								</div>
							{/if}
						{/each}
					</div>
				</div>
			{/if}

			<!-- Mastered Section -->
			{#if mastered.length > 0}
				<div class="space-y-4">
					<h3 class="flex items-center text-xl font-semibold text-green-500">
						<Star class="mr-2 h-5 w-5" />
						Mastered ({mastered.length})
					</h3>
					<p class="text-sm text-surface-600-400">You've been getting these terms right!</p>

					<div class="space-y-3">
						{#each mastered as item}
							{#if item.flashcards}
								<div class="min-h-[120px] overflow-hidden rounded-lg preset-tonal">
									<!-- Main Content -->
									<div class="flex min-h-[120px] flex-col md:flex-row">
										{#if isTermFirst}
											<!-- Term Section (First) -->
											<div
												class="flex-1 p-6 text-white {getBlurClass(
													true
												)} flex min-h-[120px] items-center"
											>
												<h4 class="text-lg font-medium break-words">{item.flashcards.term}</h4>
											</div>

											<!-- Definition Section (Second) -->
											<div
												class="flex-1 border-t border-surface-300-700 p-6 md:border-t-0 md:border-l {getBlurClass(
													false
												)} flex min-h-[120px] items-center"
											>
												<p class="text-base leading-relaxed break-words text-surface-700-300">
													{item.flashcards.definition}
												</p>
											</div>
										{:else}
											<!-- Definition Section (First) -->
											<div
												class="flex-1 p-6 text-white {getBlurClass(
													false
												)} flex min-h-[120px] items-center"
											>
												<h4 class="text-lg font-medium break-words">
													{item.flashcards.definition}
												</h4>
											</div>

											<!-- Term Section (Second) -->
											<div
												class="flex-1 border-t border-surface-300-700 p-6 md:border-t-0 md:border-l {getBlurClass(
													true
												)} flex min-h-[120px] items-center"
											>
												<p class="text-base leading-relaxed break-words text-surface-700-300">
													{item.flashcards.term}
												</p>
											</div>
										{/if}

										<!-- Action Buttons -->
										<div class="flex items-center justify-center space-x-2 p-4">
											<span class="rounded bg-green-500 px-2 py-1 text-xs font-medium text-white">
												Mastered
											</span>
											<button
												class="btn-icon btn-icon-sm transition-transform hover:scale-110"
												class:text-yellow-500={item.flashcards.is_starred}
												title={item.flashcards.is_starred ? 'Remove star' : 'Add star'}
												onclick={() => handleStarToggle(item.flashcards.id)}
											>
												<span class:fill-current={item.flashcards.is_starred}>
													<Star class="h-4 w-4" />
												</span>
											</button>
											<button
												class="btn-icon btn-icon-sm transition-transform hover:scale-110"
												onclick={() => playAudio(getAudioText(item))}
												title="Play audio"
											>
												<Volume2 class="h-4 w-4" />
											</button>
										</div>
									</div>

									<!-- Progress Info Footer -->
									<!-- <div class="px-6 py-3">
										<div class="text-surface-500-400-token text-xs">
											Mastered on: {new Date(item.mastered_at).toLocaleDateString()} •
											{item.correct_attempts}/{item.total_attempts} correct
										</div>
									</div> -->
								</div>
							{/if}
						{/each}
					</div>
				</div>
			{/if}

			<!-- No Progress Yet -->
			{#if stillLearning.length === 0 && mastered.length === 0}
				<div class="py-12 text-center">
					<div class="rounded-lg preset-tonal p-8">
						<h3 class="mb-2 text-xl font-semibold">No progress tracked yet</h3>
						<p class="mb-4 text-surface-600-400">
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
				{#if starredTerms.length > 0}
					<div class="space-y-3">
						{#each starredTerms as item}
							<!-- Display starred terms with their progress -->
							<div class="min-h-[120px] overflow-hidden rounded-lg preset-tonal">
								<!-- Main Content -->
								<div class="flex min-h-[120px] flex-col md:flex-row">
									{#if isTermFirst}
										<!-- Term Section (First) -->
										<div
											class="flex-1 p-6 text-white {getBlurClass(
												true
											)} flex min-h-[120px] items-center"
										>
											<h4 class="text-lg font-medium break-words">{item.flashcards.term}</h4>
										</div>

										<!-- Definition Section (Second) -->
										<div
											class="flex-1 border-t border-surface-300-700 p-6 md:border-t-0 md:border-l {getBlurClass(
												false
											)} flex min-h-[120px] items-center"
										>
											<p class="text-base leading-relaxed break-words text-surface-700-300">
												{item.flashcards.definition}
											</p>
										</div>
									{:else}
										<!-- Definition Section (First) -->
										<div
											class="flex-1 p-6 text-white {getBlurClass(
												false
											)} flex min-h-[120px] items-center"
										>
											<h4 class="text-lg font-medium break-words">{item.flashcards.definition}</h4>
										</div>

										<!-- Term Section (Second) -->
										<div
											class="flex-1 border-t border-surface-300-700 p-6 md:border-t-0 md:border-l {getBlurClass(
												true
											)} flex min-h-[120px] items-center"
										>
											<p class="text-base leading-relaxed break-words text-surface-700-300">
												{item.flashcards.term}
											</p>
										</div>
									{/if}

									<!-- Action Buttons -->
									<div class="flex items-center justify-center space-x-2 p-4">
										<button
											class="btn-icon btn-icon-sm transition-transform hover:scale-110"
											class:text-yellow-500={item.flashcards.is_starred}
											title={item.flashcards.is_starred ? 'Remove star' : 'Add star'}
											onclick={() => handleStarToggle(item.flashcards.id)}
										>
											<span class:fill-current={item.flashcards.is_starred}>
												<Star class="h-4 w-4" />
											</span>
										</button>
										<button
											class="btn-icon btn-icon-sm transition-transform hover:scale-110"
											onclick={() => playAudio(getAudioText(item))}
											title="Play audio"
										>
											<Volume2 class="h-4 w-4" />
										</button>
										<button
											class="btn-icon btn-icon-sm transition-transform hover:scale-110"
											title="Edit"
										>
											<Edit class="h-4 w-4" />
										</button>
									</div>
								</div>

								<!-- Progress Info Footer -->
								<!-- <div class="px-6 py-3">
									<div class="text-surface-500-400-token text-xs">
										Confidence: {item.confidence_level}/5 •
										{item.correct_attempts}/{item.total_attempts} correct • Last seen: {new Date(
											item.last_attempt_at
										).toLocaleDateString()}
									</div>
								</div> -->
							</div>
						{/each}
					</div>
				{:else}
					<div class="py-12 text-center">
						<Star class="mx-auto mb-4 h-12 w-12 text-surface-400-600" />
						<h3 class="mb-2 text-lg font-semibold">No starred terms yet</h3>
						<p class="text-surface-600-400">
							Star important terms to track their progress separately.
						</p>
					</div>
				{/if}
			</div>
		{:else if selectedTab === 'stats'}
			<!-- Statistics -->
			{#if selectedStatsMode === 'your-stats'}
				<!-- Your Stats - Show progress like Still Learning and Mastered -->
				<div class="space-y-8">
					<!-- Still Learning Section -->
					{#if stillLearning.length > 0}
						<div class="space-y-4">
							<h3 class="flex items-center text-xl font-semibold text-orange-500">
								<Sparkles class="mr-2 h-5 w-5" />
								Still learning ({stillLearning.length})
							</h3>
							<div class="space-y-3">
								{#each stillLearning as item}
									{#if item.flashcards}
										<div class="min-h-[120px] overflow-hidden rounded-lg preset-tonal">
											<div class="flex min-h-[120px] flex-col justify-center md:flex-row">
												{#if isTermFirst}
													<div
														class="flex-1 p-6 text-white {getBlurClass(
															true
														)} flex min-h-[120px] items-center"
													>
														<h4 class="text-lg font-medium break-words">{item.flashcards.term}</h4>
													</div>
													<div
														class="flex-1 border-t border-surface-300-700 p-6 md:border-t-0 md:border-l {getBlurClass(
															false
														)} flex min-h-[120px] items-center"
													>
														<p class="text-base leading-relaxed break-words text-surface-700-300">
															{item.flashcards.definition}
														</p>
													</div>
												{:else}
													<div
														class="flex-1 p-6 text-white {getBlurClass(
															false
														)} flex min-h-[120px] items-center"
													>
														<h4 class="text-lg font-medium break-words">
															{item.flashcards.definition}
														</h4>
													</div>
													<div
														class="flex-1 border-t border-surface-300-700 p-6 md:border-t-0 md:border-l {getBlurClass(
															true
														)} flex min-h-[120px] items-center"
													>
														<p class="text-base leading-relaxed break-words text-surface-700-300">
															{item.flashcards.term}
														</p>
													</div>
												{/if}
												<div class="flex items-center justify-center space-x-2 p-4">
													<button
														class="btn-icon btn-icon-sm transition-transform hover:scale-110"
														class:text-yellow-500={item.flashcards.is_starred}
														title={item.flashcards.is_starred ? 'Remove star' : 'Add star'}
														onclick={() => handleStarToggle(item.flashcards.id)}
													>
														<span class:fill-current={item.flashcards.is_starred}
															><Star class="h-4 w-4" /></span
														>
													</button>
													<button
														class="btn-icon btn-icon-sm transition-transform hover:scale-110"
														onclick={() => playAudio(getAudioText(item))}
														title="Play audio"
													>
														<Volume2 class="h-4 w-4" />
													</button>
												</div>
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
							<h3 class="flex items-center text-xl font-semibold text-green-500">
								<Star class="mr-2 h-5 w-5" />
								Mastered ({mastered.length})
							</h3>
							<div class="space-y-3">
								{#each mastered as item}
									{#if item.flashcards}
										<div class="min-h-[120px] overflow-hidden rounded-lg preset-tonal">
											<div class="flex min-h-[120px] flex-col md:flex-row">
												{#if isTermFirst}
													<div
														class="flex-1 p-6 text-white {getBlurClass(
															true
														)} flex min-h-[120px] items-center"
													>
														<h4 class="text-lg font-medium break-words">{item.flashcards.term}</h4>
													</div>
													<div
														class="flex-1 border-t border-surface-300-700 p-6 md:border-t-0 md:border-l {getBlurClass(
															false
														)} flex min-h-[120px] items-center"
													>
														<p class="text-base leading-relaxed break-words text-surface-700-300">
															{item.flashcards.definition}
														</p>
													</div>
												{:else}
													<div
														class="flex-1 p-6 text-white {getBlurClass(
															false
														)} flex min-h-[120px] items-center"
													>
														<h4 class="text-lg font-medium break-words">
															{item.flashcards.definition}
														</h4>
													</div>
													<div
														class="flex-1 border-t border-surface-300-700 p-6 md:border-t-0 md:border-l {getBlurClass(
															true
														)} flex min-h-[120px] items-center"
													>
														<p class="text-base leading-relaxed break-words text-surface-700-300">
															{item.flashcards.term}
														</p>
													</div>
												{/if}
												<div class="flex items-center justify-center space-x-2 p-4">
													<span
														class="rounded bg-green-500 px-2 py-1 text-xs font-medium text-white"
														>Mastered</span
													>
													<button
														class="btn-icon btn-icon-sm transition-transform hover:scale-110"
														class:text-yellow-500={item.flashcards.is_starred}
														title={item.flashcards.is_starred ? 'Remove star' : 'Add star'}
														onclick={() => handleStarToggle(item.flashcards.id)}
													>
														<span class:fill-current={item.flashcards.is_starred}
															><Star class="h-4 w-4" /></span
														>
													</button>
													<button
														class="btn-icon btn-icon-sm transition-transform hover:scale-110"
														onclick={() => playAudio(getAudioText(item))}
														title="Play audio"
													>
														<Volume2 class="h-4 w-4" />
													</button>
												</div>
											</div>
										</div>
									{/if}
								{/each}
							</div>
						</div>
					{/if}

					{#if stillLearning.length === 0 && mastered.length === 0}
						<div class="py-12 text-center">
							<p class="text-surface-600-400">No progress data available yet.</p>
						</div>
					{/if}
				</div>
			{:else}
				<!-- Alphabetical and Original modes - Show all flashcards -->
				<div class="space-y-4">
					<h3 class="text-xl font-semibold">
						{selectedStatsMode === 'alphabetical' ? 'Alphabetical Order' : 'Original Order'}
					</h3>
					<div class="space-y-3">
						{#each getSortedFlashcards() as card}
							<div class="min-h-[120px] overflow-hidden rounded-lg preset-tonal">
								<div class="flex min-h-[120px] flex-col justify-center md:flex-row">
									{#if isTermFirst}
										<div
											class="flex-1 p-6 text-white {getBlurClass(
												true
											)} flex min-h-[120px] items-center"
										>
											<h4 class="text-lg font-medium break-words">{card.term}</h4>
										</div>
										<div
											class="flex-1 border-t border-surface-300-700 p-6 md:border-t-0 md:border-l {getBlurClass(
												false
											)} flex min-h-[120px] items-center"
										>
											<p class="text-base leading-relaxed break-words text-surface-700-300">
												{card.definition}
											</p>
										</div>
									{:else}
										<div
											class="flex-1 p-6 text-white {getBlurClass(
												false
											)} flex min-h-[120px] items-center"
										>
											<h4 class="text-lg font-medium break-words">{card.definition}</h4>
										</div>
										<div
											class="flex-1 border-t border-surface-300-700 p-6 md:border-t-0 md:border-l {getBlurClass(
												true
											)} flex min-h-[120px] items-center"
										>
											<p class="text-base leading-relaxed break-words text-surface-700-300">
												{card.term}
											</p>
										</div>
									{/if}
									<div class="flex items-center justify-center space-x-2 p-4">
										<button
											class="btn-icon btn-icon-sm transition-transform hover:scale-110"
											class:text-yellow-500={card.is_starred}
											title={card.is_starred ? 'Remove star' : 'Add star'}
											onclick={() => handleStarToggle(card.id)}
										>
											<span class:fill-current={card.is_starred}><Star class="h-4 w-4" /></span>
										</button>
										<button
											class="btn-icon btn-icon-sm transition-transform hover:scale-110"
											onclick={() => playAudio(isTermFirst ? card.term : card.definition)}
											title="Play audio"
										>
											<Volume2 class="h-4 w-4" />
										</button>
										<button
											class="btn-icon btn-icon-sm transition-transform hover:scale-110"
											title="Edit"
										>
											<Edit class="h-4 w-4" />
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	</div>
{:else}
	<div class="flex items-center justify-center py-12">
		<div class="text-center">
			<div
				class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"
			></div>
			<p class="text-surface-600-400">Loading progress...</p>
		</div>
	</div>
{/if}
