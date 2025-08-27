<script>
	let {
		showModal = $bindable(),
		size = 'md', // xs, sm, md, lg, xl
		fullscreen = false, // boolean untuk fullscreen
		position = 'center', // center, top-center
		title = '', // judul modal
		onClose = null, // callback saat modal ditutup
		header,
		children
	} = $props();

	let dialog = $state(); // HTMLDialogElement

	// Size mappings
	const sizeClasses = {
		xs: 'max-w-xs w-full', // ~20rem (320px)
		sm: 'max-w-sm w-full', // ~24rem (384px)
		md: 'max-w-md w-full', // ~28rem (448px)
		lg: 'max-w-lg w-full', // ~32rem (512px)
		xl: 'max-w-xl w-full' // ~36rem (576px)
	};

	// Position mappings - untuk styling dialog
	const positionClasses = {
		center: 'items-center justify-center',
		'top-center': 'items-start justify-center pt-16'
	};

	// Computed classes
	const modalClasses = $derived(
		fullscreen
			? 'w-screen h-screen max-w-none max-h-none m-0 rounded-none'
			: `${sizeClasses[size]} max-h-[90vh] rounded-lg`
	);

	// Position styles untuk dialog
	const positionStyles = $derived(() => {
		if (fullscreen) return '';

		switch (position) {
			case 'top-center':
				return 'top: 10%; transform: translateX(-50%); left: 50%; position: fixed;';
			case 'center':
			default:
				return 'top: 50%; left: 50%; transform: translate(-50%, -50%); position: fixed;';
		}
	});

	$effect(() => {
		if (showModal) {
			dialog?.showModal();
		}
	});

	// Handle ESC key
	function handleKeydown(event) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}

	function closeModal() {
		showModal = false;
		onClose?.();
		dialog?.close();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialog}
	onclose={() => (showModal = false)}
	onclick={(e) => {
		if (e.target === dialog) closeModal();
	}}
	class="modal-dialog {modalClasses}"
	class:fullscreen
	style={positionStyles()}
>
	<!-- Modal Content -->
	<div class="modal-content bg-surface-100-800-token text-surface-900-50-token shadow-xl">
		<!-- Header -->
		{#if header || title}
			<div class="modal-header border-surface-300-600-token border-b px-6 py-4">
				{#if header}
					{@render header()}
				{:else if title}
					<h2 class="text-xl font-semibold">{title}</h2>
				{/if}

				<!-- Close button -->
				<button
					onclick={closeModal}
					class="absolute top-4 right-4 btn-icon btn-icon-sm preset-tonal-surface"
					aria-label="Close modal"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
		{/if}

		<!-- Body -->
		<div class="modal-body flex-1 overflow-y-auto px-6 py-4">
			{@render children?.()}
		</div>
	</div>
</dialog>

<style>
	.modal-dialog {
		border: none;
		padding: 0;
		background: transparent;
		overflow: visible;
		margin: 0; /* Remove default margin */
	}

	.modal-dialog::backdrop {
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
	}

	.modal-content {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		max-height: inherit;
	}

	.modal-header {
		position: relative;
		flex-shrink: 0;
	}

	.modal-body {
		flex: 1;
		min-height: 0;
	}

	/* Fullscreen styles */
	.modal-dialog.fullscreen {
		position: fixed !important;
		top: 0 !important;
		left: 0 !important;
		right: 0;
		bottom: 0;
		transform: none !important;
		width: 100vw !important;
		height: 100vh !important;
		max-width: none !important;
		max-height: none !important;
		display: flex;
		align-items: stretch;
	}

	/* Animations */
	.modal-dialog[open] {
		animation: modalZoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.modal-dialog.fullscreen[open] {
		animation: modalSlide 0.3s ease-out;
	}

	/* Position-specific animations */
	@keyframes modalZoom {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes modalSlide {
		from {
			transform: translateY(-100%);
		}
		to {
			transform: translateY(0);
		}
	}

	.modal-dialog[open]::backdrop {
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
