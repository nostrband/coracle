<script lang="ts">
  import {onMount} from "svelte"
  import {Tags, now} from "paravel"
  import {sleep} from "hurdak"
  import {Naddr, EventBuilder} from "src/util/nostr"
  import {secondsToDate, dateToSeconds} from "src/util/misc"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Field from "src/partials/Field.svelte"
  import Input from "src/partials/Input.svelte"
  import DateTimeInput from "src/partials/DateTimeInput.svelte"
  import ImageInput from "src/partials/ImageInput.svelte"
  import NoteImages from "src/app/shared/NoteImages.svelte"
  import Compose from "src/app/shared/Compose.svelte"
  import {router} from "src/app/router"
  import {toastProgress} from "src/app/state"
  import {dereferenceNote, publishToZeroOrMoreGroups, getUserHints} from "src/engine"

  export let address
  export let event

  const onSubmit = async () => {
    const builder = EventBuilder.from(event)

    builder.setTagArgs("title", values.title)
    builder.setTagArgs("location", values.location)
    builder.setTagArgs("start", dateToSeconds(values.start).toString())
    builder.setTagArgs("end", dateToSeconds(values.end).toString())
    builder.removeCircles()
    builder.setCreatedAt(now())
    builder.setContent(compose.parse())
    builder.setImageMeta(images.getValue())

    const {pubs} = await publishToZeroOrMoreGroups(values.groups, builder.template, {
      relays: getUserHints("write"),
    })

    pubs[0].on("progress", toastProgress)

    router.pop()
  }

  let loading = true
  let images, compose
  let values: any = {}

  onMount(async () => {
    if (!event) {
      event = await dereferenceNote(Naddr.fromTagValue(address))
    }

    loading = false

    if (event) {
      const tags = Tags.from(event)

      values = {
        groups: tags.circles().all(),
        title: tags.getValue("title") || "",
        location: tags.getValue("location") || "",
        start: secondsToDate(tags.getValue("start") || now()),
        end: secondsToDate(tags.getValue("end") || now()),
      }

      // Wait for components to mount
      await sleep(10)

      compose.write(event.content)

      for (const image of tags.type("image").values().all()) {
        images.addImage(new Tags([["url", image]]))
      }
    }
  })
</script>

{#if loading}
  <Spinner />
{:else}
  <form on:submit|preventDefault={() => onSubmit()}>
    <FlexColumn>
      <Field label="Title">
        <Input bind:value={values.title} />
      </Field>
      <div class="grid grid-cols-2 gap-2">
        <div class="flex flex-col gap-1">
          <strong>Start</strong>
          <DateTimeInput bind:value={values.start} />
        </div>
        <div class="flex flex-col gap-1">
          <strong>End</strong>
          <DateTimeInput bind:value={values.end} />
        </div>
      </div>
      <Field label="Location (optional)">
        <Input bind:value={values.location} />
      </Field>
      <Field label="Description">
        <div class="rounded-xl border border-solid border-mid bg-white p-3 text-black">
          <Compose autofocus bind:this={compose} {onSubmit} />
        </div>
      </Field>
      <NoteImages bind:this={images} bind:compose includeInContent />
      <div class="flex gap-2">
        <Anchor button tag="button" type="submit" class="flex-grow">Save</Anchor>
        <ImageInput
          multi
          hostLimit={3}
          circle={false}
          on:change={e => images?.addImage(e.detail)} />
      </div>
    </FlexColumn>
  </form>
{/if}
