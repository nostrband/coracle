<script lang="ts">
  import cx from "classnames"

  export let small = false
  export let large = false
  export let narrow = false

  const className = cx("flex flex-col m-auto min-w-0 w-full", $$props.class, {
    "gap-2": small,
    "gap-4": !small && !large,
    "gap-6": large,
    "max-w-md": narrow,
  })
</script>

<div {...$$props} class={className}>
  <slot />
</div>
