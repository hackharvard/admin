<script>
  import { alert } from '$lib/stores'
  import { classNames } from '$lib/utils'
  import { navigating } from '$app/stores'
  import { fade } from 'svelte/transition'

  let timer = null
  $: bgColor =
    $alert.type === ''
      ? ''
      : {
          success: 'bg-green-200',
          info: 'bg-gray-200',
          error: 'bg-red-200'
        }[$alert.type]
  $: if ($navigating && timer) {
    closeAlert()
  }
  $: if ($alert.type !== '' && !timer) {
    timer = setTimeout(() => {
      closeAlert()
    }, 3000)
  }
  function closeAlert() {
    clearTimeout(timer)
    timer = null
    alert.reset()
  }
  function handleClick() {
    closeAlert()
  }
  function handleKeyDown(e) {
    if (e.code === 'Escape') {
      closeAlert()
    }
  }
</script>

{#if $alert.type !== ''}
  <div
    class="z-50 fixed bottom-0 left-0 w-screen h-min-content flex justify-center"
    transition:fade
    on:click={handleClick}
    on:keydown={handleKeyDown}
  >
    <div
      class={classNames(
        'w-full mx-3 mb-3 max-w-lg p-3 rounded-md shadow flex items-center gap-2',
        bgColor
      )}
    >
      {#if $alert.type === 'success'}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      {:else if $alert.type === 'info'}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
          />
        </svg>
      {:else if $alert.type === 'error'}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6 shrink-0"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
      {/if}
      <div class="grow">{$alert.message}</div>
    </div>
  </div>
{/if}
