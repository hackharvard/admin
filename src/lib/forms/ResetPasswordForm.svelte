<script>
  import Input from '$lib/components/Input.svelte'
  import { classNames } from '$lib/utils'
  import { createFields, enableErrors, disableErrors, isValid } from '$lib/forms'
  import { auth, user } from '$lib/firebase'
  import { alert } from '$lib/stores'
  import Brand from '$lib/components/Brand.svelte'
  import { sendPasswordResetEmail } from 'firebase/auth'
  import { onMount } from 'svelte'

  let formEl
  let showValidation = false
  let fields = {
    default: createFields.text('email')
  }
  $: signedIn = $user === undefined ? true : $user
  onMount(async () => {
    const userData = await user.get()
    if (userData) {
      fields.default.email.value = userData.email
    }
  })
  function handleSubmit() {
    showValidation = true
    if (isValid(formEl)) {
      sendPasswordResetEmail($auth, fields.default.email.value)
        .then(() => {
          fields = disableErrors.allSections(fields)
          alert.trigger('info', 'Password reset email was sent. Please check your inbox.')
        })
        .catch(err => {
          fields = enableErrors.allSections(fields)
          alert.trigger('error', err.code)
        })
    }
  }
</script>

<form
  class={classNames('max-w-lg w-full grid gap-2', showValidation && 'show-validation')}
  bind:this={formEl}
  on:submit|preventDefault={handleSubmit}
  novalidate
>
  <Brand />
  <h1 class="text-2xl mt-1 font-bold">Reset password</h1>
  <Input type="email" bind:field={fields.default.email} placeholder="Email" floating required />
  <div class={classNames('flex items-center mt-2', signedIn ? 'justify-end' : 'justify-between')}>
    {#if !signedIn}
      <span>
        <a class="link" href="/signup">Sign up</a> or
        <a class="link" href="/signin">sign in</a>.
      </span>
    {/if}
    <button
      class="shadow-sm rounded-md bg-blue-100 px-4 py-2 text-blue-900 hover:bg-blue-200 transition-colors duration-300"
      type="submit"
    >
      Send email
    </button>
  </div>
</form>
