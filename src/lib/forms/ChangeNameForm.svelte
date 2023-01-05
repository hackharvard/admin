<script>
  import Input from '$lib/components/Input.svelte'
  import { classNames } from '$lib/utils'
  import { createFields, isValid } from '$lib/forms'
  import { user, db } from '$lib/firebase'
  import { alert } from '$lib/stores'
  import { onMount } from 'svelte'
  import { getDoc, doc, updateDoc } from 'firebase/firestore'
  import { updateProfile } from 'firebase/auth'

  let formEl
  let disabled = true
  let showValidation = false
  let fields = {
    default: createFields.text('firstName', 'lastName')
  }
  onMount(async () => {
    const userDoc = await getDoc(doc($db, 'users', $user.uid))
    const userDocData = userDoc.data()
    fields.default.firstName.value = userDocData.firstName
    fields.default.lastName.value = userDocData.lastName
    disabled = false
  })
  function handleSubmit() {
    showValidation = true
    if (isValid(formEl)) {
      disabled = true
      const firstName = fields.default.firstName.value.trim()
      const lastName = fields.default.lastName.value.trim()
      updateDoc(doc($db, 'users', $user.uid), {
        firstName,
        lastName
      })
        .then(() =>
          updateProfile($user, {
            displayName: `${firstName} ${lastName}`
          }).then(() => {
            disabled = false
            alert.trigger('success', 'Name successfully updated.')
          })
        )
        .catch(err => {
          disabled = false
          alert.trigger('error', err.code)
        })
    }
  }
</script>

<form
  class={classNames('max-w-lg w-full grid', showValidation && 'show-validation')}
  bind:this={formEl}
  on:submit|preventDefault={handleSubmit}
  novalidate
>
  <fieldset {disabled}>
    <span class="font-bold">Name</span>
    <div class="flex items-center gap-3">
      <div class="grid grid-cols-2 gap-3 grow">
        <Input
          type="text"
          field={fields.default.firstName}
          placeholder="First name"
          floating
          required
        />
        <Input
          type="text"
          bind:field={fields.default.lastName}
          placeholder="Last name"
          floating
          required
        />
      </div>
      <button
        class="mt-2 flex items-center justify-center h-12 w-12 shadow-sm rounded-md bg-blue-100 text-blue-900 hover:bg-blue-200 transition-colors duration-300 disabled:text-blue-500 disabled:bg-blue-200"
        type="submit"
        ><svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-6 w-6"
          ><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline
            points="17 21 17 13 7 13 7 21"
          /><polyline points="7 3 7 8 15 8" /></svg
        ></button
      >
    </div>
  </fieldset>
</form>
