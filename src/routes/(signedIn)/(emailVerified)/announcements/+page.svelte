<!-- PostAnnouncement.svelte -->
<script>
  import { alert } from '$lib/stores'
  import { collection, serverTimestamp, addDoc } from 'firebase/firestore'
  import { db } from '$lib/firebase'

  let title = ''
  let content = ''

  async function handleSubmit() {
    if (!title || !content) return

    const newAnnouncement = {
      title,
      content,
      timestamp: serverTimestamp()
    }

    addDoc(collection($db, 'announcements'), newAnnouncement)
      .then(() => {
        alert.trigger('success', 'Announcement posted!')
      })
      .catch(err => {
        alert.trigger('error', err.code)
      })
    title = ''
    content = ''
  }
</script>

<div class="p-4 bg-white shadow rounded-lg">
  <h2 class="text-xl font-semibold mb-4">Post an Announcement</h2>
  <form on:submit|preventDefault={handleSubmit}>
    <div class="mb-4">
      <label for="title" class="block text-gray-700 font-medium">Title</label>
      <input
        type="text"
        id="title"
        class="w-full mt-1 p-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
        bind:value={title}
        required
      />
    </div>
    <div class="mb-4">
      <label for="content" class="block text-gray-700 font-medium">Content</label>
      <textarea
        id="content"
        class="w-full mt-1 p-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
        bind:value={content}
        required
      />
    </div>
    <button
      type="submit"
      class="px-4 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600"
    >
      Post Announcement
    </button>
  </form>
</div>
