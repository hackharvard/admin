<script>
  import Nav from '$lib/components/Nav.svelte'
  import { user } from '$lib/firebase'
  import { onMount } from 'svelte'

  $: if (!($user?.emailVerified ?? true)) {
    sessionStorage.setItem('emailVerified', 'false')
  }
  onMount(async () => {
    if (sessionStorage.getItem('emailVerified') === 'false' && $user.emailVerified) {
      const { getIdToken } = await import('firebase/auth')
      getIdToken($user, true).then(() => {
        sessionStorage.removeItem('emailVerified')
      })
    }
  })
</script>

<Nav />
<slot />
