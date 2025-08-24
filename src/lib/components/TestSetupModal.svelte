<script>
	import { X } from 'lucide-svelte';
	import { createEventDispatcher, onMount } from 'svelte';

	export let show = false;

	const dispatch = createEventDispatcher();

	let dialog;
	let questionCount = 5;
	let answerWith = 'both';
	let trueFalse = true;
	let multipleChoice = true;
	let matching = false;
	let written = false;

	// Watch for show prop changes
	$: if (dialog) {
		if (show) {
			console.log('Opening dialog...');
			dialog.showModal();
		} else {
			console.log('Closing dialog...');
			dialog.close();
		}
	}

	onMount(() => {
		console.log('TestSetupModal mounted, dialog:', dialog);

		// Handle dialog close event
		if (dialog) {
			dialog.addEventListener('close', () => {
				console.log('Dialog closed');
				show = false;
			});
		}
	});

	function closeModal() {
		show = false;
	}

	function startTest() {
		const config = {
			questionCount, // Changed from maxQuestions
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

<!-- Modal Dialog -->
<dialog
	bind:this={dialog}
	data-dialog
	class="rounded-container-token bg-surface-100-900-token top-1/2 left-1/2 z-50 max-w-[500px] -translate-x-1/2 -translate-y-1/2 space-y-6 p-6 text-inherit backdrop:bg-surface-50/75 dark:backdrop:bg-surface-950/75"
>
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold text-white">Psikologi</h2>
			<h3 class="mt-1 text-xl font-medium text-white">Set up your test</h3>
		</div>
		<button
			type="button"
			class="variant-ghost-surface btn-icon btn-icon-sm text-white"
			on:click={closeModal}
		>
			<X class="h-5 w-5" />
		</button>
	</div>

	<!-- Configuration Options -->
	<div class="space-y-6">
		<!-- Questions Count -->
		<div class="flex items-center justify-between">
			<label for="maxQuestions" class="font-medium text-white">
				Questions <span class="text-surface-400">(max 5)</span>
			</label>
			<input
				id="maxQuestions"
				type="number"
				min="1"
				max="20"
				bind:value={questionCount}
				class="input w-20 border-surface-600 bg-surface-700 text-white"
			/>
		</div>

		<!-- Answer With -->
		<div class="space-y-3">
			<label for="answerWith" class="font-medium text-white">Answer with</label>
			<select
				id="answerWith"
				bind:value={answerWith}
				class="select w-full border-surface-600 bg-surface-700 text-white"
			>
				<option value="terms">Terms</option>
				<option value="definitions">Definitions</option>
				<option value="both">Both</option>
			</select>
		</div>

		<!-- Question Types -->
		<div class="space-y-4">
			<!-- True/False -->
			<div class="flex items-center justify-between">
				<label for="trueFalse" class="font-medium text-white">True/False</label>
				<input id="trueFalse" type="checkbox" bind:checked={trueFalse} class="checkbox" />
			</div>

			<!-- Multiple Choice -->
			<div class="flex items-center justify-between">
				<label for="multipleChoice" class="font-medium text-white">Multiple choice</label>
				<input id="multipleChoice" type="checkbox" bind:checked={multipleChoice} class="checkbox" />
			</div>

			<!-- Matching -->
			<div class="flex items-center justify-between">
				<label for="matching" class="font-medium text-white">Matching</label>
				<input id="matching" type="checkbox" bind:checked={matching} class="checkbox" />
			</div>

			<!-- Written -->
			<div class="flex items-center justify-between">
				<label for="written" class="font-medium text-white">Written</label>
				<input id="written" type="checkbox" bind:checked={written} class="checkbox" />
			</div>
		</div>
	</div>

	<!-- Actions -->
	<div class="flex justify-end pt-4">
		<button type="button" class="variant-filled-primary btn px-8" on:click={startTest}>
			Start test
		</button>
	</div>
</dialog>

<style>
	/* Modal animations */
	dialog,
	dialog::backdrop {
		--anim-duration: 250ms;
		transition:
			display var(--anim-duration) allow-discrete,
			overlay var(--anim-duration) allow-discrete,
			opacity var(--anim-duration);
		opacity: 0;
	}

	/* Animate In */
	dialog[open],
	dialog[open]::backdrop {
		opacity: 1;
	}

	/* Animate Out */
	@starting-style {
		dialog[open],
		dialog[open]::backdrop {
			opacity: 0;
		}
	}

	/* Dark theme for modal */
	dialog {
		background: #1e293b;
		border: 1px solid #374151;
	}
</style>
