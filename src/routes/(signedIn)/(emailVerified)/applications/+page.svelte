<script>
  import Application from '$lib/components/Application.svelte'
  import Card from '$lib/components/Card.svelte'
  import { serialize } from '$lib/forms'
  import { onMount } from 'svelte'
  import { alert } from '$lib/stores'
  import { db } from '$lib/firebase'
  import { collection, getDocs } from 'firebase/firestore'

  // function searchForApplications(query) {
  //   if (codeQuery) {
  //     // split the query by &&
  //     const queries = query.split('&&')
  //     // remove whitespace
  //     queries.forEach((q, index) => {
  //       queries[index] = q.trim()
  //     })

  //     // split each query by =
  //     const queryComponents = []
  //     queries.forEach(q => {
  //       const components = q.split('=')
  //       queryComponents.push({
  //         key: components[0].trim(),
  //         value: components[1].trim()
  //       })
  //     })

  //     applications = allApplications.filter(application => {
  //       let matches = true

  //       queryComponents.forEach(component => {
  //         const keys = component.key.split('.')
  //         let value = application
  //         keys.forEach(key => {
  //           value = value[key]
  //         })

  //         let componentValue = component.value
  //         if (!isNaN(componentValue)) {
  //           componentValue = Number(componentValue)
  //         }
  //         if (componentValue === 'true') {
  //           componentValue = true
  //           value = value.checked
  //         } else if (componentValue === 'false') {
  //           componentValue = false
  //           value = value.checked
  //         } else {
  //           value = value.value
  //         }

  //         if (value !== componentValue) {
  //           matches = false
  //         }
  //       })
  //       return matches
  //     })
  //   } else {
  //     query = query.toLowerCase()
  //     applications = allApplications.filter(application => {
  //       return (
  //         application.personal.firstName.value.toLowerCase().includes(query) ||
  //         application.personal.lastName.value.toLowerCase().includes(query) ||
  //         application.personal.email.value.toLowerCase().includes(query) ||
  //         application.meta.hhid.value.toLowerCase().includes(query) ||
  //         application.personal.phoneNumber.value.toLowerCase().includes(query) ||
  //         application.personal.address.value.toLowerCase().includes(query) ||
  //         application.personal.city.value.toLowerCase().includes(query) ||
  //         application.personal.state.value.toLowerCase().includes(query) ||
  //         application.personal.country.value.toLowerCase().includes(query) ||
  //         application.academic.currentSchool.value.toLowerCase().includes(query) ||
  //         application.academic.graduationYear.value == parseInt(query, 10) ||
  //         application.academic.major.value.toLowerCase().includes(query) ||
  //         application.hackathon.reason.value.toLowerCase().includes(query) ||
  //         application.hackathon.why.value.toLowerCase().includes(query) ||
  //         application.hackathon.role.value.toLowerCase().includes(query) ||
  //         application.hackathon.proud.value.toLowerCase().includes(query)
  //       )
  //     })
  //   }
  //   numApplications = applications.length
  //   currentIndex = 0
  //   currentIndexDisplay = 1
  //   loadApplication(0)
  // }
  let applicantUids = []
  let currentIndex = 0
  $: currentApplicantUid = applicantUids[currentIndex] ?? ''
  onMount(async () => {
    const snapshot = await getDocs(collection($db, 'applications'))
    snapshot.forEach(doc => {
      const application = serialize.fromServer(doc.data())
      if (application.meta.submitted.checked) {
        if (application.meta.uid.value === doc.id) {
          applicantUids = [...applicantUids, doc.id]
        } else {
          alert.trigger(
            'error',
            'Application mismatch. Please contact tech team before proceeding.',
            false
          )
        }
      }
    })
    // sort allApplications by score
    // allApplications.sort((a, b) => {
    //   return b.score - a.score
  })
  /**i


<!-- checkbox for code query -->
<div class="mb-3">
  <label class="flex items-center">
    <input type="checkbox" class="form-checkbox" bind:checked={codeQuery} />
    <span class="ml-2">Code query (Example: personal.gender = Man && status.accepted = true)</span>
  </label>
</div>

<!-- text box for search -->
<div class="mb-10">
  <input
    class="appearance-none block px-3 pt-1 h-12 w-full transition-colors text-gray-900 rounded-md border focus:outline-none peer disabled:bg-white disabled:text-gray-400"
    type="text"
    placeholder="Search for applications"
    on:keydown={e => {
      if (e.key === 'Enter') {
        searchForApplications(e.target.value)
      }
    }}
  />
  {#if numApplications === 0}
    <span>No results found</span>
  {/if}
</div>

<!-- left and right button -->
<div class="flex justify-between mb-3">
  <button
    class="btn btn-primary"
    on:click={() => {
      if (currentIndex > 0) {
        currentIndex--
        currentIndexDisplay--
        loadApplication(currentIndex)
      }
    }}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class="w-6 h-6"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  </button>

  {#if numApplications > 0}
    <span class="font-bold">
      <input
        type="number"
        bind:value={currentIndexDisplay}
        min="1"
        max={numApplications}
        on:change={() => {
          currentIndex = currentIndexDisplay - 1
          if (currentIndex > numApplications - 1) {
            currentIndex = numApplications - 1
            currentIndexDisplay = numApplications
          }
          if (currentIndex < 0) {
            currentIndex = 0
            currentIndexDisplay = 1
          }
          loadApplication(currentIndex)
        }}
      />
      {`/ ${numApplications}`}</span
    >
  {/if}

  <button
    class="btn btn-primary"
    on:click={() => {
      if (currentIndex < applications.length - 1) {
        currentIndex++
        currentIndexDisplay++
        loadApplication(currentIndex)
      }
    }}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class="w-6 h-6"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  </button>
</div>



  */
</script>

<h1 class="font-bold text-5xl md:text-6xl mb-8">Applications</h1>
<div class="absolute top-28 right-0 px-4 w-full lg:max-w-5xl ">
  <Card class="h-[calc(100vh-8rem)] overflow-y-auto overflow-hidden p-6">
    <Application applicantUid={currentApplicantUid} />
  </Card>
</div>
