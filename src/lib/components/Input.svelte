<script>
  import { classNames } from '$lib/utils'
  import { uniqueId, kebabCase } from 'lodash-es'
  import { fieldsJson } from '$lib/data'
  import { alert } from '$lib/stores'

  export let self
  export let type = 'text'
  export let field = fieldsJson[type]
  export let placeholder = ''
  export let name = kebabCase(placeholder)
  export let floating = false
  export let group = null
  export let maxSize = 0
  export let accept = []
  export let required = false
  let className = ''
  export { className as class }

  const id = uniqueId('input-')
  function handleInput(e) {
    if (type === 'checkbox') {
      if (group) {
        if (e.target.checked) {
          group.value = [name, ...group.value]
        } else {
          group.value = group.value.filter(item => item !== name)
        }
      } else {
        field.checked = e.target.checked
      }
    } else if (type === 'number' || type === 'range') {
      field.value = +e.target.value
    } else if (type === 'file') {
      field.value = e.target.files[0]
      if (field.value?.size > maxSize) {
        self.setCustomValidity(' ')
        alert.trigger('error', 'File exceeds maximum size.', false)
      } else {
        self.setCustomValidity('')
      }
    } else {
      field.value = e.target.value
    }
  }
</script>

<div class="mt-2">
  {#if type === 'checkbox'}
    {#if group}
      <div class="flex mt-2">
        <input
          class={classNames(
            'cursor-pointer mt-0.5 shrink-0 appearance-none w-5 h-5 rounded-md border border-gray-300 focus:outline-none focus:border-gray-600 checked:bg-gray-600 checked:border-gray-600 peer disabled:checked:bg-gray-400 disabled:checked:border-gray-400 disabled:cursor-default',
            field.error
              ? 'border-red-300 focus:border-red-600'
              : 'border-gray-300 focus:border-gray-600',
            className
          )}
          type="checkbox"
          checked={group.value.includes(name)}
          bind:this={self}
          on:input={handleInput}
          {id}
          {name}
          {required}
          {...$$restProps}
        />
        <label
          for={id}
          class="ml-3 text-gray-900 cursor-pointer peer-disabled:text-gray-400 peer-disabled:cursor-default"
        >
          <span>
            {placeholder}<span class="text-red-500">*</span>
          </span>
        </label>
      </div>
    {:else}
      <div class="flex mt-2">
        <input
          class={classNames(
            'cursor-pointer mt-0.5 shrink-0 appearance-none w-5 h-5 rounded-md border border-gray-300 focus:outline-none focus:border-gray-600 checked:bg-gray-600 checked:border-gray-600 peer disabled:checked:bg-gray-400 disabled:checked:border-gray-400 disabled:cursor-default',
            field.error
              ? 'border-red-300 focus:border-red-600'
              : 'border-gray-300 focus:border-gray-600',
            className
          )}
          type="checkbox"
          checked={field.checked}
          bind:this={self}
          on:input={handleInput}
          {id}
          {name}
          {required}
          {...$$restProps}
        />
        <label
          for={id}
          class="ml-3 text-gray-900 cursor-pointer peer-disabled:text-gray-400 peer-disabled:cursor-default"
        >
          <span>
            {placeholder}<span class="text-red-500">*</span>
          </span>
        </label>
      </div>
    {/if}
  {:else if type === 'file'}
    <label for={id}>
      <span>
        {placeholder}<span class="text-red-500">*</span>
      </span>
    </label>
    <input
      class={classNames(
        'cursor-pointer file:cursor-pointer mt-2 appearance-none block h-12 w-full transition-colors text-gray-900 rounded-md border border-gray-300 focus:outline-none focus:border-gray-600 placeholder:text-gray-500 disabled:bg-white disabled:text-gray-400 disabled:placeholder:text-gray-400 file:bg-gray-700 file:text-white file:h-full file:border-none file:px-4 file:mr-4',
        field.error
          ? 'border-red-300 focus:border-red-600'
          : 'border-gray-300 focus:border-gray-600',
        className
      )}
      type="file"
      accept={accept.join(',')}
      bind:this={self}
      on:input={handleInput}
      {id}
      {name}
      {required}
      {...$$restProps}
    />
  {:else if floating}
    <div class="relative">
      <input
        class={classNames(
          'appearance-none block px-3 pt-1 h-12 w-full transition-colors text-gray-900 rounded-md border focus:outline-none peer disabled:bg-white disabled:text-gray-400',
          field.error
            ? 'border-red-300 focus:border-red-600'
            : 'border-gray-300 focus:border-gray-600',
          className
        )}
        placeholder=" "
        value={field.value}
        bind:this={self}
        on:input={handleInput}
        {type}
        {id}
        {name}
        {required}
        {...$$restProps}
      />
      <label
        class="cursor-text absolute text-gray-500 duration-150 transform -translate-y-4 top-[0.65rem] left-1 text-[0.8rem] leading-none z-10 origin-[0%_0%] bg-white px-2 peer-focus:-translate-y-4 peer-focus:top-[0.65rem] peer-focus:left-1 peer-focus:text-[0.8rem] peer-focus:leading-none peer-placeholder-shown:text-base peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2"
        for={id}
      >
        <span>
          {placeholder}<span class="text-red-500">*</span>
        </span>
      </label>
    </div>
  {:else}
    <label for={id}>
      <span>
        {placeholder}<span class={classNames('text-red-500', !required && 'hidden')}>*</span>
      </span>
    </label>
    <input
      class={classNames(
        'appearance-none block px-3 h-12 w-full transition-colors text-gray-900 rounded-md border border-gray-300 focus:outline-none focus:border-gray-600 placeholder:text-gray-500 disabled:bg-white disabled:text-gray-400 disabled:placeholder:text-gray-400',
        field.error
          ? 'border-red-300 focus:border-red-600'
          : 'border-gray-300 focus:border-gray-600',
        className
      )}
      value={field.value}
      bind:this={self}
      on:input={handleInput}
      {type}
      {id}
      {name}
      {placeholder}
      {required}
      {...$$restProps}
    />
  {/if}
</div>

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
