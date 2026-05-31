<script lang="ts">
	import './layout.css';
	import icon from '$lib/assets/icon.png';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={icon} /></svelte:head>
{@render children()}
