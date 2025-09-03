<script>
	import { quintOut } from 'svelte/easing';
	import { XIcon } from 'lucide-svelte';

	let {
		showModal = $bindable(),
		size = 'md',
		fullscreen = false,
		position = 'center',
		title = '',
		onClose = null,
		header,
		children
	} = $props();

	// Size mappings
	const sizeClasses = {
		xs: 'max-w-xs w-full',
		sm: 'max-w-sm w-full',
		md: 'max-w-md w-full',
		lg: 'max-w-lg w-full',
		xl: 'max-w-xl w-full'
	};

	// Simple modal transition seperti kode internet
	const modalTransition = (node, { duration = 300 } = {}) => {
		const transform = getComputedStyle(node).transform;

		return {
			duration,
			easing: quintOut,
			css: (t, u) => {
				return `transform: ${transform} scale(${t}) translateY(${u * -50}px)`;
			}
		};
	};

	const positionStyles = $derived(() => {
		if (fullscreen) {
			return 'top: 0; left: 0; right: 0; bottom: 0; transform: none;';
		}
		switch (position) {
			case 'top-center':
				return 'top: 10%; left: 50%; transform: translateX(-50%);';
			case 'center':
			default:
				return 'top: 50%; left: 50%; transform: translate(-50%, -50%);';
		}
	});

	const modalClasses = $derived(
		fullscreen
			? 'w-screen h-screen max-w-none max-h-none rounded-none'
			: `${sizeClasses[size]} max-h-[calc(100vh-4rem)] rounded-lg`
	);

	function handleKeydown(event) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}

	function closeModal() {
		showModal = false;
		onClose?.();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Backdrop - Always rendered, visibility controlled by showModal -->
<div
	class="modal-background fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
	class:visible={showModal}
	onclick={closeModal}
	onkeydown={() => {}}
	role="button"
	tabindex="-1"
></div>

<!-- Modal - Always rendered, transition controlled by showModal -->
{#if showModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="modal fixed z-50 {modalClasses}"
		class:fullscreen
		style={positionStyles()}
		transition:modalTransition={{ duration: 300 }}
		onclick={(e) => e.stopPropagation()}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div class="modal-content bg-surface-100-900 text-surface-900-100 shadow-xl">
			{#if header || title}
				<div class="modal-header border-b border-surface-300-700 px-6 py-4">
					{#if header}
						{@render header()}
					{:else if title}
						<h2 class="text-xl font-semibold">{title}</h2>
					{/if}

					<button
						onclick={closeModal}
						class="absolute top-4 right-4 btn-icon btn-icon-sm preset-tonal-surface"
						aria-label="Close modal"
					>
						<XIcon class="h-4 w-4" />
					</button>
				</div>
			{/if}

			<div class="modal-body flex-1 overflow-y-auto px-6 py-4">
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-background {
		cursor: pointer;
		opacity: 0;
		visibility: hidden;
		transition: all 0.2s ease;
	}

	.modal-background.visible {
		opacity: 1;
		visibility: visible;
	}

	.modal {
		cursor: default;
	}

	.modal-content {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		max-height: inherit;
		border-radius: inherit;
		overflow: hidden;
	}

	.modal-header {
		position: relative;
		flex-shrink: 0;
	}

	.modal-body {
		flex: 1;
		min-height: 0;
	}

	.fullscreen {
		position: fixed !important;
		width: 100vw !important;
		height: 100vh !important;
		max-width: none !important;
		max-height: none !important;
		border-radius: 0 !important;
	}

	.fullscreen .modal-content {
		border-radius: 0;
		height: 100vh;
	}
</style>
