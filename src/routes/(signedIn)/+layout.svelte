<script lang="ts">
  import Nav from '$lib/components/Nav.svelte'
  import type { LayoutData } from './$types'

  export let data: LayoutData
</script>

<Nav user={data.user} />
<div class="grow">
  <main class="mt-20 py-8 px-d">
    <slot />
  </main>
</div>
