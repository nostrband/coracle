<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
</script>

<Anchor
  type="unstyled"
  class="flex gap-4 border-l-2 border-solid border-mid px-4 py-2 transition-all
         hover:border-accent hover:bg-dark hover:pl-5"
  on:click>
  <slot />
</Anchor>
