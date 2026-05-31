<script lang="ts">
	import Button from '$lib/components/internals/button/button.svelte';
	import IconMacOs from '$lib/assets/macos.svg';
	import IconWindows from '$lib/assets/windows.svg';
	import IconLinux from '$lib/assets/linux.svg';
	import SeoHeader from '$lib/components/externals/seo/seo-header.svelte';
	import { page } from '$app/state';

	let videoReady = $state(false);

	const brand = 'Mike Bell';

	const seo = {
		title: `${brand} — Give your clicks character`,
		description:
			'Keyboard and mouse "vibes" inspired by keybell, MechVibes, and other livestream sound-effect setups. A simple, useful desktop app built with Tauri and Svelte\u2014lightweight, responsive, and close to native performance. Downloads for macOS, Windows, and Linux.',
		keywords:
			'Mike Bell, Tauri, Svelte, desktop app, download, macOS, Windows, Linux, keyboard sounds, mouse sounds',
		image: {
			url: `${page.url.origin}/og.png`,
			alt: brand,
			width: 1200,
			height: 630
		}
	};

	const linkClass =
		'underline decoration-muted-foreground/50 underline-offset-4 hover:decoration-foreground transition-colors';

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
		author: brand
	}}
	facebookTags={{
		type: 'website',
		url: page.url.origin,
		title: seo.title,
		description: seo.description,
		locale: 'en_US',
		siteName: brand
	}}
	twitterTags={{
		url: page.url.origin,
		title: seo.title,
		description: seo.description,
		image: seo.image
	}}
/>

<main class="flex min-h-dvh flex-col items-center justify-center gap-24 px-6 py-24">
	<!-- Hero -->
	<section class="flex max-w-3xl flex-col items-center gap-6 text-center">
		<p class="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">{brand}</p>
		<h1 class="text-5xl leading-[1.1] font-semibold tracking-tight text-balance md:text-7xl">
			Give your clicks<br />
			<span class="bg-linear-to-r from-primary to-muted-foreground bg-clip-text text-transparent">
				character.
			</span>
		</h1>
		<p class="max-w-xl text-lg leading-relaxed text-muted-foreground">
			Keyboard and mouse vibes inspired by
			<a class={linkClass} href="https://github.com/nicholasbalasus/keybell">keybell</a>,
			<a class={linkClass} href="https://mechvibes.com">MechVibes</a>, and other livestream
			sound-effect setups. Built with
			<a class={linkClass} href="https://tauri.app">Tauri</a>
			and
			<a class={linkClass} href="https://svelte.dev">Svelte</a> &mdash; lightweight, responsive, and close
			to native performance.
		</p>
	</section>

	<!-- Demo Video -->
	{#if videoReady}
		<section class="">
			<video
				controls
				autoplay
				muted
				playsinline
				preload="auto"
				onloadeddata={() => {
					videoReady = true;
				}}
				src="https://auyvdlzajikidihnhbgy.supabase.co/storage/v1/object/public/portfolio-storage/external/demo-mike-bell.mp4"
				class="rounded-2xl object-contain shadow-2xl"
			></video>
		</section>
	{:else}
		<!-- svelte-ignore a11y_media_has_caption -->
		<video
			preload="auto"
			onloadeddata={() => {
				videoReady = true;
			}}
			src="https://auyvdlzajikidihnhbgy.supabase.co/storage/v1/object/public/portfolio-storage/external/demo-mike-bell.mp4"
			class="hidden"
		></video>
	{/if}

	<!-- Download Cards -->
	<section class="w-full max-w-3xl">
		<h2
			class="mb-8 text-center text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase"
		>
			Install
		</h2>
		<div class="grid gap-4 sm:grid-cols-3">
			{#each platforms as { name, icon, alt, description, href } (name)}
				<a
					{href}
					target="_blank"
					rel="external noopener noreferrer"
					class="group flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-card/50 p-8 text-center backdrop-blur-sm transition-all duration-300 hover:border-foreground/15 hover:bg-card hover:shadow-xl"
				>
					<img
						src={icon}
						{alt}
						class="size-10 opacity-80 transition-opacity group-hover:opacity-100"
					/>
					<div>
						<h3 class="text-base font-semibold tracking-tight">{name}</h3>
						<p class="mt-1 text-sm text-muted-foreground">{description}</p>
					</div>
					<Button variant="outline" size="sm" class="mt-2 w-full">Install Guide</Button>
				</a>
			{/each}
		</div>
	</section>

	<!-- Footer -->
	<footer class="mt-auto flex flex-col items-center gap-3 pt-20 pb-10 text-center">
		<a
			class={linkClass}
			href="https://github.com/chillingpulsar/mike-bell"
			target="_blank"
			rel="noopener noreferrer"
		>
			GitHub
		</a>
		<span class="text-xs text-muted-foreground">
			&copy; {new Date().getFullYear()}
			{brand}. Licensed under GPLv3 with a
			<a class={linkClass} href="https://github.com/chillingpulsar/mike-bell/blob/main/LICENSE">
				commercial use restriction</a
			>.
		</span>
	</footer>
</main>
