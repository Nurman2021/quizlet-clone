<script>
	import Modal from '$lib/components/Modal.svelte';
	import { Plus, Trash2, Settings, AlertTriangle, User, Mail } from 'lucide-svelte';

	// State untuk berbagai modal
	let showSizeXS = $state(false);
	let showSizeSM = $state(false);
	let showSizeMD = $state(false);
	let showSizeLG = $state(false);
	let showSizeXL = $state(false);
	let showFullscreen = $state(false);
	let showTopCenter = $state(false);
	let showConfirmDelete = $state(false);
	let showFormModal = $state(false);
	let showCustomHeader = $state(false);

	// Test position states
	let showCenterTest = $state(false);
	let showTopCenterTest = $state(false);

	// Form data
	let formData = $state({
		name: '',
		email: '',
		message: ''
	});

	// Functions
	function resetForm() {
		formData = { name: '', email: '', message: '' };
	}

	function handleFormSubmit() {
		console.log('Form submitted:', formData);
		alert(
			`Form submitted!\nName: ${formData.name}\nEmail: ${formData.email}\nMessage: ${formData.message}`
		);
		showFormModal = false;
		resetForm();
	}

	function confirmDelete() {
		alert('Item deleted successfully!');
		showConfirmDelete = false;
	}

	function handleModalClose() {
		console.log('Modal closed via callback');
	}
</script>

<svelte:head>
	<title>Modal Test Page</title>
</svelte:head>

<div class="container mx-auto space-y-8 p-6">
	<div class="mb-8 text-center">
		<h1 class="mb-4 text-4xl font-bold">Modal Component Test</h1>
		<p class="text-surface-600-300-token text-lg">
			Test all features of the reusable Modal component
		</p>

		<!-- Quick Position Test -->
		<div class="mt-6 flex justify-center space-x-4">
			<button class="variant-filled-primary btn" onclick={() => (showCenterTest = true)}>
				Test Center Position
			</button>
			<button class="variant-filled-secondary btn" onclick={() => (showTopCenterTest = true)}>
				Test Top-Center Position
			</button>
		</div>
	</div>

	<!-- Size Tests -->
	<section class="space-y-4">
		<h2 class="border-surface-300-600-token border-b pb-2 text-2xl font-semibold">
			Size Variations
		</h2>
		<div class="grid grid-cols-2 gap-4 md:grid-cols-5">
			<button class="variant-filled-primary btn" onclick={() => (showSizeXS = true)}>
				XS Modal
			</button>
			<button class="variant-filled-secondary btn" onclick={() => (showSizeSM = true)}>
				SM Modal
			</button>
			<button class="variant-filled-tertiary btn" onclick={() => (showSizeMD = true)}>
				MD Modal
			</button>
			<button class="variant-filled-warning btn" onclick={() => (showSizeLG = true)}>
				LG Modal
			</button>
			<button class="variant-filled-success btn" onclick={() => (showSizeXL = true)}>
				XL Modal
			</button>
		</div>
	</section>

	<!-- Position & Special Features -->
	<section class="space-y-4">
		<h2 class="border-surface-300-600-token border-b pb-2 text-2xl font-semibold">
			Position & Features
		</h2>
		<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
			<button class="variant-filled-surface btn" onclick={() => (showTopCenter = true)}>
				Top Center
			</button>
			<button class="variant-ghost-error btn" onclick={() => (showFullscreen = true)}>
				Fullscreen
			</button>
			<button class="variant-filled-primary btn" onclick={() => (showCustomHeader = true)}>
				Custom Header
			</button>
			<button class="variant-outlined-secondary btn" onclick={() => (showFormModal = true)}>
				Form Modal
			</button>
		</div>
	</section>

	<!-- Real Use Cases -->
	<section class="space-y-4">
		<h2 class="border-surface-300-600-token border-b pb-2 text-2xl font-semibold">
			Real Use Cases
		</h2>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<button class="variant-filled-error btn" onclick={() => (showConfirmDelete = true)}>
				<Trash2 class="h-4 w-4" />
				Delete Confirmation
			</button>
			<button class="variant-filled-success btn" onclick={() => (showFormModal = true)}>
				<Plus class="h-4 w-4" />
				Contact Form
			</button>
		</div>
	</section>
