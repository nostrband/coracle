<script lang="ts">
  import {nip19} from "nostr-tools"
  import CopyValue from "src/partials/CopyValue.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import {displayHandle, people} from "src/engine"

  export let pubkey
  export let nprofile

  const person = people.key(pubkey)

  $: lightningAddress = $person.profile?.lud16 || $person.profile?.lud06
</script>

<h1 class="staatliches text-2xl">Details</h1>
<CopyValue label="Link" value={nprofile} />
<CopyValue label="Public Key" encode={nip19.npubEncode} value={pubkey} />
{#if $person?.handle}
  {@const display = displayHandle($person.handle)}
  <CopyValue label="Nostr Address" value={display} />
  <strong>Nostr Address Relays</strong>
  {#each $person.handle.profile.relays || [] as url}
    <RelayCard relay={{url}} />
  {:else}
    <p class="flex gap-2 items-center">
      <i class="fa fa-info-circle" />
      No relays are advertised at {display}.
    </p>
  {/each}
{:else}
  <p>
    <i class="fa-solid fa-info-circle" />
    No Nostr address found.
  </p>
{/if}
{#if lightningAddress}
  <CopyValue label="Lightning Address" value={lightningAddress} />
{:else}
  <p>
    <i class="fa-solid fa-info-circle" />
    No lightning address found.
  </p>
{/if}
