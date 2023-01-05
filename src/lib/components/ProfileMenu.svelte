<script>
  import { fade } from 'svelte/transition'
  import { classNames, clickOutside } from '$lib/utils'
  import { auth } from '$lib/firebase'
  import { navigating } from '$app/stores'
  import { goto } from '$app/navigation'

  let open = false
  let className = ''
  export { className as class }
  $: if ($navigating) {
    open = false
  }
  async function handleSignOut() {
    await auth.signOut()
    goto('/signin')
  }
</script>

<div
  class={classNames('relative md:flex md:items-center', className)}
  use:clickOutside
  on:outclick={() => {
    open = false
  }}
>
  <button
    class="hidden sm:block"
    type="button"
    on:click={() => {
      open = !open
    }}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class="w-10 h-10"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  </button>
  {#if open}
    <div
      class="absolute top-12 right-0 bg-white rounded-md border border-gray-200 shadow-sm py-1 w-36"
      transition:fade={{ duration: 150 }}
    >
      <a
        class="block hover:bg-gray-100 py-2 px-6 w-full transition-colors duration-300"
        href="/profile">Profile</a
      >
      <button
        class="text-left hover:bg-gray-100 py-2 px-6 w-full transition-colors duration-300"
        type="button"
        on:click={handleSignOut}
      >
        Sign out
      </button>
    </div>
  {/if}
  <div class="sm:hidden grid grid-cols-2 gap-3 text-center">
    <a
      class="block hover:bg-gray-100 py-2 px-6 w-full transition-colors duration-300 rounded-md border border-gray-200 shadow-sm"
      href="/profile">Profile</a
    >
    <button
      class="hover:bg-gray-100 py-2 px-6 w-full transition-colors duration-300 rounded-md border border-gray-200 shadow-sm"
      type="button"
      on:click={handleSignOut}
    >
      Sign out
    </button>
  </div>
</div>
