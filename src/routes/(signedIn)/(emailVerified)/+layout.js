import { browser } from '$app/environment'
import { goto } from '$app/navigation'
import { user } from '$lib/firebase'

export async function load({ parent }) {
  if (browser) {
    await parent()
    const userData = await user.get()
    if (userData && !userData.emailVerified) {
      goto('/profile')
    }
  }
}
