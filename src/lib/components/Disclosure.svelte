<script context="module" lang="ts">
  type DisclosureData = {
    id: string
    close: () => void
  }
  const elements = new Set<DisclosureData>()
</script>

<script lang="ts">
  import clsx from 'clsx'
  import { onMount } from 'svelte'
  import { uniqueId } from 'lodash-es'
  import { slide } from 'svelte/transition'
  import { quintOut } from 'svelte/easing'

  let className = ''
  export { className as class }

  let openState = false
  const id = uniqueId('disclosure-')

  onMount(() => {
    const data: DisclosureData = {
      id,
      close: () => {
        openState = false
      },
    }
    elements.add(data)
    return () => elements.delete(data)
  })
</script>

<div>
  <button
    class={clsx(
      'flex w-full items-center rounded-md border border-gray-200 p-4 shadow',
      className,
    )}
    type="button"
    on:click={() => {
      if (!openState) {
        elements.forEach((element) => {
          element.close()
        })
      }
      openState = !openState
    }}
  >
    <div class="font-bold text-left grow">
      <slot name="title" />
    </div>
    <svg
      class={clsx(
        'h-6 w-6 transition-transform shrink-0 ml-3',
        openState && 'rotate-180',
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
      />
    </svg>
  </button>

  {#if openState}
    <div class="p-4" transition:slide={{ axis: 'y', easing: quintOut }}>
      <slot name="content" />
    </div>
  {/if}
</div>
