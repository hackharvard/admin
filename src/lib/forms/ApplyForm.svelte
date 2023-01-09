<script>
  import { classNames } from '$lib/utils'
  import { doc, getDocs, collection, updateDoc } from 'firebase/firestore'
  import { db } from '$lib/firebase'
  import Input from '$lib/components/Input.svelte'
  import Select from '$lib/components/Select.svelte'
  import Textarea from '$lib/components/Textarea.svelte'
  import Spreadsheet from '$lib/components/Spreadsheet.svelte'
  import {
    racesEthnicitiesJson,
    gendersJson,
    schoolsJson,
    worldJson,
    shirtSizeJson,
    dietaryRestrictionsJson,
    reasonsJson,
    statesJson
  } from '$lib/data'
  import { createFields, serialize } from '$lib/forms'
  import { alert } from '$lib/stores'
  import { onMount } from 'svelte'
  import Card from '$lib/components/Card.svelte'

  let formEl
  let disabled = true
  let showValidation = false
  let fields = {
    personal: createFields.text(
      'email',
      'firstName',
      'lastName',
      'dateOfBirth',
      'gender',
      'raceEthnicity',
      'phoneNumber',
      'address',
      'city',
      'state',
      'country',
      'zipCode'
    ),
    academic: createFields.text('currentSchool', 'graduationYear', 'major'),
    hackathon: {
      ...createFields.text('shirtSize', 'reason', 'why', 'role', 'proud'),
      ...createFields.checkbox('firstHackathon', 'previouslyParticipated'),
      ...createFields.file('resume'),
      ...createFields.group('dietaryRestrictions')
    },
    agreements: createFields.checkbox('codeOfConduct', 'sharing', 'mlhEmails', 'submitting'),
    meta: {
      ...createFields.text('hhid'),
      ...createFields.checkbox('submitted')
    },
    status: createFields.checkbox('accepted', 'rejected', 'waitlisted')
  }

  let allApplications = []
  let applications = []
  let numApplications = 0
  let currentIndex = 0
  let currentIndexDisplay = 1
  let suggestedDecision = 'waitlist'
  let codeQuery = false

  function getScore(application) {
    const isHarvardStudent = application.academic.currentSchool.value === 'Harvard University'
    // 18 years old as of 10/20/2023
    const is18YearsOld = new Date(application.personal.dateOfBirth.value) < new Date('2023-10-20')
    const isUSApplicant = application.personal.country.value === 'United States'
    const isMassachusettsApplicant = application.personal.state.value === 'Massachusetts'
    const essay1Length = application.hackathon.why.value.split(' ').length
    const essay2Length = application.hackathon.proud.value.split(' ').length
    const essay3Length = application.hackathon.role.value.split(' ').length
    let averageEssayLength = (essay1Length + essay2Length + essay3Length) / 3
    if (averageEssayLength > 150) {
      averageEssayLength = 150
    }
    const essayLengthScore = averageEssayLength / 150

    if (isHarvardStudent) {
      return 100
    } else if (!is18YearsOld) {
      return 0
    } else if (isMassachusettsApplicant) {
      return essayLengthScore * 100
    } else if (isUSApplicant) {
      return essayLengthScore * 80
    } else {
      return essayLengthScore * 60
    }
  }

  function suggestApplicationDecision() {
    if (fields.score >= 40) {
      return 'accept'
    } else if (fields.score >= 20) {
      return 'waitlist'
    } else {
      return 'reject'
    }
  }

  function handleSave() {
    updateDoc(doc($db, 'applications', fields.meta.uid.value), {
      status: serialize.toServer(fields.status)
    })
      .then(() => {
        alert.trigger('success', 'Application decision saved!')
      })
      .catch(err => {
        alert.trigger('error', err.code)
      })
  }

  function searchForApplications(query) {
    if (codeQuery) {
      // split the query by &&
      const queries = query.split('&&')
      // remove whitespace
      queries.forEach((q, index) => {
        queries[index] = q.trim()
      })

      // split each query by =
      const queryComponents = []
      queries.forEach(q => {
        const components = q.split('=')
        queryComponents.push({
          key: components[0].trim(),
          value: components[1].trim()
        })
      })

      applications = allApplications.filter(application => {
        let matches = true

        queryComponents.forEach(component => {
          const keys = component.key.split('.')
          let value = application
          keys.forEach(key => {
            value = value[key]
          })

          let componentValue = component.value
          if (!isNaN(componentValue)) {
            componentValue = Number(componentValue)
          }
          if (componentValue === 'true') {
            componentValue = true
            value = value.checked
          } else if (componentValue === 'false') {
            componentValue = false
            value = value.checked
          } else {
            value = value.value
          }

          if (value !== componentValue) {
            matches = false
          }
        })
        return matches
      })
    } else {
      query = query.toLowerCase()
      applications = allApplications.filter(application => {
        return (
          application.personal.firstName.value.toLowerCase().includes(query) ||
          application.personal.lastName.value.toLowerCase().includes(query) ||
          application.personal.email.value.toLowerCase().includes(query) ||
          application.meta.hhid.value.toLowerCase().includes(query) ||
          application.personal.phoneNumber.value.toLowerCase().includes(query) ||
          application.personal.address.value.toLowerCase().includes(query) ||
          application.personal.city.value.toLowerCase().includes(query) ||
          application.personal.state.value.toLowerCase().includes(query) ||
          application.personal.country.value.toLowerCase().includes(query) ||
          application.academic.currentSchool.value.toLowerCase().includes(query) ||
          application.academic.graduationYear.value == parseInt(query, 10) ||
          application.academic.major.value.toLowerCase().includes(query) ||
          application.hackathon.reason.value.toLowerCase().includes(query) ||
          application.hackathon.why.value.toLowerCase().includes(query) ||
          application.hackathon.role.value.toLowerCase().includes(query) ||
          application.hackathon.proud.value.toLowerCase().includes(query)
        )
      })
    }
    numApplications = applications.length
    currentIndex = 0
    currentIndexDisplay = 1
    loadApplication(0)
  }

  function loadApplication(index) {
    if (applications.length === 0) {
      return
    }
    fields = applications[index]
    suggestedDecision = suggestApplicationDecision()
  }

  onMount(async () => {
    // get all applications
    const snapshot = await getDocs(collection($db, 'applications'))
    snapshot.forEach(doc => {
      const application = serialize.fromServer(doc.data())
      application.score = getScore(application)
      allApplications.push(application)
      if (application.meta.uid.value !== doc.id) {
        alert.trigger(
          'error',
          'Application UID mismatch. Please contact tech team before proceeding.',
          false
        )
      }
    })
    // sort allApplications by score
    allApplications.sort((a, b) => {
      return b.score - a.score
    })

    applications = allApplications.slice()

    numApplications = applications.length

    currentIndex = 0
    loadApplication(0)
  })
