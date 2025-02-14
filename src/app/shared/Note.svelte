<script lang="ts">
  import {matchFilters} from "paravel"
  import {reject, whereEq, uniqBy, prop} from "ramda"
  import {onMount, onDestroy} from "svelte"
  import {quantify, ensurePlural, batch} from "hurdak"
  import {Tags} from "paravel"
  import {fly} from "src/util/transition"
  import {
    getIdOrAddress,
    isChildOf,
    isLike,
    getParentId,
    getRootId,
    getParentIds,
    getRootIds,
    isGiftWrap,
  } from "src/util/nostr"
  import {formatTimestamp} from "src/util/misc"
  import Popover from "src/partials/Popover.svelte"
  import AlternatingBackground from "src/partials/AlternatingBackground.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Card from "src/partials/Card.svelte"
  import NoteMeta from "src/app/shared/NoteMeta.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonName from "src/app/shared/PersonName.svelte"
  import NoteReply from "src/app/shared/NoteReply.svelte"
  import NoteActions from "src/app/shared/NoteActions.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import {router} from "src/app/router"
  import {
    env,
    load,
    nip59,
    people,
    loadOne,
    getLnUrl,
    getZapper,
    processZaps,
    getReplyHints,
    isEventMuted,
    getEventHints,
    getIdFilters,
    getReplyFilters,
    getSetting,
    getRecipientKey,
    selectHints,
    mergeHints,
    loadPubkeys,
    sortEventsDesc,
  } from "src/engine"

  export let note
  export let relays = []
  export let context = []
  export let filters = null
  export let depth = 0
  export let anchor = null
  export let topLevel = false
  export let isLastReply = false
  export let showParent = true
  export let showLoading = false
  export let showMuted = false
  export let showGroup = false

  let zapper, unsubZapper
  let ready = false
  let event = note
  let reply = null
  let replyIsActive = false
  let showMutedReplies = false
  let actions = null
  let collapsed = depth === 0
  let ctx = uniqBy(prop("id"), context)
  let showEntire = anchor === getIdOrAddress(event)

  const interactive = !anchor || !showEntire

  const onClick = e => {
    const target = (e.detail?.target || e.target) as HTMLElement

    if (interactive && !["I"].includes(target.tagName) && !target.closest("a")) {
      router
        .at("notes")
        .of(getIdOrAddress(event), {relays: getEventHints(event)})
        .cx({context: ctx.concat(event)})
        .open()
    }
  }

  const showPerson = () => router.at("people").of(event.pubkey).open()

  const goToDetail = () =>
    router
      .at("notes")
      .of(getIdOrAddress(event), {relays: getEventHints(event)})
      .cx({context: ctx.concat(event)})
      .push()

  const goToParent = () =>
    router
      .at("notes")
      .of(getParentId(event), {relays: tags.getReplyHints()})
      .cx({context: ctx.concat(event)})
      .open()

  const goToThread = () =>
    router
      .at("notes")
      .of(getIdOrAddress(event), {relays: getEventHints(event)})
      .at("thread")
      .cx({context: ctx.concat(event)})
      .open()

  const removeFromContext = e => {
    ctx = reject(whereEq({id: e.id}), ctx)
  }

  const addToContext = events => {
    ctx = ctx.concat(ensurePlural(events).map(e => ({seen_on: [], ...e})))
  }

  $: tags = Tags.from(event)

  $: muted = !showMuted && $isEventMuted(event, true)

  // Find children in our context
  $: children = ctx.filter(e => isChildOf(e, event))

  // Sort our replies
  $: replies = sortEventsDesc(children.filter(e => e.kind === 1))

  let mutedReplies, hiddenReplies, visibleReplies

  $: {
    mutedReplies = []
    hiddenReplies = []
    visibleReplies = []

    for (const e of replies) {
      if ($isEventMuted(e)) {
        mutedReplies.push(e)
      } else if (collapsed) {
        hiddenReplies.push(e)
      } else if (!showEntire && filters && !matchFilters(filters, e)) {
        hiddenReplies.push(e)
      } else {
        visibleReplies.push(e)
      }
    }

    if (depth === 0) {
      mutedReplies.splice(0)
      hiddenReplies.splice(0)
    }

    if (!showEntire && visibleReplies.length === 0) {
      mutedReplies.splice(0)
      hiddenReplies.splice(0)
    }

    if (showMutedReplies) {
      visibleReplies = visibleReplies.concat(mutedReplies.splice(0))
    }

    if (!showEntire) {
      hiddenReplies = hiddenReplies.concat(visibleReplies.slice(3))
      visibleReplies = visibleReplies.slice(0, 3)
    }
  }

  // Split out likes, uniqify by pubkey since a like can be duplicated across groups
  $: likes = uniqBy(prop("pubkey"), children.filter(isLike))

  // Split out zaps
  $: zaps = processZaps(
    children.filter(e => e.kind === 9735),
    zapper,
  )

  $: rootId = getRootId(event)
  $: replyId = getParentId(event)

  onMount(async () => {
    const zapAddress = Tags.from(event).getValue("zap")

    if (zapAddress && getLnUrl(zapAddress)) {
      zapper = await getZapper(getLnUrl(zapAddress))
    } else {
      unsubZapper = people.key(event.pubkey).subscribe($p => {
        zapper = $p?.zapper
      })
    }

    if (!event.pubkey) {
      event = await loadOne({
        relays: selectHints(relays),
        filters: getIdFilters([event.id]),
      })
    }

    if (isGiftWrap(event)) {
      event = await nip59.get().unwrap(event, getRecipientKey(event))
    }

    ready = true

    if (event.pubkey) {
      loadPubkeys([event.pubkey])

      const kinds = [1]

      if (getSetting("enable_reactions")) {
        kinds.push(7)
      }

      if ($env.ENABLE_ZAPS) {
        kinds.push(9735)
      }

      load({
        relays: mergeHints([relays, getReplyHints(event)]),
        filters: getReplyFilters([event], {kinds}),
        onEvent: batch(200, events => {
          ctx = uniqBy(prop("id"), ctx.concat(events))
        }),
      })
    }
  })

  onDestroy(() => {
    unsubZapper?.()
  })
