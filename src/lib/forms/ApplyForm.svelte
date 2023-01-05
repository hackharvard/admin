<script>
  import { classNames } from '$lib/utils'
  import { doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore'
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
  onMount(async () => {
    const applicationDoc = await getDoc(doc($db, 'applications', $user.uid))
    if (applicationDoc.exists()) {
      // comment this out when changing what data the application uses
      // i.e., structure of fields
      fields = serialize.fromServer(applicationDoc.data())
    }
    const profileDoc = await getDoc(doc($db, 'users', $user.uid))
    const profileDocData = profileDoc.data()
    const temp = {
      email: fields.personal.email.value,
      firstName: fields.personal.firstName.value,
      lastName: fields.personal.lastName.value
    }
    fields.personal.email.value = $user.email
    fields.personal.firstName.value = profileDocData.firstName
    fields.personal.lastName.value = profileDocData.lastName
    fields.meta.hhid.value = profileDocData.hhid
    if (
      temp.email !== fields.personal.email.value ||
      temp.firstName !== fields.personal.firstName.value ||
      temp.lastName !== fields.personal.lastName.value
    ) {
      handleSave(false)
    }
    if (!fields.meta.submitted.checked) {
      disabled = false
      const interval = setInterval(() => {
        if (!fields.meta.submitted.checked) {
          handleSave(false)
        }
      }, 300000)
      return () => clearInterval(interval)
    }
  })
  function handleSave(withDisabling) {
    showValidation = false
    if (withDisabling) {
      disabled = true
    }
    setDoc(doc($db, 'applications', $user.uid), serialize.toServer(fields))
      .then(() => {
        disabled = false
        alert.trigger('success', 'Your application was saved.')
      })
      .catch(err => {
        disabled = false
        alert.trigger('error', err.code)
      })
  }
  async function handleSubmit() {
    showValidation = true
    if (isValid(formEl)) {
      disabled = true
      storage
        .uploadFile(fields.hackathon.resume.value, `resumes/${$user.uid}.pdf`)
        .then(downloadURL => {
          let serializedFields = serialize.toServer(fields)
          serializedFields.hackathon.resume.upload.url = downloadURL
          serializedFields.hackathon.resume.upload.name = fields.hackathon.resume.value.name
          serializedFields.meta.submitted.checked = true
          setDoc(doc($db, 'applications', $user.uid), serializedFields)
            .then(async () => {
              showValidation = false
              alert.trigger('success', 'Your application has been submitted!')
              const applicationDoc = await getDoc(doc($db, 'applications', $user.uid))
              fields = serialize.fromServer(applicationDoc.data())
              window.scrollTo({
                top: 0,
                behavior: 'smooth'
              })
              handleEmail()
            })
            .catch(err => {
              disabled = false
              alert.trigger('error', err.code)
            })
        })
        .catch(() => {
          disabled = false
          alert.trigger('error', 'Error uploading resume. Please try again.', false)
        })
    } else {
      alert.trigger('error', 'Please fill all required fields correctly.', false)
    }
  }
  function handleEmail() {
    return addDoc(collection($db, 'mail'), {
      to: $user.email,
      message: templates.applicationSubmitted({
        firstName: fields.personal.firstName.value,
        lastName: fields.personal.lastName.value
      })
    })
  }
</script>

<form
  class={classNames('max-w-lg', showValidation && 'show-validation')}
  bind:this={formEl}
  on:submit|preventDefault={handleSubmit}
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
        <a class="mb-2" href={fields.hackathon.resume.upload.url} target="_blank" rel="noreferrer">
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
        <Input type="text" bind:field={fields.personal.city} placeholder="City" floating required />
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
      <Input type="text" bind:field={fields.academic.major} placeholder="Major" floating required />
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
          bind:field={fields.agreements.codeOfConduct}
          placeholder="I have read and agree to the MLH Code of Conduct (https://static.mlh.io/docs/mlh-code-of-conduct.pdf)."
          required
        />

        <Input
          type="checkbox"
          bind:field={fields.agreements.sharing}
          placeholder="I authorize you to share my application/registration information with Major League Hacking for event administration, ranking, and MLH administration in-line with the MLH Privacy Policy (https://mlh.io/privacy). I further agree to the terms of both the MLH Contest Terms and Conditions (https://github.com/MLH/mlh-policies/blob/main/contest-terms.md)and the MLH Privacy Policy (https://mlh.io/privacy)"
          required
        />
        <Input
          type="checkbox"
          bind:field={fields.agreements.mlhEmails}
          placeholder="I authorize MLH to send me an email where I can further opt into the MLH Hacker, Events, or
        Organizer Newsletters and other communications from MLH."
        />
        <Input
          type="checkbox"
          bind:field={fields.agreements.submitting}
          placeholder="I understand submitting means I can no longer make changes to my application. Don't check this box until you are sure that you are ready to submit."
          required
        />
      </div>
    </div>
    <div class={classNames('grid gap-3', !fields.meta.submitted.checked && 'grid-cols-2')}>
      {#if fields.meta.submitted.checked}
        <div class="shadow-sm rounded-md bg-green-100 px-4 py-2 text-green-900 text-center">
          Application submitted and in review!
        </div>
      {:else}
        <button
          type="button"
          on:click={() => handleSave(true)}
          class="shadow-sm rounded-md bg-gray-100 px-4 py-2 text-gray-900 hover:bg-gray-200 transition-colors duration-300 disabled:text-gray-500 disabled:bg-gray-200"
          >Save draft</button
        >
        <button
          type="submit"
          class="shadow-sm rounded-md bg-blue-100 px-4 py-2 text-blue-900 hover:bg-blue-200 transition-colors duration-300 disabled:text-blue-500 disabled:bg-blue-200"
          >Submit</button
        >
      {/if}
    </div>
  </fieldset>
</form>
