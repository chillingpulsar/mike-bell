<script lang="ts">
	import Button from '$lib/components/internals/button/button.svelte';
	import IconMacOs from '$lib/assets/macos.svg';
	import IconWindows from '$lib/assets/windows.svg';
	import IconLinux from '$lib/assets/linux.svg';
	import SeoHeader from '$lib/components/externals/seo/seo-header.svelte';
	import { page } from '$app/state';

	let videoReady = $state(false);

	const seo = $state({
		title: 'stricky — Give your clicks character',
		description:
			'Keyboard and mouse "vibes" inspired by keybell, MechVibes, and other livestream sound-effect setups. A simple, useful desktop app built with Tauri and Svelte—lightweight, responsive, and close to native performance. Downloads for macOS, Windows, and Linux.',
		keywords:
			'stricky, Mike Bell, Tauri, Svelte, desktop app, download, macOS, Windows, Linux, keyboard sounds, mouse sounds',
		image: {
			url: `${page.url.origin}/og.png`,
			alt: 'stricky',
			width: 1200,
			height: 630
		}
	});

	const platforms = [
		{
			name: 'macOS',
			icon: IconMacOs,
			alt: 'macOS icon',
			description: 'Native .app and .dmg installers',
			href: 'https://github.com/chillingpulsar/mike-bell/blob/main/app/INSTALL_GUIDE_MACOS.md'
		},
		{
			name: 'Windows',
			icon: IconWindows,
			alt: 'Windows icon',
			description: 'NSIS and MSI installers',
			href: 'https://github.com/chillingpulsar/mike-bell/blob/main/app/INSTALL_GUIDE_WINDOWS.md'
		},
		{
			name: 'Linux',
			icon: IconLinux,
			alt: 'Linux icon',
			description: '.deb, .rpm, and AppImage packages',
			href: 'https://github.com/chillingpulsar/mike-bell/blob/main/app/INSTALL_GUIDE_LINUX.md'
		}
	] as const;
</script>

<SeoHeader
	primaryTags={{
		title: seo.title,
		description: seo.description,
		keywords: seo.keywords,
		image: seo.image,
		url: page.url.origin,
		author: 'stricky'
	}}
	facebookTags={{
		type: 'website',
		url: page.url.origin,
		title: seo.title,
		description: seo.description,
		locale: 'en_US',
		siteName: 'stricky'
	}}
	twitterTags={{
		url: page.url.origin,
		title: seo.title,
		description: seo.description,
		image: seo.image
	}}
/>

<main class="flex min-h-screen flex-col items-center justify-center gap-16 px-4 py-20">
	<!-- Hero -->
	<section class="flex flex-col items-center justify-center">
		<p class="text-center text-sm font-medium tracking-widest text-muted-foreground uppercase">
			stricky
		</p>
		<h1 class="text-center text-4xl leading-normal font-bold tracking-tighter md:text-6xl">
			Give your clicks <br /><span
				class="bg-linear-to-r from-primary to-destructive bg-clip-text text-transparent"
				>character.</span
			>
		</h1>
		<p class="mt-6 max-w-lg text-center text-muted-foreground">
			Keyboard and mouse "vibes" inspired by keybell, MechVibes, and other livestream sound-effect
			setups. Built with
			<a
				class="underline decoration-muted-foreground/50 underline-offset-4 hover:decoration-foreground"
				href="https://tauri.app"
			>
				Tauri
			</a>
			and
			<a
				class="underline decoration-muted-foreground/50 underline-offset-4 hover:decoration-foreground"
				href="https://svelte.dev"
			>
				Svelte
			</a>
			—lightweight, responsive, and close to native performance.
		</p>
	</section>

	<!-- Demo Video -->
	<section class="w-full max-w-4xl" style="display: {videoReady ? 'block' : 'none'}">
		<video
			controls
			autoplay
			muted
			playsinline
			preload="auto"
			onloadeddata={() => {
				videoReady = true;
			}}
			onerror={() => {
				console.error('Error loading demo video');
			}}
			src="/demo.mp4"
			class="aspect-video w-full rounded-lg object-cover shadow-lg transition-all duration-300"
		></video>
	</section>

	<!-- Download Cards -->
	<section class="w-full max-w-3xl">
		<h2 class="mb-6 text-center text-2xl font-semibold tracking-tight">Install stricky</h2>
		<div class="grid gap-4 sm:grid-cols-3">
			{#each platforms as platform (platform.name)}
				<a
					href={platform.href}
					target="_blank"
					rel="noopener noreferrer"
					class="group flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6 text-center transition-all duration-200 hover:border-foreground/25 hover:shadow-md"
				>
					<img src={platform.icon} alt={platform.alt} class="size-12" />
					<div>
						<h3 class="text-lg font-semibold">{platform.name}</h3>
						<p class="mt-1 text-sm text-muted-foreground">{platform.description}</p>
					</div>
					<Button variant="outline" size="sm" class="mt-2 w-full">View Install Guide</Button>
				</a>
			{/each}
		</div>
	</section>

	<!-- Footer -->
	<footer
		class="mt-auto flex flex-col items-center gap-2 pt-16 pb-8 text-center text-xs text-muted-foreground"
	>
		<a
			class="underline decoration-muted-foreground/50 underline-offset-4 hover:decoration-foreground"
			href="https://github.com/chillingpulsar/mike-bell"
			target="_blank"
			rel="noopener noreferrer"
		>
			GitHub
		</a>
		<span>Licensed under GPLv3</span>
	</footer>
</main>
