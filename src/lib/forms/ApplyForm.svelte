<script>
  import { classNames } from '$lib/utils'
  import { doc, getDocs, setDoc, addDoc, collection } from 'firebase/firestore'
  import { db, user, storage } from '$lib/firebase'
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
  import { createFields, serialize, isValid } from '$lib/forms'
  import { alert } from '$lib/stores'
  import { onMount } from 'svelte'
  import Card from '$lib/components/Card.svelte'
  import { templates } from '$lib/mail'

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
    status: createFields.checkbox('approved', 'rejected', 'waitlisted')
  }

  let applications = []
  let uids = []
  let numApplications = 0
  let currentIndex = 0
  let currentIndexDisplay = 1

  function suggestApplicationDecision() {
    // isHarvardStudent || (18yearsOld && affiliatedWithUni && ((USapplicant && okEssayLength) || (internationalApplicant && goodEssayLength) ))
    const isHarvardStudent = fields.personal.currentSchool.value === 'Harvard University'
    // 18 years old as of 10/20/2023
    const is18YearsOld = new Date(fields.personal.dateOfBirth.value) < new Date('2005-10-20')
  }

  function handleSave() {
    setDoc(doc($db, 'applications', uids[currentIndex]), serialize.toServer(fields))
      .then(() => {
        disabled = false
        alert.trigger('success', 'Application decision saved!')
      })
      .catch(err => {
        disabled = false
        alert.trigger('error', err.code)
      })
  }

  function loadApplication(index) {
    fields = applications[index]
  }

  onMount(async () => {
    // get all applications
    const snapshot = await getDocs(collection($db, 'applications'))
    snapshot.forEach(doc => {
      applications.push(serialize.fromServer(doc.data()))
      uids.push(doc.id)
    })
    numApplications = applications.length

    if (numApplications > 0) {
      // comment this out when changing what data the application uses
      // i.e., structure of fields
      currentIndex = 0
      loadApplication(0)
    }
  })
</script>

<div>
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
  {#if fields.status.approved.checked}
    <div class="mb-3">
      <span class="font-bold">Current Decision: </span>
      <span class="text-green-500">Accepted</span>
    </div>
  {:else if fields.status.rejected.checked}
    <div class="mb-3">
      <span class="font-bold">Current Decision: </span>
      <span class="text-red-500">Rejected</span>
    </div>
  {:else if fields.status.waitlisted.checked}
    <div class="mb-3">
      <span class="font-bold">Current Decision: </span>
      <span class="text-blue-500">Waitlisted</span>
    </div>
  {:else}
    <div class="mb-3">
      <span class="font-bold">Current Decision: </span>
      <span class="text-gray-500">Undecided</span>
    </div>
  {/if}

  <!-- accept, reject, waitlist buttons -->
  <div class="flex justify-between mb-3">
    <button
      class="btn btn-primary bg-lime-500  text-white p-2 rounded"
      on:click={() => {
        fields.status.approved.checked = true
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
        fields.status.approved.checked = false
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
        fields.status.approved.checked = false
        fields.status.rejected.checked = false
        fields.status.waitlisted.checked = true
        handleSave()
      }}
    >
      Waitlist
    </button>
  </div>

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
