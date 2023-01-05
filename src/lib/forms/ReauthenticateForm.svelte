<script>
  import Input from '$lib/components/Input.svelte'
  import { classNames } from '$lib/utils'
  import { createFields, enableErrors, disableErrors, isValid } from '$lib/forms'
  import { user } from '$lib/firebase'
  import { alert } from '$lib/stores'
  import Brand from '$lib/components/Brand.svelte'
  import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()
  let formEl
  let showValidation = false
  let fields = {
    default: createFields.text('password')
  }
  function handleSubmit() {
    showValidation = true
    if (isValid(formEl)) {
      reauthenticateWithCredential(
        $user,
        EmailAuthProvider.credential($user.email, fields.default.password.value)
      )
        .then(() => {
          fields = disableErrors.allSections(fields)
          dispatch('reauthenticated', true)
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
  <h1 class="text-2xl mt-1 font-bold">Reauthenticate</h1>
  <Input
    type="password"
    bind:field={fields.default.password}
    placeholder="Password"
    floating
    required
    autocomplete="current-password"
  />
  <div class="flex items-center justify-between mt-2">
    <div class="flex flex-col gap-1">
      <a class="link" href="/reset-password">Forgot password?</a>
    </div>
    <button
      class="shadow-sm rounded-md bg-blue-100 px-4 py-2 text-blue-900 hover:bg-blue-200 transition-colors duration-300"
      type="submit"
    >
      Reauthenticate
    </button>
  </div>
</form>
