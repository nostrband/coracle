<script lang="ts">
  import Chip from "src/partials/Chip.svelte"
  import GroupCircle from "src/app/shared/GroupCircle.svelte"
  import GroupAbout from "src/app/shared/GroupAbout.svelte"
  import GroupName from "src/app/shared/GroupName.svelte"
  import {groups} from "src/engine"

  export let address
  export let hideAbout = false

  const group = groups.key(address)
</script>

<div class="flex gap-4 text-lightest">
  <GroupCircle {address} class="h-8 w-8" />
  <div class="flex min-w-0 flex-grow flex-col gap-4">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center">
        <GroupName class="text-2xl" {address} />
        <Chip class="scale-75 border-lighter text-lighter">
          {#if address.startsWith("34550:")}
            <i class="fa fa-unlock" />
            Open
          {:else}
            <i class="fa fa-lock" />
            Closed
          {/if}
        </Chip>
      </div>
      <slot name="actions" class="hidden xs:block" />
    </div>
    {#if !hideAbout && $group?.meta?.about}
      <GroupAbout {address} />
    {/if}
  </div>
</div>
