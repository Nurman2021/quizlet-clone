<script>
	import Modal from './Modal.svelte';
	import { createEventDispatcher } from 'svelte';

	let { show = $bindable() } = $props();

	const dispatch = createEventDispatcher();

	let questionCount = $state(5);
	let answerWith = $state('both');
	let trueFalse = $state(true);
	let multipleChoice = $state(true);
	let matching = $state(false);
	let written = $state(false);

	function closeModal() {
		show = false;
	}

	function startTest() {
		const config = {
			questionCount,
			answerWith,
			trueFalse,
			multipleChoice,
			matching,
			written
		};

		console.log('Dispatching start-test event with config:', config);
		dispatch('start-test', config);
		closeModal();
	}
</script>

<Modal bind:showModal={show} size="lg" title="Set up your test" onClose={closeModal}>
	{#snippet children()}
		<!-- Configuration Options -->
		<div class="space-y-6">
			<!-- Questions Count -->
			<div class="flex items-center justify-between">
				<label for="maxQuestions" class="font-medium">
					Questions <span class="text-surface-500">({questionCount} questions)</span>
				</label>
				<input
					id="maxQuestions"
					type="number"
					min="1"
					max="20"
					bind:value={questionCount}
					class="input w-20"
				/>
			</div>

			<!-- Answer With -->
			<div class="space-y-3">
				<label for="answerWith" class="font-medium">Answer with</label>
				<select id="answerWith" bind:value={answerWith} class="select w-full">
					<option value="terms">Terms</option>
					<option value="definitions">Definitions</option>
					<option value="both">Both</option>
				</select>
			</div>

			<!-- Question Types -->
			<div class="space-y-4">
				<h3 class="font-medium">Question types</h3>

				<!-- True/False -->
				<div class="flex items-center justify-between">
					<label for="trueFalse" class="font-medium">True/False</label>
					<input id="trueFalse" type="checkbox" bind:checked={trueFalse} class="checkbox" />
				</div>

				<!-- Multiple Choice -->
				<div class="flex items-center justify-between">
					<label for="multipleChoice" class="font-medium">Multiple choice</label>
					<input
						id="multipleChoice"
						type="checkbox"
						bind:checked={multipleChoice}
						class="checkbox"
					/>
				</div>

				<!-- Matching -->
				<div class="flex items-center justify-between">
					<label for="matching" class="font-medium">Matching</label>
					<input id="matching" type="checkbox" bind:checked={matching} class="checkbox" />
				</div>

				<!-- Written -->
				<div class="flex items-center justify-between">
					<label for="written" class="font-medium">Written</label>
					<input id="written" type="checkbox" bind:checked={written} class="checkbox" />
				</div>
			</div>

			<!-- Actions -->
			<div class="flex justify-end gap-2 pt-4">
				<button onclick={closeModal} class="preset-outlined-neutral-500-900 btn"> Cancel </button>
				<button onclick={startTest} class="preset-filled-primary-500-900 btn px-8">
					Start test
				</button>
			</div>
		</div>
	{/snippet}
</Modal>
