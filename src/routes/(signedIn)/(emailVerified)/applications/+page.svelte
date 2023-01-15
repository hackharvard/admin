<script>
  import Application from '$lib/components/Application.svelte'
  import Card from '$lib/components/Card.svelte'
</script>

<h1 class="font-bold text-5xl md:text-6xl mb-8">Applications</h1>
<Card
  class="absolute top-28 right-4 w-2/3 max-w-5xl h-[calc(100vh-8rem)] overflow-y-auto overflow-hidden p-6"
>
  <Application />
</Card>
