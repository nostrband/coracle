<script lang="ts">
  import {Tags} from "paravel"
  import {onMount} from "svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import PersonBadgeSmall from "src/app/shared/PersonBadgeSmall.svelte"
  import NoteContentEllipsis from "src/app/shared/NoteContentEllipsis.svelte"
  import {loadPubkeys} from "src/engine"

  export let note
  export let showEntire

  const expand = () => {
    limit += 20
  }

  let limit = showEntire ? Infinity : 5

  $: pubkeys = Tags.from(note).type("p").values().all().slice(0, limit)

  onMount(() => {
    loadPubkeys(pubkeys)
  })
</script>

<FlexColumn small>
  <div style={!showEntire && "mask-image: linear-gradient(0deg, transparent 0px, black 100px)"}>
    <div class="mb-4 border-l-2 border-solid border-mid pl-4 text-lg">Updated follows list:</div>
    <div>
      {#each pubkeys as pubkey}
        <div class="inline-block rounded-full px-3 py-2 transition-colors hover:bg-dark">
          <PersonBadgeSmall {pubkey} />
        </div>
      {/each}
    </div>
  </div>
  {#if !showEntire}
    <NoteContentEllipsis on:click={expand} />
  {/if}
</FlexColumn>