</script>

<div class="flex flex-row">
  <div class="mr-5">
    <Spreadsheet
      bind:currentIndex
      {applications}
      onChange={index => {
        currentIndexDisplay = index + 1
        loadApplication(index)
      }}
    />
  </div>
  <div>
    <!-- checkbox for code query -->
    <div class="mb-3">
      <label class="flex items-center">
        <input type="checkbox" class="form-checkbox" bind:checked={codeQuery} />
        <span class="ml-2"
          >Code query (Example: personal.gender = Man && status.accepted = true)</span
        >
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

    <!-- display current decision -->
    <div class="mb-3">
      <span class="font-bold">Current Decision: </span>
      {#if fields.status.accepted.checked}
        <span class="text-green-500">Accepted</span>
      {:else if fields.status.rejected.checked}
        <span class="text-red-500">Rejected</span>
      {:else if fields.status.waitlisted.checked}
        <span class="text-blue-500">Waitlisted</span>
      {:else}
        <span class="text-gray-500">Undecided</span>
      {/if}
    </div>

    <!-- suggested application decision -->
    <div class="mb-3">
      <span class="font-bold">Suggested Decision: </span>
      {#if suggestedDecision === 'accept'}
        <span class="text-green-500">{`Accept (Score: ${fields.score})`}</span>
      {:else if suggestedDecision === 'reject'}
        <span class="text-red-500">{`Reject (Score: ${fields.score})`}</span>
      {:else if suggestedDecision === 'waitlist'}
        <span class="text-blue-500">{`Waitlist (Score: ${fields.score})`}</span>
      {/if}
    </div>

    <!-- accept, reject, waitlist buttons -->
    <div class="flex justify-between mb-3">
      <button
        class="btn btn-primary bg-lime-500  text-white p-2 rounded"
        on:click={() => {
          fields.status.accepted.checked = true
          fields.status.rejected.checked = false
          fields.status.waitlisted.checked = false
          handleSave()
        }}
      >
        Accept
      </button>

      <button
        class="btn btn-primary bg-red-500  text-white p-2 rounded"
        on:click={() => {
          fields.status.accepted.checked = false
          fields.status.rejected.checked = true
          fields.status.waitlisted.checked = false
          handleSave()
        }}
      >
        Reject
      </button>

      <button
        class="btn btn-primary bg-blue-500 text-white p-2 rounded"
        on:click={() => {
          fields.status.accepted.checked = false
          fields.status.rejected.checked = false
          fields.status.waitlisted.checked = true
          handleSave()
        }}
      >
        Waitlist
      </button>

      <button
        class="btn btn-primary bg-purple-500 text-white p-2 rounded"
        on:click={() => {
          fields.status.accepted.checked = false
          fields.status.rejected.checked = false
          fields.status.waitlisted.checked = false
          handleSave()
        }}
      >
        Undecided
      </button>

      <!-- take suggestion button -->
      <button
        class="btn btn-primary bg-gray-500 text-white p-2 rounded"
        on:click={() => {
          if (suggestedDecision === 'accept') {
            fields.status.accepted.checked = true
            fields.status.rejected.checked = false
            fields.status.waitlisted.checked = false
          } else if (suggestedDecision === 'reject') {
            fields.status.accepted.checked = false
            fields.status.rejected.checked = true
            fields.status.waitlisted.checked = false
          } else if (suggestedDecision === 'waitlist') {
            fields.status.accepted.checked = false
            fields.status.rejected.checked = false
            fields.status.waitlisted.checked = true
          } else {
            alert.trigger({
              type: 'error',
              message: 'No suggestion available'
            })
          }
          handleSave()
        }}
      >
        Take Suggestion
      </button>
    </div>

    <!-- everything below here should be essentially the same as the form in the portal, with irrelevant fields removed -->

    <form
      class={classNames('max-w-lg', showValidation && 'show-validation')}
      bind:this={formEl}
      novalidate
    >
      <fieldset class="grid gap-6" {disabled}>
        <div class="grid gap-1">
          <span class="font-bold">Personal</span>
          <Card class="grid gap-3 my-2">
            <div class="bg-gray-100 shadow-sm rounded-md px-3 py-2">
              {`Name: ${fields.personal.firstName.value} ${fields.personal.lastName.value}`}
            </div>
            <div class="bg-gray-100 shadow-sm rounded-md px-3 py-2">
              {`Email: ${fields.personal.email.value}`}
            </div>
            <div class="text-sm">
              Wrong name or email? Go to your <a class="link" href="/profile">profile</a> to update your
              information.
            </div>
          </Card>
          {#if fields.hackathon.resume.upload.url !== ''}
            <a
              class="mb-2"
              href={fields.hackathon.resume.upload.url}
              target="_blank"
              rel="noreferrer"
            >
              <Card class="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-6 h-6"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
                <span>{`${fields.hackathon.resume.upload.name} (resume)`}</span>
              </Card>
            </a>
          {/if}
          <Input
            type="date"
            bind:field={fields.personal.dateOfBirth}
            placeholder="Date of birth"
            floating
            required
          />
          <div class="grid sm:grid-cols-2 gap-1 sm:gap-3">
            <Select
              bind:field={fields.personal.gender}
              placeholder="Gender"
              sourceJson={gendersJson}
              floating
              required
            />
            <Select
              bind:field={fields.personal.raceEthnicity}
              name="race"
              autocomplete="race"
              placeholder="Race or ethnicity"
              sourceJson={racesEthnicitiesJson}
              floating
              required
            />
          </div>
          <Input
            type="tel"
            bind:field={fields.personal.phoneNumber}
            placeholder="Phone number"
            floating
            required
          />
          <Input
            type="text"
            bind:field={fields.personal.address}
            placeholder="Address"
            floating
            required
          />
          <div class="grid sm:grid-cols-2 gap-1 sm:gap-3">
            <Input
              type="text"
              bind:field={fields.personal.city}
              placeholder="City"
              floating
              required
            />
            <Select
              bind:field={fields.personal.state}
              placeholder="State"
              sourceJson={statesJson}
              floating
            />
          </div>
          <div class="grid sm:grid-cols-2 gap-1 sm:gap-3">
            <Select
              bind:field={fields.personal.country}
              placeholder="Country"
              sourceJson={worldJson}
              floating
              required
            />
            <Input
              type="text"
              bind:field={fields.personal.zipCode}
              placeholder="Zip code"
              floating
              required
            />
          </div>
        </div>
        <div class="grid gap-1">
          <span class="font-bold">Academic</span>
          <div class="grid sm:grid-cols-3 gap-1 sm:gap-3">
            <div class="sm:col-span-2">
              <Select
                bind:field={fields.academic.currentSchool}
                placeholder="Current school"
                sourceJson={schoolsJson}
                floating
                required
              />
            </div>
            <Input
              type="number"
              bind:field={fields.academic.graduationYear}
              placeholder="Graduation year"
              min={new Date().getFullYear()}
              max={new Date().getFullYear() + 20}
              floating
              required
            />
          </div>
          <Input
            type="text"
            bind:field={fields.academic.major}
            placeholder="Major"
            floating
            required
          />
        </div>
        <div class="grid gap-1">
          <span class="font-bold">Hackathon</span>
          <div class="grid grid-cols-2 sm:grid-cols-3">
            <Select
              bind:field={fields.hackathon.shirtSize}
              placeholder="Shirt size"
              sourceJson={shirtSizeJson}
              floating
              required
            />
          </div>
          <div class="grid grid-cols-1">
            <Input
              type="checkbox"
              bind:field={fields.hackathon.firstHackathon}
              placeholder="Will HackHarvard be your first hackathon?"
            />
            <Input
              type="checkbox"
              bind:field={fields.hackathon.previouslyParticipated}
              placeholder="Have you previously participated at a HackHarvard hackathon?"
            />
          </div>
          <div class="mt-2">
            <Select
              bind:field={fields.hackathon.reason}
              placeholder="How did you learn about HackHarvard?"
              sourceJson={reasonsJson}
              floating
              required
            />
          </div>
          <div class="mt-2">
            <Textarea
              bind:field={fields.hackathon.why}
              placeholder="Why do you want to attend HackHarvard?"
              required
            />
          </div>
          <div class="mt-2">
            <Textarea
              bind:field={fields.hackathon.role}
              placeholder="What do you see as your role on a hackathon team?"
              required
            />
          </div>
          <div class="mt-2">
            <Textarea
              bind:field={fields.hackathon.proud}
              placeholder="What's something you've made that you're proud of?"
              required
            />
          </div>
          {#if fields.hackathon.resume.upload.url === ''}
            <div class="mt-2">
              <Input
                bind:field={fields.hackathon.resume}
                type="file"
                placeholder="Upload your resume (max 1 MB; 1 page PDF)"
                maxSize={1 * 1024 * 1024}
                accept={['application/pdf']}
                required
              />
            </div>
          {/if}
        </div>
        <div class="grid gap-1">
          <span class="font-bold">Dietary restrictions</span>
          <div class="grid grid-cols-2">
            {#each dietaryRestrictionsJson as dietaryRestriction}
              <Input
                type="checkbox"
                bind:group={fields.hackathon.dietaryRestrictions}
                placeholder={dietaryRestriction.name}
              />
            {/each}
          </div>
        </div>
        <div class="grid gap-1">
          <span class="font-bold">Agreements</span>
          <div class="grid">
            <Input
              type="checkbox"
              bind:field={fields.agreements.mlhEmails}
              placeholder="I authorize MLH to send me an email where I can further opt into the MLH Hacker, Events, or
        Organizer Newsletters and other communications from MLH."
            />
          </div>
        </div>
      </fieldset>
    </form>
  </div>
</div>
