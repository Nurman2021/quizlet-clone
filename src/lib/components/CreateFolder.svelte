<script>
	import { Folder } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';
	import { toast } from '$lib/stores/toast.js';
	import Modal from './Modal.svelte';

	export let show = false;
	export let editMode = false;
	export let folderData = null;

	const dispatch = createEventDispatcher();

	let name = '';
	let description = '';
	let selectedColor = '#3B82F6';

	// Watch for changes in folderData and editMode
	$: if (editMode && folderData) {
		name = folderData.name || '';
		description = folderData.description || '';
		selectedColor = folderData.color || '#3B82F6';
	}

	const colors = [
		'#3B82F6', // Blue
		'#10B981', // Green
		'#F59E0B', // Yellow
		'#EF4444', // Red
		'#8B5CF6', // Purple
		'#EC4899', // Pink
		'#14B8A6', // Teal
		'#6366F1' // Indigo
	];

	function closeModal() {
		show = false;
		resetForm();
	}

	function resetForm() {
		name = '';
		description = '';
		selectedColor = '#3B82F6';
	}

	function handleSubmit() {
		if (!name.trim()) {
			toast.error('Folder name must be filled!');
			return;
		}

		const eventName = editMode ? 'update' : 'create';
		dispatch(eventName, {
			id: editMode ? folderData?.id : undefined,
			name: name.trim(),
			description: description.trim(),
			color: selectedColor
		});

		closeModal();
	}
</script>

<Modal
	bind:showModal={show}
	size="md"
	title={editMode ? 'Edit folder' : 'Create a new folder'}
	onClose={resetForm}
>
	{#snippet children()}
		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleSubmit();
			}}
			class="space-y-4"
		>
			<!-- Folder Name -->
			<label class="label">
				<span>Folder name</span>
				<input
					type="text"
					class="input"
					bind:value={name}
					placeholder="For example: Mathematics, English"
					required
				/>
			</label>

			<!-- Description -->
			<label class="label">
				<span>Description (optional)</span>
				<textarea
					class="textarea"
					bind:value={description}
					placeholder="Add a description for this folder"
					rows="3"
				></textarea>
			</label>

			<!-- Color Picker -->
			<div>
				<span class="label">Choose color</span>
				<div class="mt-2 grid grid-cols-4 gap-2">
					{#each colors as color}
						<!-- svelte-ignore a11y_consider_explicit_label -->
						<button
							type="button"
							class="h-10 w-full rounded-lg transition-all {selectedColor === color
								? 'ring-2 ring-offset-2 ring-offset-surface-100-900'
								: ''}"
							style="background-color: {color}"
							onclick={() => (selectedColor = color)}
						></button>
					{/each}
				</div>
			</div>

			<!-- Preview -->
			<div class="card preset-tonal p-4">
				<div class="flex items-center space-x-3">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-lg"
						style="background-color: {selectedColor}"
					>
						<Folder class="h-6 w-6 text-white" />
					</div>
					<div>
						<p class="font-semibold">{name || 'Folder name'}</p>
						<p class="text-sm text-surface-600-400">
							{description || 'Folder description'}
						</p>
					</div>
				</div>
			</div>

			<!-- Actions -->
			<div class="flex justify-end space-x-2 pt-4">
				<button type="button" class=" btn preset-tonal" onclick={closeModal}> Cancel </button>
				<button type="submit" class="btn preset-filled-primary-50-950">
					{editMode ? 'Save changes' : 'Create folder'}
				</button>
			</div>
		</form>
	{/snippet}
</Modal>
