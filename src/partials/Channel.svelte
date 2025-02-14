<script lang="ts">
  import {onDestroy, onMount} from "svelte"
  import {sleep} from "hurdak"
  import {prop, max, reverse, pluck, sortBy, last} from "ramda"
  import {writable} from "svelte/store"
  import {fly} from "src/util/transition"
  import {createScroller} from "src/util/misc"
  import Spinner from "src/partials/Spinner.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import ImageInput from "src/partials/ImageInput.svelte"
  import type {Event} from "src/engine"
  import {nip44} from "src/engine"

  export let pubkeys
  export let messages: Event[]
  export let sendMessage
  export let initialMessage = ""

  const limit = writable(10)
  const loading = sleep(30_000)

  let textarea
  let container
  let scroller
  let useNip44 = true
  let showNewMessages = false
  let groupedMessages = []

  onMount(() => {
    if (textarea) {
      textarea.value = initialMessage
    }

    scroller = createScroller(async () => limit.update(l => l + 10), {
      element: container,
      reverse: true,
    })
  })

  onDestroy(() => {
    scroller?.stop()
  })

  const scrollToBottom = () => container.scrollIntoView({behavior: "smooth", block: "end"})

  const stickToBottom = async () => {
    const lastMessage = pluck("created_at", groupedMessages).reduce(max, 0)
    const shouldStick = container?.scrollTop > -200

    if (shouldStick) {
      scrollToBottom()
    } else if (lastMessage < pluck("created_at", groupedMessages).reduce(max, 0)) {
      showNewMessages = true
    }
  }

  const addImage = imeta => {
    textarea.value += "\n" + imeta.type("url").values().first()
  }

  const send = async () => {
    const content = textarea.value.trim()

    if (content) {
      textarea.value = ""

      await sendMessage(content, useNip44)

      stickToBottom()
    }
  }

  const onKeyDown = e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  // Group messages so we're only showing the person once per chunk
  $: {
    if (groupedMessages?.length === messages.length) {
      scroller?.stop()
    }

    const result = reverse(
      sortBy(prop("created_at"), messages).reduce((mx, m) => {
        return mx.concat({...m, showProfile: m.pubkey !== last(mx)?.pubkey})
      }, []),
    )

    setTimeout(stickToBottom, 100)

    groupedMessages = result.slice(0, $limit) as (Event & {showProfile: boolean})[]
  }
</script>

<svelte:window
  on:scroll={() => {
    showNewMessages = false
  }} />

<div class="fixed inset-0 z-chat flex flex-col bg-dark lg:ml-72">
  <div class="bg-dark-d">
    <slot name="header" />
  </div>
  <ul
    bind:this={container}
    class="flex flex-grow flex-col-reverse justify-start overflow-auto p-4 pb-6">
    {#each groupedMessages as m (m.id)}
      <li in:fly={{y: 20}} class="grid gap-2 py-1">
        <slot name="message" message={m} />
      </li>
    {/each}
    {#await loading}
      <Spinner>Looking for messages...</Spinner>
    {:then}
      <div in:fly={{y: 20}} class="py-20 text-center">End of message history</div>
    {/await}
  </ul>
  {#if $nip44.isEnabled() || pubkeys.length < 3}
    {#if $nip44.isEnabled()}
      <div class="m-2 mt-0 flex items-center justify-end gap-2">
        <Toggle scale={0.7} bind:value={useNip44} />
        <small>
          Send messages using
          <Popover class="inline">
            <span slot="trigger" class="cursor-pointer underline">NIP 44</span>
            <div slot="tooltip" class="flex flex-col gap-2">
              <p>
                When enabled, Coracle will use nostr's new group chat specification, which solves
                several problems with legacy DMs. Read more <Anchor
                  underline
                  modal
                  href="/help/nip-44-dms">here</Anchor
                >.
              </p>
              <p>
                Note that these messages are not yet universally supported. Make sure the person
                you're chatting with is using a compatible nostr client.
              </p>
            </div>
          </Popover>
        </small>
      </div>
    {/if}
    <div class="flex border-t border-solid border-cocoa border-mid bg-mid">
      <textarea
        rows="3"
        autofocus
        placeholder="Type something..."
        bind:this={textarea}
        on:keydown={onKeyDown}
        class="w-full resize-none bg-mid p-2
             text-lightest outline-0 placeholder:text-lightest" />
      <div>
        <ImageInput multi on:change={e => addImage(e.detail)}>
          <button
            slot="button"
            class="flex cursor-pointer flex-col justify-center gap-2 border-l border-solid border-cocoa p-3
                 py-6 text-lightest transition-all hover:bg-accent hover:text-white">
            <i class="fa-solid fa-paperclip fa-lg" />
          </button>
        </ImageInput>
        <button
          on:click={send}
          class="flex cursor-pointer flex-col justify-center gap-2 border-l border-solid border-cocoa p-3
               py-6 text-lightest transition-all hover:bg-accent hover:text-white">
          <i class="fa-solid fa-paper-plane fa-lg" />
        </button>
      </div>
    </div>
  {:else}
    <FlexColumn class="bg-dark-d px-4 py-2">
      <p class="flex items-center gap-2">
        <i class="fa fa-info-circle p-1" />
        You are using a login method that doesn't yet support group chats. Please consider upgrading
        your signer to access this feature.
      </p>
    </FlexColumn>
  {/if}
  {#if showNewMessages}
    <div
      class="fixed bottom-32 flex w-full cursor-pointer justify-center"
      transition:fly|local={{y: 20}}
      on:click={scrollToBottom}>
      <div class="rounded-full bg-accent px-4 py-2 text-lightest">New messages found</div>
    </div>
  {/if}
</div>
