<script lang="ts">
	import Button from '$lib/components/internals/button/button.svelte';
	import IconMacOs from '$lib/assets/macos.svg';
	import IconWindows from '$lib/assets/windows.svg';
	import IconLinux from '$lib/assets/linux.svg';
	import SeoHeader from '$lib/components/externals/seo/seo-header.svelte';
	import { page } from '$app/state';

	let videoReady = $state(false);

	const seo = $state({
		title: 'Mike Bell — Give your clicks character',
		description:
			'About Keyboard and mouse "vibes" inspired by keybell, MechVibes, and other livestream sound-effect setups. A simple, useful desktop app built with Tauri and Svelte—lightweight, responsive, and close to native performance. Downloads for macOS, Windows, and Linux.',
		keywords: 'Mike Bell, Tauri, Svelte, desktop app, download, macOS, Windows, Linux',
		image: {
			url: `${page.url.origin}/og.png`,
			alt: 'Mike Bell',
			width: 1200,
			height: 630
		}
	});
</script>

<SeoHeader
	primaryTags={{
		title: seo.title,
		description:
			'A simple, useful desktop app built with Tauri and Svelte—lightweight, responsive, and close to native performance. Downloads for macOS, Windows, and Linux.',
		keywords: 'Mike Bell, Tauri, Svelte, desktop app, download, macOS, Windows, Linux',
		image: seo.image,
		url: page.url.origin,
		author: 'Mike Bell'
	}}
	facebookTags={{
		type: 'website',
		url: page.url.origin,
		title: seo.title,
		description: seo.description,
		locale: 'en_US',
		siteName: 'Mike Bell'
	}}
	twitterTags={{
		url: page.url.origin,
		title: seo.title,
		description: seo.description,
		image: seo.image
	}}
/>

<main class="flex min-h-screen flex-col items-center justify-center gap-12 p-4">
	<section class="mt-16 flex flex-col items-center justify-center">
		<p class="text-center font-medium text-muted-foreground">
			Mile Bell - a simple, yet useful tool.
		</p>
		<h1 class="text-center text-4xl leading-normal font-bold tracking-tighter md:text-6xl">
			Give your clicks <br /><span
				class="bg-linear-to-r from-primary to-destructive bg-clip-text text-transparent"
				>character.</span
			>
		</h1>
		<p class="mt-6 max-w-lg text-center text-muted-foreground">
			Built with
			<a
				class="underline decoration-muted-foreground/50 underline-offset-4 hover:decoration-foreground"
				href="https://tauri.app"
				>Tauri
			</a>
			—a small native shell in Rust with a web-based UI
			<a
				class="underline decoration-muted-foreground/50 underline-offset-4 hover:decoration-foreground"
				href="https://svelte.dev"
			>
				Svelte
			</a>
			—so it stays lightweight, responsive, and close to native performance.
		</p>
	</section>

	<section class="flex flex-wrap items-center justify-center gap-4">
		<Button
			target="_blank"
			href="https://github.com/chillingpulsar/mike-bell/blob/main/INSTALL_GUIDE_MACOS.md"
			class="h-14 rounded-lg"
		>
			<img src={IconMacOs} alt="Mac OS" class="size-8" />
			Download
		</Button>
		<Button
			target="_blank"
			href="https://github.com/chillingpulsar/mike-bell/blob/main/INSTALL_GUIDE_WINDOWS.md"
			class="h-14 rounded-lg"
		>
			<img src={IconWindows} alt="Windows" class="size-8" />
			Download
		</Button>
		<Button
			target="_blank"
			href="https://github.com/chillingpulsar/mike-bell/blob/main/INSTALL_GUIDE_LINUX.md"
			class="h-14 rounded-lg"
		>
			<img src={IconLinux} alt="Linux" class="size-8" />
			Download
		</Button>
	</section>

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
				console.error('Error loading video');
			}}
			src="https://qhyyuvdwittfpsdruzsd.supabase.co/storage/v1/object/public/demo/latest-demo.mp4"
			class="aspect-video w-full rounded-lg object-cover transition-all duration-300"
		></video>
	</section>
</main>
