<script>
  import { classNames } from '$lib/utils'
  import { uniqueId, kebabCase, isUndefined, isArray, isBoolean } from 'lodash'

  let className = ''
  export { className as class }

  export let self = undefined
  export let id = uniqueId('input-')
  export let type = 'text'
  export let value
  export let placeholder = ''
  export let name = kebabCase(placeholder)
  export let required = false
  export let floating = false
  export let validation = []
  export let focus = false

  // if file input
  export let accept = undefined
  export let maxSize = 0
  $: if (self) {
    if (focus) {
      self.focus()
    }
  }
  $: {
    if (self) {
      const state = [
        [
          !(
            required &&
            (value === '' ||
              (self.files instanceof FileList && self.files.length === 0) ||
              (type === 'checkbox' && isArray(value) && value.length === 0))
          ),
          'Please fill required fields.'
        ],
        ...(type === 'file' ? [[!(value?.size > maxSize), 'File exceeds maximum size.']] : []),
        ...validation
      ].find(state => !state[0])
      self.setCustomValidity(isUndefined(state) ? '' : state[1])
    }
  }

  function handleInput(e) {
    if (e.target instanceof HTMLInputElement) {
      if (type === 'checkbox') {
        if (isArray(value)) {
          if (e.target.checked) {
            value = [name, ...value]
          } else {
            value = value.filter(item => item !== name)
          }
        } else {
          value = e.target.checked
        }
      } else if (type === 'number' || type === 'range') {
        value = +e.target.value
      } else if (
        type === 'file' &&
        e.target.files instanceof FileList &&
        e.target.files[0] instanceof File
      ) {
        value = e.target.files[0]
      } else {
        value = e.target.value
      }
    }
  }
</script>

{#if type === 'checkbox'}
  {#if isArray(value)}
    <div class="mt-2 flex">
      <input
        class={classNames(
          'peer mt-0.5 h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border border-gray-300 checked:border-gray-600 checked:bg-gray-600 focus:border-gray-600 focus:outline-none disabled:cursor-default disabled:checked:border-gray-400 disabled:checked:bg-gray-400',
          className
        )}
        type="checkbox"
        checked={value.includes(name)}
        bind:this={self}
        on:input={handleInput}
        {id}
        {name}
        {...$$restProps}
      />
      <label
        for={id}
        class="ml-2 cursor-pointer text-gray-900 peer-disabled:cursor-default peer-disabled:text-gray-400"
      >
        <span>
          {placeholder}
        </span>
      </label>
    </div>
  {:else}
    <div class="mt-2 flex">
      <input
        class={classNames(
          'peer mt-0.5 h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border border-gray-300 checked:border-gray-600 checked:bg-gray-600 focus:border-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-600 focus:ring-offset-1 disabled:cursor-default disabled:checked:border-gray-400 disabled:checked:bg-gray-400',
          className
        )}
        type="checkbox"
        checked={isBoolean(value) && value}
        bind:this={self}
        on:input={handleInput}
        {id}
        {name}
        {required}
        {...$$restProps}
      />
      <label
        for={id}
        class="ml-2 cursor-pointer text-gray-900 peer-disabled:cursor-default peer-disabled:text-gray-400"
      >
        <span>
          {placeholder}<span class="text-red-500">*</span>
        </span>
      </label>
    </div>
  {/if}
{:else if type === 'file'}
  <div class="mt-2">
    <label for={id}>
      <span>
        {placeholder}<span class="text-red-500">*</span>
      </span>
    </label>
    <input
      class={classNames(
        'mt-2 block h-12 w-full cursor-pointer appearance-none rounded-md border border-gray-300 text-gray-900 transition-colors file:mr-4 file:h-full file:cursor-pointer file:border-none file:bg-gray-700 file:px-4 file:text-white placeholder:text-gray-500 focus:border-gray-600 focus:outline-none disabled:bg-white disabled:text-gray-400 disabled:placeholder:text-gray-400',
        className
      )}
      type="file"
      accept={isUndefined(accept) ? '' : accept.join(',')}
      bind:this={self}
      on:input={handleInput}
      {id}
      {name}
      {required}
      {...$$restProps}
    />
  </div>
{:else if floating}
  <div class="relative mt-2 grow">
    <input
      class={classNames(
        'peer block h-12 w-full appearance-none rounded-md border border-gray-300 px-3 pt-1 text-gray-900 transition-colors focus:border-gray-600 focus:outline-none disabled:bg-white disabled:text-gray-400',
        className
      )}
      placeholder=" "
      bind:this={self}
      on:input={handleInput}
      {value}
      {type}
      {id}
      {name}
      {required}
      {...$$restProps}
    />
    <label
      class="absolute left-1 top-[0.65rem] z-10 origin-[0%_0%] -translate-y-4 transform cursor-text bg-white px-2 text-[0.8rem] leading-none text-gray-500 duration-150 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-base peer-focus:left-1 peer-focus:top-[0.65rem] peer-focus:-translate-y-4 peer-focus:text-[0.8rem] peer-focus:leading-none peer-disabled:text-gray-400"
      for={id}
    >
      <span>
        {placeholder}<span class="text-red-500">*</span>
      </span>
    </label>
  </div>
{:else}
  <div class="mt-2">
    <label for={id}>
      <span>
        {placeholder}<span class={classNames('text-red-500', !required && 'hidden')}>*</span>
      </span>
    </label>
    <input
      class={classNames(
        'mt-1 block h-12 w-full appearance-none rounded-md border border-gray-300 px-3 text-gray-900 transition-colors placeholder:text-gray-500 focus:border-gray-600 focus:outline-none disabled:bg-white disabled:text-gray-400 disabled:placeholder:text-gray-400',
        className
      )}
      bind:this={self}
      on:input={handleInput}
      {value}
      {type}
      {id}
      {name}
      {required}
      {...$$restProps}
    />
  </div>
{/if}

<style>
  input:checked {
    background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
    background-size: 100% 100%;
    background-repeat: no-repeat;
    background-position: center;
  }
  input:not(:required) + label > span > span {
    display: none;
  }
  input:required:disabled + label > span > span {
    color: #fca5a5;
  }
</style>
