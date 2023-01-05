<script>
  import { fade } from 'svelte/transition'
  import { classNames } from '$lib/utils'

  export let title = ''
  export let size = 'full'
  let open = false
  export function setOpen(value) {
    open = value
  }
  let className
  export { className as class }
</script>

{#if open}
  <div
    class="fixed top-0 left-0 first-letter:w-screen h-screen z-50 flex items-center"
    transition:fade={{ duration: 150 }}
  >
    <div class="relative w-full h-full">
      <div
        class={classNames(
          'bg-white px-dynamic pb-5',
          size === 'full' && 'absolute top-0 w-screen h-screen flex flex-col'
        )}
      >
        <div class="mb-5 py-5 flex items-center justify-between border-b border-gray-300 shrink-0">
          <h1 class="text-xl uppercase">{title}</h1>
          <button
            class="shrink-0"
            type="button"
            on:click={() => {
              open = false
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-8 h-8"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class={classNames('h-full overflow-y-auto overflow-hidden', className)}>
          <slot />
        </div>
      </div>
    </div>
  </div>
{/if}