</script>

{#if ready}
  <div>
    <NoteMeta note={event} {showGroup} />
    <div class="note relative" class:py-2={!showParent && !topLevel}>
      {#if !showParent && !topLevel}
        <AlternatingBackground class="absolute -left-4 h-[2px] w-4" style="top: 27px;" />
        {#if isLastReply}
          <AlternatingBackground class="absolute -left-4 w-[2px]" style="height: 19px;" />
        {:else}
          <AlternatingBackground class="absolute -left-4 h-full w-[2px]" />
        {/if}
      {/if}
      <div class="group relative">
        <Card stopPropagation class="relative flex gap-4" on:click={onClick} {interactive}>
          <div>
            <Anchor class="text-lg font-bold" on:click={showPerson}>
              <PersonCircle class="h-10 w-10" pubkey={event.pubkey} />
            </Anchor>
          </div>
          <div class="flex min-w-0 flex-grow flex-col gap-2">
            <div class="flex min-w-0 flex-col items-start justify-between sm:flex-row">
              <Anchor type="unstyled" class="mr-4 min-w-0 text-lg font-bold" on:click={showPerson}>
                <PersonName pubkey={event.pubkey} />
              </Anchor>
              <Anchor
                on:click={goToDetail}
                class="whitespace-nowrap text-end text-sm text-lightest"
                type="unstyled">
                {formatTimestamp(event.created_at)}
              </Anchor>
            </div>
            <div class="flex flex-col gap-2">
              <div class="flex gap-2">
                {#if replyId && !getParentIds(event).includes(anchor) && showParent}
                  <small class="text-lightest">
                    <i class="fa fa-code-merge" />
                    <Anchor class="underline" on:click={goToParent}>View Parent</Anchor>
                  </small>
                {/if}
                {#if rootId && !getRootIds(event).includes(anchor) && rootId !== replyId && showParent}
                  <small class="text-lightest">
                    <i class="fa fa-code-pull-request" />
                    <Anchor class="underline" on:click={goToThread}>View Thread</Anchor>
                  </small>
                {/if}
              </div>
              {#if muted}
                <p class="border-l-2 border-solid border-mid pl-4 text-lightest">
                  You have hidden this note.
                  <Anchor
                    underline
                    on:click={() => {
                      showMuted = true
                    }}>Show</Anchor>
                </p>
              {:else}
                <NoteContent note={event} {showEntire} />
              {/if}
              <div class="cy-note-click-target h-[2px]" />
              <NoteActions
                note={event}
                bind:this={actions}
                {removeFromContext}
                {addToContext}
                {showMuted}
                {replies}
                {likes}
                {zaps}
                {reply}
                {zapper}
                {showEntire} />
            </div>
          </div>
        </Card>
      </div>

      {#if !replyIsActive && visibleReplies.length > 0 && !showEntire && depth > 0}
        <div class="relative">
          <div
            class="absolute right-0 top-0 -mr-2 -mt-4 flex h-6 w-6 cursor-pointer items-center
                   justify-center rounded-full border border-solid border-mid bg-dark text-lightest"
            on:click={() => {
              collapsed = !collapsed
            }}>
            <Popover triggerType="mouseenter">
              <div slot="trigger">
                {#if collapsed}
                  <i class="fa fa-xs fa-up-right-and-down-left-from-center" />
                {:else}
                  <i class="fa fa-xs fa-down-left-and-up-right-to-center" />
                {/if}
              </div>
              <div slot="tooltip">
                {collapsed ? "Show replies" : "Hide replies"}
              </div>
            </Popover>
          </div>
        </div>
      {/if}

      <NoteReply
        {addToContext}
        parent={event}
        showBorder={visibleReplies.length > 0}
        bind:this={reply}
        on:start={() => {
          replyIsActive = true
        }}
        on:reset={() => {
          replyIsActive = false
        }}
        on:event={e => {
          ctx = [e.detail, ...ctx]
        }} />

      {#if visibleReplies.length > 0 || hiddenReplies.length > 0 || mutedReplies.length > 0}
        <div class="note-children relative ml-4 mt-2 flex flex-col">
          {#if hiddenReplies.length > 0}
            <button
              class="mb-2 mt-2 cursor-pointer rounded-md bg-gradient-to-l from-transparent to-cocoa py-2 text-lightest outline-0 transition-colors hover:bg-cocoa"
              on:click={() => {
                showEntire = true
              }}>
              <i class="fa fa-up-down pr-2 text-sm" />
              Show {quantify(hiddenReplies.length, "other reply", "more replies")}
            </button>
            {#if visibleReplies.length > 0}
              <AlternatingBackground class="absolute -left-4 -top-4 h-20 w-[2px]" />
            {/if}
          {:else if visibleReplies.length > 0}
            <AlternatingBackground class="absolute -left-4 -top-4 h-8 w-[2px]" />
          {/if}
          {#if visibleReplies.length}
            <div in:fly={{y: 20}} class="-mb-2">
              {#each visibleReplies as r, i (r.id)}
                <svelte:self
                  isLastReply={i === visibleReplies.length - 1}
                  showParent={false}
                  showMuted
                  note={r}
                  depth={depth - 1}
                  context={ctx}
                  {anchor} />
              {/each}
            </div>
          {/if}
          {#if showEntire && mutedReplies.length > 0}
            <button
              class="ml-5 cursor-pointer py-2 text-lightest outline-0"
              on:click={() => {
                showMutedReplies = true
              }}>
              <i class="fa fa-up-down pr-2 text-sm" />
              Show {quantify(mutedReplies.length, "hidden reply", "hidden replies")}
            </button>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{:else if showLoading}
  <Spinner />
{/if}
