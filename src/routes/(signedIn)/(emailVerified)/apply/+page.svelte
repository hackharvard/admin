<script>
  import Application from '$lib/components/Application.svelte'
</script>

<div class="grid md:grid-cols-3">
  <h1 class="font-bold text-5xl md:text-6xl mb-8">Apply</h1>
  <div
    class="col-span-2 flex flex-col gap-6 items-center h-[calc(100vh-7rem)] overflow-y-auto overflow-hidden p-6"
  >
    <Application />
  </div>
</div>
