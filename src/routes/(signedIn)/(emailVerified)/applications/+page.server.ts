import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { adminDb } from '$lib/server/firebase'
import { ALGOLIA_APP_ID, ALGOLIA_PRIVATE_KEY } from '$env/static/private'
import algoliasearch from 'algoliasearch'

const APPS_PER_PAGE = 25 // number of applications shown per page

export const load = (async ({ url, depends }) => {
  depends('app:applications')
  const query = url.searchParams.get('query')
  let currentPage = parseInt(url.searchParams.get('page') || '1')
  if (isNaN(currentPage) || currentPage < 1) currentPage = 1 // default to 1

  if (!query) {
    const updated = url.searchParams.get('updated')
    const filter = url.searchParams.get('filter')
    try {
      let dbQuery
      // if (filter === 'decided') {
      //   dbQuery = updated
      //     ? adminDb
      //       .collection('applications')
      //       .where('meta.submitted', '==', true)
      //       .orderBy('timestamps.updated')
      //       .orderBy('meta.decision')
      //       .where('meta.decision', '!=', null)
      //       .startAfter(new Date(updated))
      //     : adminDb
      //       .collection('applications')
      //       .where('meta.submitted', '==', true)
      //       .orderBy('meta.decision')
      //       .where('meta.decision', '!=', false)
      //       .orderBy('timestamps.updated')
      // }
      // else
      if (filter === 'undecided') {
        dbQuery = updated
          ? adminDb
              .collection('2024-applications')
              .where('meta.submitted', '==', true)
              .orderBy('timestamps.updated')
              .orderBy('meta.decision')
              .where('meta.decision', '==', null)
              .startAfter(new Date(updated))
          : adminDb
              .collection('2024-applications')
              .where('meta.submitted', '==', true)
              .orderBy('meta.decision')
              .where('meta.decision', '==', null)
              .orderBy('timestamps.updated')
      } else if (filter === 'at least 18') {
        console.log("filter age");
        dbQuery = updated
        ? adminDb
            .collection('2024-applications')
            .where('meta.submitted', '==', true)
            .orderBy('timestamps.updated')
            .orderBy('personal.age')
            .where('personal.age', '>=', 18)
            .startAfter(new Date(updated))
        : adminDb
            .collection('2024-applications')
            .where('meta.submitted', '==', true)
            .orderBy('timestamps.updated')
            .orderBy('personal.age')
            .where('personal.age', '>=', 18)
      } else if (filter === 'under 18') {
        dbQuery = updated
        ? adminDb
            .collection('2024-applications')
            .where('meta.submitted', '==', true)
            .orderBy('timestamps.updated')
            .orderBy('personal.age')
            .where('personal.age', '<', 18)
            .startAfter(new Date(updated))
        : adminDb
            .collection('2024-applications')
            .where('meta.submitted', '==', true)
            .orderBy('timestamps.updated')
            .orderBy('personal.age')
            .where('personal.age', '<', 18)
      } else if (filter === 'dietary restrictions') {
        dbQuery = updated
        ? adminDb
            .collection('2024-applications')
            .where('meta.submitted', '==', true)
            .orderBy('timestamps.updated')
            .orderBy('meta.decision')
            .where('personal.dietaryRestrictions', '!=', [])
            .startAfter(new Date(updated))
        : adminDb
            .collection('2024-applications')
            .where('meta.submitted', '==', true)
            .orderBy('meta.decision')
            .where('personal.dietaryRestrictions', '!=', [])
            .orderBy('timestamps.updated')
      } else {
        dbQuery = updated
          ? adminDb
              .collection('2024-applications')
              .where('meta.submitted', '==', true)
              .orderBy('timestamps.updated')
              .startAfter(new Date(updated))
          : adminDb
              .collection('2024-applications')
              .where('meta.submitted', '==', true)
              .orderBy('timestamps.updated')
      }

      // Gets entire database (may be slow to get the entire database just to
      // count total entries/pages, any way to optimize?)
      const totalEntriesSnapshot = await dbQuery
        .get()

      const totalEntries = totalEntriesSnapshot.size
      const totalPages = Math.ceil(totalEntries / APPS_PER_PAGE)

      const startAt = Math.max((currentPage - 1) * APPS_PER_PAGE, 0)

      const snapshotQuery = dbQuery
        .where('meta.submitted', '==', true)
        .limit(APPS_PER_PAGE)
        .offset(startAt)

      const snapshot = await snapshotQuery.get()

      const decisions = (
        await Promise.all(
          snapshot.docs.map((doc) => {
            const decision = (doc.data() as Data.Application<'server'>).meta
              .decision
            return decision ? decision.get() : null
          }),
        )
      ).map((doc) =>
        doc ? (doc.data() as { type: Data.Decision }).type : null,
      )

      return {
        applications: snapshot.docs.map((doc, i) => {
          const data = doc.data() as Data.Application<'server'>
          return {
            id: doc.id,
            values: {
              ...data,
              meta: {
                ...data.meta,
                decision: decisions.at(i),
              },
              timestamps: {
                updated: data.timestamps.updated.toDate(),
                created: data.timestamps.created.toDate(),
              },
            },
          }
        }),
        pagination: {
          currentPage,
          totalPages,
          entriesBefore: (currentPage - 1) * APPS_PER_PAGE + 1,
          entriesAfter: Math.min(currentPage * APPS_PER_PAGE, totalEntries),
          totalEntries,
        },
      }
    } catch (err) {
      console.log(err)
      throw error(400, 'Something went wrong. Please try again later.')
    }
  } else {
    try {
      const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_PRIVATE_KEY)
      const index = client.initIndex('portal_applications_2024')

      const { hits } = await index.search<
        Omit<Data.Application<'server'>, 'meta' | 'timestamps'> & {
          meta: {
            hhid: string
            uid: string
            submitted: boolean
            decision: string | null
          }
          timestamps: {
            updated: Date
            created: Date
          }
        }
      >(query, {
        hitsPerPage: APPS_PER_PAGE,
        page: currentPage - 1,
        filters: 'meta.submitted:true',
      })

      const decisions = (
        await Promise.all(
          hits.map((hit) => {
            const decision = hit.meta.decision
            return decision ? adminDb.doc(decision).get() : null
          }),
        )
      ).map((doc) =>
        doc ? (doc.data() as { type: Data.Decision }).type : null,
      )

      return {
        query,
        applications: hits.map((hit, i) => {
          return {
            id: hit.objectID,
            values: {
              personal: hit.personal,
              academic: hit.academic,
              hackathon: hit.hackathon,
              openResponse: hit.openResponse,
              agreements: hit.agreements,
              meta: {
                ...hit.meta,
                decision: decisions.at(i),
              },
              timestamps: hit.timestamps,
            },
          }
        }),
        // Current implementation limits results to 25 entries, no pagination
        pagination: {
          currentPage: 1,
          totalPages: 1,
          entriesBefore: 1,
          entriesAfter: hits.length,
          totalEntries: hits.length,
        },
      }
    } catch (err) {
      throw error(400, 'The search failed. Please try again later.')
    }
  }
}) satisfies PageServerLoad