</div>

<!-- Size Test Modals -->
<Modal bind:showModal={showSizeXS} size="xs" title="Extra Small Modal">
	{#snippet children()}
		<p class="text-sm">
			This is an XS modal (~320px width). Perfect for simple confirmations or alerts.
		</p>
		<div class="mt-4 flex justify-end">
			<button class="variant-ghost-surface btn btn-sm" onclick={() => (showSizeXS = false)}>
				Close
			</button>
		</div>
	{/snippet}
</Modal>

<Modal bind:showModal={showSizeSM} size="sm" title="Small Modal">
	{#snippet children()}
		<p>This is a Small modal (~384px width). Good for quick forms or notifications.</p>
		<div class="mt-4 space-y-2">
			<p class="text-surface-600-300-token text-sm">Features:</p>
			<ul class="list-inside list-disc space-y-1 text-sm">
				<li>Responsive design</li>
				<li>ESC key support</li>
				<li>Backdrop click to close</li>
			</ul>
		</div>
		<div class="mt-6 flex justify-end">
			<button class="variant-filled-primary btn btn-sm" onclick={() => (showSizeSM = false)}>
				Got it!
			</button>
		</div>
	{/snippet}
</Modal>

<Modal bind:showModal={showSizeMD} size="md" title="Medium Modal (Default)">
	{#snippet children()}
		<div class="space-y-4">
			<p>This is a Medium modal (~448px width). The default size for most use cases.</p>
			<div class="bg-surface-100-800-token rounded-lg p-4">
				<h4 class="mb-2 font-medium">Perfect for:</h4>
				<ul class="space-y-1 text-sm">
					<li>• Contact forms</li>
					<li>• Settings panels</li>
					<li>• Content previews</li>
					<li>• User profiles</li>
				</ul>
			</div>
			<div class="flex justify-end space-x-2">
				<button class="variant-ghost-surface btn" onclick={() => (showSizeMD = false)}>
					Cancel
				</button>
				<button class="variant-filled-primary btn" onclick={() => (showSizeMD = false)}>
					Confirm
				</button>
			</div>
		</div>
	{/snippet}
</Modal>

<Modal bind:showModal={showSizeLG} size="lg" title="Large Modal">
	{#snippet children()}
		<div class="space-y-4">
			<p>This is a Large modal (~512px width). Great for detailed content or complex forms.</p>
			<div class="grid grid-cols-2 gap-4">
				<div class="rounded-lg bg-primary-500/10 p-4">
					<h5 class="mb-2 font-medium text-primary-500">Advantage</h5>
					<p class="text-sm">More space for complex layouts and detailed information.</p>
				</div>
				<div class="rounded-lg bg-secondary-500/10 p-4">
					<h5 class="mb-2 font-medium text-secondary-500">Use Case</h5>
					<p class="text-sm">Product details, image galleries, multi-step forms.</p>
				</div>
			</div>
			<div class="border-surface-300-600-token border-t pt-4">
				<div class="flex items-center justify-between">
					<span class="text-surface-600-300-token text-sm">Modal size: Large (lg)</span>
					<button class="variant-filled-tertiary btn" onclick={() => (showSizeLG = false)}>
						Close Large Modal
					</button>
				</div>
			</div>
		</div>
	{/snippet}
</Modal>

<Modal bind:showModal={showSizeXL} size="xl" title="Extra Large Modal">
	{#snippet children()}
		<div class="space-y-6">
			<p>This is an Extra Large modal (~576px width). Maximum width for desktop experiences.</p>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div class="rounded-lg bg-success-500/10 p-4 text-center">
					<div
						class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-success-500"
					>
						<Plus class="h-6 w-6 text-white" />
					</div>
					<h6 class="font-medium">Create</h6>
					<p class="mt-1 text-xs">Add new content</p>
				</div>
				<div class="rounded-lg bg-warning-500/10 p-4 text-center">
					<div
						class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-warning-500"
					>
						<Settings class="h-6 w-6 text-white" />
					</div>
					<h6 class="font-medium">Configure</h6>
					<p class="mt-1 text-xs">Adjust settings</p>
				</div>
				<div class="rounded-lg bg-error-500/10 p-4 text-center">
					<div
						class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-error-500"
					>
						<Trash2 class="h-6 w-6 text-white" />
					</div>
					<h6 class="font-medium">Delete</h6>
					<p class="mt-1 text-xs">Remove items</p>
				</div>
			</div>

			<div class="bg-surface-100-800-token rounded-lg p-4">
				<h5 class="mb-2 font-medium">Best Practices:</h5>
				<ol class="list-inside list-decimal space-y-1 text-sm">
					<li>Use for dashboard panels or detailed views</li>
					<li>Ensure mobile responsiveness</li>
					<li>Consider fullscreen for very complex content</li>
					<li>Keep scroll areas manageable</li>
				</ol>
			</div>

			<div class="flex justify-end space-x-2">
				<button class="variant-ghost-surface btn" onclick={() => (showSizeXL = false)}>
					Close
				</button>
				<button class="variant-filled-success btn" onclick={() => (showSizeXL = false)}>
					Understood
				</button>
			</div>
		</div>
	{/snippet}
</Modal>

<!-- Position Test Modal -->
<Modal bind:showModal={showTopCenter} size="md" position="top-center" title="Top Center Position">
	{#snippet children()}
		<div class="space-y-4">
			<p>
				This modal appears at the top-center of the screen, perfect for notifications or alerts that
				don't need to block the entire view.
			</p>
			<div class="rounded-lg border border-warning-500/20 bg-warning-500/10 p-4">
				<div class="flex items-center space-x-2">
					<AlertTriangle class="h-5 w-5 text-warning-500" />
					<span class="font-medium text-warning-700 dark:text-warning-400"
						>Position: top-center</span
					>
				</div>
				<p class="mt-2 text-sm text-warning-600 dark:text-warning-300">
					Great for non-intrusive notifications and status updates.
				</p>
			</div>
			<button class="variant-filled-primary btn w-full" onclick={() => (showTopCenter = false)}>
				Dismiss Notification
			</button>
		</div>
	{/snippet}
</Modal>

<!-- Custom Header Modal -->
<Modal bind:showModal={showCustomHeader} size="lg">
	{#snippet header()}
		<div class="flex items-center space-x-3">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary-500 to-secondary-500"
			>
				<User class="h-5 w-5 text-white" />
			</div>
			<div>
				<h2 class="text-xl font-semibold">User Profile Settings</h2>
				<p class="text-surface-600-300-token text-sm">Manage your account preferences</p>
			</div>
		</div>
	{/snippet}

	{#snippet children()}
		<div class="space-y-6">
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div>
					<h3 class="mb-3 font-medium">Personal Information</h3>
					<div class="space-y-3">
						<div>
							<label class="label">
								<span>Display Name</span>
								<input class="input" type="text" value="John Doe" />
							</label>
						</div>
						<div>
							<label class="label">
								<span>Email</span>
								<input class="input" type="email" value="john@example.com" />
							</label>
						</div>
					</div>
				</div>

				<div>
					<h3 class="mb-3 font-medium">Preferences</h3>
					<div class="space-y-3">
						<label class="flex items-center space-x-2">
							<input class="checkbox" type="checkbox" checked />
							<span>Email notifications</span>
						</label>
						<label class="flex items-center space-x-2">
							<input class="checkbox" type="checkbox" />
							<span>Dark mode</span>
						</label>
						<label class="flex items-center space-x-2">
							<input class="checkbox" type="checkbox" checked />
							<span>Auto-save</span>
						</label>
					</div>
				</div>
			</div>

			<div class="border-surface-300-600-token flex justify-end space-x-2 border-t pt-4">
				<button class="variant-ghost-surface btn" onclick={() => (showCustomHeader = false)}>
					Cancel
				</button>
				<button class="variant-filled-primary btn" onclick={() => (showCustomHeader = false)}>
					Save Changes
				</button>
			</div>
		</div>
	{/snippet}
</Modal>

<!-- Form Modal -->
<Modal bind:showModal={showFormModal} size="md" title="Contact Us">
	{#snippet children()}
		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleFormSubmit();
			}}
			class="space-y-4"
		>
			<div>
				<label class="label">
					<span class="flex items-center space-x-1">
						<User class="h-4 w-4" />
						<span>Full Name *</span>
					</span>
					<input
						class="input"
						type="text"
						bind:value={formData.name}
						placeholder="Enter your full name"
						required
					/>
				</label>
			</div>

			<div>
				<label class="label">
					<span class="flex items-center space-x-1">
						<Mail class="h-4 w-4" />
						<span>Email Address *</span>
					</span>
					<input
						class="input"
						type="email"
						bind:value={formData.email}
						placeholder="Enter your email"
						required
					/>
				</label>
			</div>

			<div>
				<label class="label">
					<span>Message *</span>
					<textarea
						class="textarea"
						bind:value={formData.message}
						placeholder="What can we help you with?"
						rows="4"
						required
					></textarea>
				</label>
			</div>

			<div class="bg-surface-100-800-token rounded p-3 text-sm">
				<p class="text-surface-600-300-token">
					We'll get back to you within 24 hours. Your information is kept confidential.
				</p>
			</div>

			<div class="flex justify-end space-x-2 pt-4">
				<button
					type="button"
					class="variant-ghost-surface btn"
					onclick={() => {
						showFormModal = false;
						resetForm();
					}}
				>
					Cancel
				</button>
				<button type="submit" class="variant-filled-primary btn"> Send Message </button>
			</div>
		</form>
	{/snippet}
</Modal>

<!-- Delete Confirmation Modal -->
<Modal bind:showModal={showConfirmDelete} size="sm" position="top-center">
	{#snippet children()}
		<div class="space-y-4 text-center">
			<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error-500/10">
				<Trash2 class="h-8 w-8 text-error-500" />
			</div>

			<div>
				<h3 class="text-lg font-semibold text-error-500">Delete Item</h3>
				<p class="text-surface-600-300-token mt-2">
					Are you sure you want to delete this item? This action cannot be undone.
				</p>
			</div>

			<div class="rounded border border-error-500/20 bg-error-500/5 p-3 text-sm">
				<p class="text-error-600 dark:text-error-400">
					⚠️ This will permanently remove the selected item and all associated data.
				</p>
			</div>

			<div class="flex space-x-2 pt-2">
				<button
					class="variant-ghost-surface btn flex-1"
					onclick={() => (showConfirmDelete = false)}
				>
					Cancel
				</button>
				<button class="variant-filled-error btn flex-1" onclick={confirmDelete}> Delete </button>
			</div>
		</div>
	{/snippet}
</Modal>

<!-- Position Test Modals -->
<Modal bind:showModal={showCenterTest} size="md" position="center" title="Center Position Test">
	{#snippet children()}
		<div class="space-y-4">
			<p>This modal should appear in the <strong>center</strong> of the screen.</p>
			<div class="rounded-lg border border-primary-500/20 bg-primary-500/10 p-4">
				<p class="text-sm"><strong>Position:</strong> center</p>
				<p class="text-sm"><strong>CSS Transform:</strong> translate(-50%, -50%)</p>
				<p class="text-sm"><strong>CSS Position:</strong> top: 50%, left: 50%</p>
			</div>
			<button class="variant-filled-primary btn w-full" onclick={() => (showCenterTest = false)}>
				Close Center Modal
			</button>
		</div>
	{/snippet}
</Modal>

<Modal
	bind:showModal={showTopCenterTest}
	size="md"
	position="top-center"
	title="Top-Center Position Test"
>
	{#snippet children()}
		<div class="space-y-4">
			<p>This modal should appear at the <strong>top-center</strong> of the screen.</p>
			<div class="rounded-lg border border-secondary-500/20 bg-secondary-500/10 p-4">
				<p class="text-sm"><strong>Position:</strong> top-center</p>
				<p class="text-sm"><strong>CSS Transform:</strong> translateX(-50%)</p>
				<p class="text-sm"><strong>CSS Position:</strong> top: 10%, left: 50%</p>
			</div>
			<div class="rounded border border-warning-500/20 bg-warning-500/10 p-3 text-sm">
				<p class="text-warning-600 dark:text-warning-400">
					💡 Perfect for notifications, alerts, or non-intrusive dialogs
				</p>
			</div>
			<button
				class="variant-filled-secondary btn w-full"
				onclick={() => (showTopCenterTest = false)}
			>
				Close Top-Center Modal
			</button>
		</div>
	{/snippet}
</Modal>
