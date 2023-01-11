import { browser } from '$app/environment'
import { goto } from '$app/navigation'
import { user, auth } from '$lib/firebase'

export async function load() {
  if (browser) {
    const userData = await user.get()
    if (userData) {
      const userProfileData = await user.profile()
      if (userProfileData.role !== 'admin') {
        await auth.signOut()
        window.location.href = 'https://portal.hackharvard.io'
      }
    } else {
      goto('/signin')
    }
  }
}
