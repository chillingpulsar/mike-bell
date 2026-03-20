<script lang="ts">
  import IconFacebook from "phosphor-svelte/lib/FacebookLogoIcon";
  import IconLinkedin from "phosphor-svelte/lib/LinkedinLogoIcon";
  import IconGithub from "phosphor-svelte/lib/GithubLogoIcon";
  import IconGlobe from "phosphor-svelte/lib/GlobeSimpleIcon";

  const socials = [
    {
      icon: IconFacebook,
      url: "https://www.facebook.com/mike.eviota",
      name: "Facebook",
    },
    {
      icon: IconLinkedin,
      url: "https://www.linkedin.com/in/mike-john-eviota",
      name: "Linkedin",
    },
    {
      icon: IconGithub,
      url: "https://github.com/chillingpulsar",
      name: "Github",
    },
    {
      icon: IconGlobe,
      url: "https://mike-eviota.com",
      name: "Portfolio",
    },
  ];
</script>

<section class="flex flex-col gap-2">
  <h3 class="text-sm font-medium">Let's connect !!</h3>
  <div class="flex items-center gap-2">
    {#each socials as social (social)}
      <a
        href={social.url}
        target="_blank"
        class="flex items-center gap-2 transition-all hover:underline hover:underline-offset-4"
      >
        <social.icon class="size-4" />
        <span class="text-sm">{social.name}</span>
      </a>
    {/each}
  </div>
</section>
