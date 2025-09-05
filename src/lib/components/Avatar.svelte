<script>
	import { getAvatarUrl, DEFAULT_AVATAR } from '$lib/config/avatars.js';

	// Props
	export let user = null;
	export let size = 'md'; // xs, sm, md, lg, xl
	export let ring = false;
	export let className = '';

	// Size variants
	const sizeClasses = {
		xs: 'h-6 w-6',
		sm: 'h-8 w-8',
		md: 'h-12 w-12',
		lg: 'h-16 w-16',
		xl: 'h-20 w-20'
	};

	// Reactive avatar URL with fallback
	$: avatarUrl = user
		? getAvatarUrl(user.avatar_id) || user.avatar_url || DEFAULT_AVATAR.url
		: DEFAULT_AVATAR.url;

	// Reactive user display name
	$: userName = user
		? user.display_name || user.full_name || user.email?.split('@')[0] || 'User'
		: 'User';
</script>

<div class="relative {className}">
	<img
		src={avatarUrl}
		alt={userName}
		class="rounded-full object-cover {sizeClasses[size]} {ring
			? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-surface-50-950'
			: ''}"
		loading="lazy"
	/>

	<!-- Online indicator slot -->
	{#if $$slots.indicator}
		<div class="absolute -right-0.5 -bottom-0.5">
			<slot name="indicator" />
		</div>
	{/if}
</div>
