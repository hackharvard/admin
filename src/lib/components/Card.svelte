<script>
  import { classNames } from '$lib/utils'
  let className = ''
  export { className as class }
</script>

<div class={classNames('w-full rounded-md shadow border border-gray-200 p-4', className)}>
  {#if $$slots.title}
    <h2 class="font-bold text-2xl">
      <slot name="title" />
    </h2>
  {/if}
  <slot />
</div>
