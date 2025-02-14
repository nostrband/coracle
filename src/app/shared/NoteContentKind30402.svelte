<script lang="ts">
  import cx from "classnames"
  import {Tags} from "paravel"
  import {commaFormat} from "hurdak"
  import {Naddr} from "src/util/nostr"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Carousel from "src/partials/Carousel.svelte"
  import CurrencySymbol from "src/partials/CurrencySymbol.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Chip from "src/partials/Chip.svelte"
  import NoteContentLink from "src/app/shared/NoteContentLink.svelte"
  import NoteContentTopics from "src/app/shared/NoteContentTopics.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import {router} from "src/app/router"
  import {pubkey, isDeleted} from "src/engine"

  export let note
  export let showMedia = false
  export let showEntire = false

  const tags = Tags.from(note)
  const {title, summary, location, status} = tags.getDict()
  const images = tags.type("image").values().all()
  const [price = 0, code = "SAT"] = tags.type("price").drop(1).first() || []
  const address = Naddr.fromEvent(note).asTagValue()
  const editLink = router.at("listings").of(address).at("edit").toString()
  const deleteLink = router.at("listings").of(address).at("delete").toString()

  const sendMessage = () => {
    const initialMessage = `Hi, I'd like to make an offer on this listing:\n${Naddr.fromEvent(
      note,
    ).encode()}`

    router.at("channels").of([$pubkey, note.pubkey]).cx({initialMessage}).push()
  }

  $: deleted = $isDeleted(note)
</script>

<FlexColumn>
  <div class="flex flex-col gap-2">
    <div class="flex justify-between gap-2 text-xl">
      <div class="flex items-center gap-3">
        <strong class={cx({"line-through": deleted})}>
          {title}
        </strong>
        {#if note.pubkey === $pubkey && !deleted}
          <Anchor modal stopPropagation href={editLink} class="flex items-center">
            <i class="fa fa-edit text-base text-lighter" />
          </Anchor>
          <Anchor modal stopPropagation href={deleteLink} class="flex items-center">
            <i class="fa fa-trash text-base text-lighter" />
          </Anchor>
        {:else if deleted}
          <Chip danger small>Deleted</Chip>
        {:else if status === "sold"}
          <Chip danger small>Sold</Chip>
        {:else}
          <Chip small>Available</Chip>
        {/if}
      </div>
      <span class="whitespace-nowrap">
        <CurrencySymbol {code} />{commaFormat(price)}
        {code}
      </span>
    </div>
    {#if location}
      <div class="flex items-center gap-2 text-sm text-light">
        <i class="fa fa-location-dot" />
        {location}
      </div>
    {/if}
    {#if summary !== note.content}
      <p class="text-lighter">{summary}</p>
    {/if}
    <div class="h-px bg-mid" />
    <NoteContentKind1 skipMedia {note} {showEntire} />
  </div>
  {#if showMedia}
    <Carousel urls={images} />
  {:else}
    <div class="flex flex-col">
      {#each images as url}
        <NoteContentLink value={{url, isMedia: true}} />
      {/each}
    </div>
  {/if}
  <NoteContentTopics {note} />
  {#if !deleted}
    <div class="flex justify-center">
      <Anchor button accent on:click={sendMessage}>Make an offer</Anchor>
    </div>
  {/if}
</FlexColumn>
