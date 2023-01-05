<script>
  import { classNames } from '$lib/utils'
  import { uniqueId, kebabCase } from 'lodash-es'

  export let self
  export let field = {
    type: '',
    value: '',
    error: false
  }
  export let placeholder = ''
  export let name = kebabCase(placeholder)
  let className = ''
  export { className as class }
  export let required = false

  const id = uniqueId('textarea-')
  function handleInput(e) {
    field.value = e.target.value
  }
</script>

<div class="mt-2">
  <label for={id}>
    <span>
      {placeholder}<span class={classNames('text-red-500', !required && 'hidden')}>*</span>
    </span>
  </label>
  <textarea
    class={classNames(
      'mt-2 min-h-[10rem] appearance-none block p-3 w-full transition-colors text-gray-900 rounded-md border border-gray-300 focus:outline-none focus:border-gray-600 placeholder:text-gray-500 disabled:bg-white disabled:text-gray-400 disabled:placeholder:text-gray-400',
      field.error ? 'border-red-300 focus:border-red-600' : 'border-gray-300 focus:border-gray-600',
      className
    )}
    value={field.value}
    bind:this={self}
    on:input={handleInput}
    {id}
    {name}
    {required}
    {...$$restProps}
  />
</div>
