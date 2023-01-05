<script>
  import '../app.css'
  import Alert from '$lib/components/Alert.svelte'
  import Footer from '$lib/components/Footer.svelte'
</script>

<div class="flex flex-col min-h-screen overflow-y-auto">
  <main class="mt-20 px-dynamic py-8 grow">
    <slot />
  </main>
  <Footer />
</div>
<Alert />
