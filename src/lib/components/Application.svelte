<script>
  import { classNames } from '$lib/utils/'
  import { doc, getDoc, updateDoc } from 'firebase/firestore'
  import { db } from '$lib/firebase'
  import Input from '$lib/components/Input.svelte'
  import Select from '$lib/components/Select.svelte'
  import Textarea from '$lib/components/Textarea.svelte'
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
  import { fade } from 'svelte/transition'
  import Card from '$lib/components/Card.svelte'

  export let applicantUid = ''
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
  let suggestion = { decision: '', score: 0 }
  $: asyncData = getAsyncData(applicantUid)
  function getAsyncData(uid) {
    return new Promise((resolve, reject) => {
      db.loaded().then(() => {
        if (uid === '') {
          reject()
        } else {
          getDoc(doc($db, 'applications', uid)).then(res => {
            if (res.exists()) {
              const application = res.data()
              fields = serialize.fromServer(application)
              suggestion = calculateSuggestion(fields)
              console.log(suggestion)
              resolve()
            } else {
              alert.trigger('error', 'Application not found.', false)
              reject()
            }
          })
        }
      })
    })
  }
  function calculateSuggestion(application) {
    const output = {
      decision: '',
      score: 0
    }
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
      output.score = 100
    } else if (!is18YearsOld) {
      output.score = 0
    } else if (isMassachusettsApplicant) {
      output.score = essayLengthScore * 100
    } else if (isUSApplicant) {
      output.score = essayLengthScore * 80
    } else {
      output.score = essayLengthScore * 60
    }

    if (output.score >= 40) {
      output.decision = 'accept'
    } else if (fields.score >= 20) {
      output.decision = 'waitlist'
    } else {
      output.decision = 'reject'
    }

    return output
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
</script>

{#await asyncData}
  <div class="flex items-center justify-center h-full">
    <svg
      class="animate-spin h-10 w-10"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  </div>
{:then}
  <div transition:fade|local={{ duration: 150 }}>
    <!-- accept, reject, waitlist buttons -->
    <Card class="sticky top-0 mb-3 z-20">
      <div>
        {#if fields.status.accepted.checked || fields.status.rejected.checked || fields.status.waitlisted.checked}
          <div class="flex items-center justify-between">
            <div
              class={classNames(
                'flex items-center gap-1 shadow-sm rounded-md px-4 py-2 ',
                fields.status.accepted.checked && 'bg-green-100 text-green-900',
                fields.status.rejected.checked && 'bg-red-100 text-red-900',
                fields.status.waitlisted.checked && 'bg-yellow-100 text-yellow-900'
              )}
            >
              {#if fields.status.accepted.checked}
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
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              {:else if fields.status.rejected.checked}
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
                    d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              {:else}
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
                    d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              {/if}
              <span>
                {`Applicant is ${
                  fields.status.accepted.checked
                    ? 'accepted'
                    : fields.status.rejected.checked
                    ? 'rejected'
                    : 'waitlisted'
                }.`}
              </span>
            </div>
            <button
              class="uppercase text-sm shadow-sm rounded-md bg-gray-100 px-2 h-8 text-gray-900 hover:bg-gray-200 transition-colors duration-300 disabled:text-gray-500 disabled:bg-gray-200"
              on:click={() => {
                fields.status.accepted.checked = false
                fields.status.rejected.checked = false
                fields.status.waitlisted.checked = false
                handleSave()
              }}
            >
              Clear decision
            </button>
          </div>
        {:else}
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <button
                class="flex items-center gap-1 shadow-sm rounded-md bg-green-100 px-4 py-2 text-green-900 hover:bg-green-200 transition-colors duration-300 disabled:text-green-500 disabled:bg-green-200"
                on:click={() => {
                  fields.status.accepted.checked = true
                  fields.status.rejected.checked = false
                  fields.status.waitlisted.checked = false
                  handleSave()
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
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Accept</span>
              </button>
              <button
                class="flex items-center gap-1 shadow-sm rounded-md bg-red-100 px-4 py-2 text-red-900 hover:bg-red-200 transition-colors duration-300 disabled:text-red-500 disabled:bg-red-200"
                on:click={() => {
                  fields.status.accepted.checked = false
                  fields.status.rejected.checked = true
                  fields.status.waitlisted.checked = false
                  handleSave()
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
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Reject</span>
              </button>
              <button
                class="flex items-center gap-1 shadow-sm rounded-md bg-yellow-100 px-4 py-2 text-yellow-900 hover:bg-yellow-200 transition-colors duration-300 disabled:text-yellow-500 disabled:bg-yellow-200"
                on:click={() => {
                  fields.status.accepted.checked = false
                  fields.status.rejected.checked = false
                  fields.status.waitlisted.checked = true
                  handleSave()
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
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Waitlist</span>
              </button>
            </div>
            <button
              class="uppercase font-bold hidden lg:flex items-center gap-1 shadow-sm rounded-md bg-gray-100 px-4 py-2 text-gray-900 hover:bg-gray-200 transition-colors duration-300 disabled:text-gray-500 disabled:bg-gray-200"
              type="button"
              on:click={() => {
                if (suggestion.decision === 'accept') {
                  fields.status.accepted.checked = true
                  fields.status.rejected.checked = false
                  fields.status.waitlisted.checked = false
                } else if (suggestion.decision === 'reject') {
                  fields.status.accepted.checked = false
                  fields.status.rejected.checked = true
                  fields.status.waitlisted.checked = false
                } else if (suggestion.decision === 'waitlist') {
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
                  d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z"
                />
              </svg>
              <span>Suggestion: </span>
              {#if suggestion.decision === 'accept'}
                <span class="text-green-600">{`Accept (Score: ${suggestion.score})`}</span>
              {:else if suggestion.decision === 'reject'}
                <span class="text-red-600">{`Reject (Score: ${suggestion.score})`}</span>
              {:else if suggestion.decision === 'waitlist'}
                <span class="text-yellow-600">{`Waitlist (Score: ${suggestion.score})`}</span>
              {/if}
            </button>
          </div>
        {/if}
      </div>
    </Card>

    <!-- similar to portal apply form except sanitized -->
    <div class="w-full flex justify-center">
      <div class="max-w-lg">
        <fieldset class="grid gap-6" disabled={true}>
          <div class="grid gap-1">
            <span class="font-bold">Personal</span>
            <Card class="grid gap-3 my-2">
              <div class="bg-gray-100 shadow-sm rounded-md px-3 py-2">
                {`Name: ${fields.personal.firstName.value} ${fields.personal.lastName.value}`}
              </div>
              <div class="bg-gray-100 shadow-sm rounded-md px-3 py-2">
                {`Email: ${fields.personal.email.value}`}
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
      </div>
    </div>
  </div>
{:catch}
  <div class="flex items-center justify-center h-full">
    <span class="text-sm uppercase">Error loading data. Please try again</span>.
  </div>
{/await}
