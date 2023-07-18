<script>
  import { classNames } from '$lib/utils'
  import { doc, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore'
  import { db } from '$lib/firebase'
  import Input from '$lib/components/Input.svelte'
  import Select from '$lib/components/Select.svelte'
  import Textarea from '$lib/components/Textarea.svelte'
  import {
    gendersJson,
    schoolsJson,
    shirtSizeJson,
    dietaryRestrictionsJson,
    rolesJson,
    raceJson,
    prolangsJson,
    statesJson,
    worldJson,
    majorJson,
    reasonsJson,
    experienceJson,
    levelOfStudyJson
  } from '$lib/data'
  import { serialize } from '$lib/forms'
  import { alert } from '$lib/stores'
  import { fade } from 'svelte/transition'
  import Card from '$lib/components/Card.svelte'

  export let applicantUid = ''
  export let updated = function () {}
  let fields = {
    personal: {
      email: '',
      firstName: '',
      lastName: '',
      age: '',
      gender: '',
      race: [],
      underrepresented: false,
      phoneNumber: '',
      countryOfResidence: '',
      shippingAddress: '',
      shippingCity: '',
      shippingState: '',
      shippingCountry: '',
      shippingZipCode: '',
      dietaryRestrictions: []
    },
    academic: {
      enrolled: false,
      currentSchool: '',
      graduationYear: '',
      major: '',
      affiliated: false,
      levelOfStudy: ''
    },
    hackathon: {
      shirtSize: '',
      firstHackathon: false,
      previouslyParticipated: false,
      ableToAttend: false,
      reason: ''
    },
    openResponse: {
      roles: [],
      otherRole: '',
      prolangs: [],
      otherProlang: '',
      experience: '',
      whyHh: '',
      project: '',
      predictions: '',
      resume: {
        url: '',
        name: ''
      },
      resumeShare: false
    },
    agreements: { codeOfConduct: false, sharing: false, mlhEmails: false, submitting: false },
    meta: {
      hhid: '',
      uid: '',
      submitted: false
    },
    status: {
      accepted: false,
      rejected: false,
      waitlisted: false
    },
    timestamps: {
      created: serverTimestamp(),
      updated: serverTimestamp()
    }
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
              // fields = serialize.fromServer(application)
              fields = application
              suggestion = calculateSuggestion(fields)
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
    const isHarvardStudent = application.academic.currentSchool === 'Harvard University'
    // 18 years old as of 10/20/2023
    const is18YearsOld = new Date(application.personal.dateOfBirth) < new Date('2023-10-20')
    const isUSApplicant = application.personal.countryOfResidence === 'United States'
    const isMassachusettsApplicant = application.personal.state === 'Massachusetts'
    const essay1Length = application.openResponse.whyHh.split(' ').length
    const essay2Length = application.openResponse.project.split(' ').length
    const essay3Length = application.openResponse.predictions.split(' ').length
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
  function handleUpdate() {
    updateDoc(doc($db, 'applications', fields.meta.uid), {
      status: serialize.toServer(fields.status)
    })
      .then(() => {
        updated(fields)
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
  <div class="relative" transition:fade|local={{ duration: 150 }}>
    <!-- accept, reject, waitlist buttons -->
    <Card class="sticky top-0 mb-3 z-20">
      <div class="overflow-hidden overflow-x-auto">
        {#if fields.status.accepted || fields.status.rejected || fields.status.waitlisted}
          <div class="flex items-center sm:justify-between gap-4">
            <div
              class={classNames(
                'flex items-center gap-1 shadow-sm rounded-md px-4 py-2 whitespace-nowrap',
                fields.status.accepted && 'bg-green-100 text-green-900',
                fields.status.rejected && 'bg-red-100 text-red-900',
                fields.status.waitlisted && 'bg-yellow-100 text-yellow-900'
              )}
            >
              {#if fields.status.accepted}
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
              {:else if fields.status.rejected}
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
                  fields.status.accepted
                    ? 'accepted'
                    : fields.status.rejected
                    ? 'rejected'
                    : 'waitlisted'
                }.`}
              </span>
            </div>
            <button
              class="whitespace-nowrap uppercase text-sm shadow-sm rounded-md bg-gray-100 px-2 h-8 text-gray-900 hover:bg-gray-200 transition-colors duration-300 disabled:text-gray-500 disabled:bg-gray-200"
              on:click={() => {
                fields.status.accepted = false
                fields.status.rejected = false
                fields.status.waitlisted = false
                handleUpdate()
              }}
            >
              Clear decision
            </button>
          </div>
        {:else}
          <div class="flex items-center lg:justify-between gap-4">
            <div class="flex items-center gap-4">
              <button
                class="flex items-center gap-1 shadow-sm rounded-md bg-green-100 px-4 py-2 text-green-900 hover:bg-green-200 transition-colors duration-300 disabled:text-green-500 disabled:bg-green-200"
                on:click={() => {
                  fields.status.accepted = true
                  fields.status.rejected = false
                  fields.status.waitlisted = false
                  handleUpdate()
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
                  fields.status.accepted = false
                  fields.status.rejected = true
                  fields.status.waitlisted = false
                  handleUpdate()
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
                  fields.status.accepted = false
                  fields.status.rejected = false
                  fields.status.waitlisted = true
                  handleUpdate()
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
              class="whitespace-nowrap uppercase font-bold flex items-center gap-1 shadow-sm rounded-md bg-gray-100 px-4 py-2 text-gray-900 hover:bg-gray-200 transition-colors duration-300 disabled:text-gray-500 disabled:bg-gray-200"
              type="button"
              on:click={() => {
                if (suggestion.decision === 'accept') {
                  fields.status.accepted = true
                  fields.status.rejected = false
                  fields.status.waitlisted = false
                } else if (suggestion.decision === 'reject') {
                  fields.status.accepted = false
                  fields.status.rejected = true
                  fields.status.waitlisted = false
                } else if (suggestion.decision === 'waitlist') {
                  fields.status.accepted = false
                  fields.status.rejected = false
                  fields.status.waitlisted = true
                } else {
                  alert.trigger(
                    {
                      type: 'error',
                      message: 'No suggestion available.'
                    },
                    false
                  )
                }
                handleUpdate()
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
    <fieldset class="grid gap-6" disabled={true}>
      <div class="grid gap-1">
        <span class="font-bold">Personal</span>
        <Card class="my-2 grid gap-3">
          <div class="rounded-md bg-gray-100 px-3 py-2 shadow-sm">
            {`Name: ${fields.personal.firstName} ${fields.personal.lastName}`}
          </div>
          <div class="rounded-md bg-gray-100 px-3 py-2 shadow-sm">
            {`Email: ${fields.personal.email}`}
          </div>
          <div class="text-sm">
            {#if fields.meta.submitted}
              The above name and email was the copy submitted on your application.
            {:else}
              Wrong name or email? Go to your <a class="link" href="/profile">profile</a> to update your
              information.
            {/if}
          </div>
        </Card>
        {#if fields.openResponse.resume.url !== ''}
          <a class="mb-2" href={fields.openResponse.resume.url} target="_blank" rel="noreferrer">
            <Card class="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="h-6 w-6"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
              <span>{`${fields.openResponse.resume.name} (resume)`}</span>
            </Card>
          </a>
        {/if}
        <Input
          type="number"
          bind:value={fields.personal.age}
          placeholder="How old will you be on October 20th, 2023?"
          min="0"
          max="100"
          required
        />
        <Select
          bind:value={fields.personal.gender}
          placeholder="Gender"
          options={gendersJson}
          floating
          required
        />
        <div class="mt-2 grid gap-1">
          <span>Race / ethnicity (check all that apply)</span>
          <div class="grid grid-cols-2">
            {#each raceJson as race}
              <Input type="checkbox" bind:value={fields.personal.race} placeholder={race.name} />
            {/each}
          </div>
        </div>
        <Select
          bind:value={fields.personal.underrepresented}
          placeholder="Do you identify as part of an underrepresented group in the technology industry?"
          options={[{ name: 'Yes' }, { name: 'No' }, { name: 'Unsure' }]}
          required
        />
        <Input
          type="tel"
          bind:value={fields.personal.phoneNumber}
          placeholder="Phone number"
          floating
          required
        />
        <!-- <span class="text-sm">*format as +1 XXX-XXX-XXXX</span> -->
        <Select
          bind:value={fields.personal.countryOfResidence}
          placeholder="Country of residence"
          options={worldJson}
          floating
          required
        />
        <Input
          type="text"
          bind:value={fields.personal.shippingAddress}
          placeholder="Shipping Address"
          floating
          required
        />
        <div class="grid gap-1 sm:grid-cols-2 sm:gap-3">
          <Input
            type="text"
            bind:value={fields.personal.shippingCity}
            placeholder="City"
            floating
            required
          />
          <Select
            bind:value={fields.personal.shippingState}
            placeholder="State"
            options={statesJson}
            floating
          />
        </div>
        <div class="grid gap-1 sm:grid-cols-2 sm:gap-3">
          <Select
            bind:value={fields.personal.shippingCountry}
            placeholder="Country"
            options={worldJson}
            floating
            required
          />
          <Input
            type="text"
            bind:value={fields.personal.shippingZipCode}
            placeholder="Zip code"
            floating
            required
          />
        </div>
        <div class="mt-2 grid gap-1">
          <span> Do you have any dietary restrictions?</span>
          <div class="grid grid-cols-2">
            {#each dietaryRestrictionsJson as dietaryRestriction}
              <Input
                type="checkbox"
                bind:value={fields.personal.dietaryRestrictions}
                placeholder={dietaryRestriction.name}
              />
            {/each}
          </div>
        </div>
      </div>
      <div class="grid gap-1">
        <span class="font-bold">Academic</span>
        <Select
          bind:value={fields.academic.levelOfStudy}
          placeholder="What is your current education level?"
          options={levelOfStudyJson}
          floating
          required
        />
        <Input
          type="checkbox"
          bind:value={fields.academic.enrolled}
          placeholder="Will you be pursuing an undergraduate degree program at a university on October 20th, 2023?"
          required
        />
        <div class="grid gap-1 sm:grid-cols-3 sm:gap-3">
          <div class="sm:col-span-2">
            <Select
              bind:value={fields.academic.currentSchool}
              placeholder="Current school"
              options={schoolsJson}
              floating
              required
            />
          </div>
          <Input
            type="number"
            bind:value={fields.academic.graduationYear}
            placeholder="Graduation year"
            min={new Date().getFullYear()}
            max={new Date().getFullYear() + 20}
            floating
            required
          />
        </div>
        <Select
          bind:value={fields.academic.major}
          placeholder="Major / field of study"
          options={majorJson}
          floating
          required
        />
        <Input
          type="checkbox"
          bind:value={fields.academic.affiliated}
          placeholder="Are you affiliated with Harvard University? If so, make sure
        your profile uses your Harvard email."
        />
      </div>
      <div class="grid gap-1">
        <span class="font-bold">Hackathon</span>
        <div class="grid grid-cols-2 sm:grid-cols-3">
          <Select
            bind:value={fields.hackathon.shirtSize}
            placeholder="Shirt size"
            options={shirtSizeJson}
            floating
            required
          />
        </div>
        <Input
          type="checkbox"
          bind:value={fields.hackathon.firstHackathon}
          placeholder="Will HackHarvard be your first hackathon?"
        />
        {#if !fields.hackathon.firstHackathon}
          <Input
            type="checkbox"
            bind:value={fields.hackathon.previouslyParticipated}
            placeholder="Have you previously participated at a HackHarvard hackathon?"
          />
        {/if}
        <Input
          type="checkbox"
          bind:value={fields.hackathon.ableToAttend}
          placeholder="HackHarvard is an in-person event. Will you be able to be in Cambridge, MA, United States, considering both the legal requirements for international students and the logistical aspects, on October 20th, 2023?"
          required
        />
        <Select
          bind:value={fields.hackathon.reason}
          placeholder="How did you learn about HackHarvard?"
          options={reasonsJson}
          required
        />
      </div>
      <div class="grid gap-1">
        <span class="font-bold">Open response</span>
        <div class="mt-2 grid gap-1">
          <span>
            What roles best fit your capabilities on a hackathon team?<span class="text-red-500">
              *
            </span>
          </span>
          <div class="grid grid-cols-2">
            {#each rolesJson as role}
              <Input
                type="checkbox"
                bind:value={fields.openResponse.roles}
                placeholder={role.name}
              />
            {/each}
          </div>
        </div>
        <div class="mt-2">
          <Textarea
            bind:value={fields.openResponse.otherRole}
            placeholder="If other, what other roles could you see yourself playing?"
            required={fields.openResponse.roles.includes('other')}
            rows={1}
            maxlength={200}
          />
        </div>
        <div class="mt-2 grid gap-1">
          <span>
            Check up to 5 of the programming languages that you feel most comfortable in.<span
              class="text-red-500"
            >
              *
            </span>
          </span>
          <div class="grid grid-cols-2">
            {#each prolangsJson as prolang}
              <Input
                type="checkbox"
                bind:value={fields.openResponse.prolangs}
                placeholder={prolang.name}
                validation={[
                  [fields.openResponse.prolangs.length <= 5, 'Check up to 5 programming languages.']
                ]}
                required
              />
            {/each}
          </div>
        </div>
        <div>
          <Textarea
            bind:value={fields.openResponse.otherProlang}
            placeholder="If other, what other programming languages?"
            required={fields.openResponse.prolangs.includes('other')}
            rows={1}
            maxlength={200}
          />
        </div>
        <Select
          bind:value={fields.openResponse.experience}
          placeholder="How much experience do you have with computer science?"
          options={experienceJson}
          required
        />
        <div class="mt-2">
          <Textarea
            bind:value={fields.openResponse.whyHh}
            placeholder={`Share your goals and aspirations for this event and how you plan to make the most of your HackHarvard experience. What specific areas are you eager to learn more about, and what skills or technologies are you excited to acquire or improve?`}
            required
            maxlength={500}
          />
        </div>
        <div class="mt-2">
          <Textarea
            bind:value={fields.openResponse.project}
            placeholder={`HackHarvard is all about sparking creativity and making a positive difference through innovative projects. We'd love to hear about a project you've been part of that embodies this spirit. How did your project bring a touch of magic or create a lasting impact, whether big or small, on the people or community it reached?`}
            required
            maxlength={500}
          />
        </div>
        <div class="mt-2">
          <Textarea
            bind:value={fields.openResponse.predictions}
            placeholder={`In line with the theme "Hack to the Future" for HackHarvard 2023, we invite you to unleash your creativity and envision three predictions for the year 2073. Let your imagination soar as you consider how the world may have transformed. Did OpenAI create AGI? Is Taylor Swift’s granddaughter allergic to tree nuts? Does the iPhone 55 have a headphone jack? Are cat videos still funny? Share your captivating predictions with us!`}
            required
            maxlength={500}
          />
        </div>
        <Input
          type="checkbox"
          bind:value={fields.openResponse.resumeShare}
          placeholder="If you are accepted to HackHarvard 2023, would you like us to share your resume with our sponsors for potential recruitment opportunities?"
        />
      </div>
      <div class="grid gap-1">
        <span class="font-bold">Agreements</span>
        <div class="grid">
          <Input
            type="checkbox"
            bind:value={fields.agreements.codeOfConduct}
            placeholder="I have read and agree to the MLH Code of Conduct (https://static.mlh.io/docs/mlh-code-of-conduct.pdf)."
            required
          />
          <Input
            type="checkbox"
            bind:value={fields.agreements.sharing}
            placeholder="I authorize you to share my application/registration information with Major League Hacking for event administration, ranking, and MLH administration in-line with the MLH Privacy Policy (https://mlh.io/privacy). I further agree to the terms of both the MLH Contest Terms and Conditions (https://github.com/MLH/mlh-policies/blob/main/contest-terms.md)and the MLH Privacy Policy (https://mlh.io/privacy)"
            required
          />
          <Input
            type="checkbox"
            bind:value={fields.agreements.mlhEmails}
            placeholder="I authorize MLH to send me an email where I can further opt into the MLH Hacker, Events, or
        Organizer Newsletters and other communications from MLH."
          />
          <Input
            type="checkbox"
            bind:value={fields.agreements.submitting}
            placeholder="I understand submitting means I can no longer make changes to my application. Don't check this box until you are sure that you are ready to submit."
            required
          />
        </div>
      </div>
      <div class={classNames('grid gap-3', !fields.meta.submitted && 'grid-cols-2')}>
        {#if fields.meta.submitted}
          <div class="rounded-md bg-green-100 px-4 py-2 text-center text-green-900 shadow-sm">
            Application submitted and in review!
          </div>
        {:else}
          <button
            type="button"
            on:click={() => handleSave(true)}
            class="rounded-md bg-gray-100 px-4 py-2 text-gray-900 shadow-sm transition-colors duration-300 hover:bg-gray-200 disabled:bg-gray-200 disabled:text-gray-500"
          >
            Save draft
          </button>
          <button
            type="submit"
            class="rounded-md bg-blue-100 px-4 py-2 text-blue-900 shadow-sm transition-colors duration-300 hover:bg-blue-200 disabled:bg-blue-200 disabled:text-blue-500"
          >
            Submit
          </button>
        {/if}
      </div>
    </fieldset>
  </div>
{:catch}
  <div class="flex items-center justify-center h-full">
    <span class="text-sm uppercase">Error loading data. Please try again</span>.
  </div>
{/await}
