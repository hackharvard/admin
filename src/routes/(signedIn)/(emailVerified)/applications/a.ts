import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { adminDb } from '$lib/server/firebase'
import { ALGOLIA_APP_ID, ALGOLIA_PRIVATE_KEY } from '$env/static/private'
import algoliasearch from 'algoliasearch'

const APPS_PER_PAGE = 25 // number of applications shown per page

const totalEntriesSnapshot = await adminDb
  .collection('2024-applications')
  .where('meta.submitted', '==', true)
  .where('meta.decision', '!=', null)
  .get()

for (let i = 0; i < totalEntriesSnapshot.docs.length; ++i) {
  let data = totalEntriesSnapshot.docs[i].data() as Data.Application<'server'>
  console.log(data.personal.email)
}
