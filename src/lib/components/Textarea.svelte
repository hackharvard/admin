<script>
  import { classNames } from '$lib/utils'
  import { uniqueId, kebabCase, isUndefined } from 'lodash'
  import { fade } from 'svelte/transition'

  let className = ''
  export { className as class }

  export let self = undefined
  export let id = uniqueId('textarea-')
  export let value
  export let placeholder = ''
  export let name = kebabCase(placeholder)
  export let required = false
  export let rows = 5
  const calcHeight = 1.5 + 1.5 * rows

  let timer
  let visible = false
  function handleInput(e) {
    clearTimeout(timer)
    if (!visible) {
      visible = true
    }
    value = e.target.value
  }
  function handleKeyUp() {
    clearTimeout(timer)
    timer = setTimeout(() => {
      visible = false
    }, 750)
  }
</script>

<div class="relative mt-2">
  <label for={id}>
    <span>
      {placeholder}<span class={classNames('text-red-500', !required && 'hidden')}>*</span>
    </span>
  </label>
  <textarea
    class={classNames(
      'mt-2 block h-min w-full appearance-none rounded-md border border-gray-300 p-3 text-gray-900 transition-colors placeholder:text-gray-500 focus:border-gray-600 focus:outline-none disabled:bg-white disabled:text-gray-400 disabled:placeholder:text-gray-400',
      className
    )}
    style={`min-height:${calcHeight}rem;height:${calcHeight}rem`}
    bind:this={self}
    on:input={handleInput}
    on:keyup={handleKeyUp}
    {id}
    {value}
    {name}
    {required}
    {...$$restProps}
  />
  {#if $$restProps?.maxlength && visible}
    <div
      class="absolute bottom-3 right-3 rounded border border-gray-100 bg-gray-100 px-1 text-gray-500 shadow-sm"
      transition:fade
    >
      {value?.length || 0}/{$$restProps.maxlength}
    </div>
  {/if}
</div>
