export default defineAppConfig({
  // https://ui.nuxt.com/getting-started/theme#design-system
  ui: {
    colors: {
      primary: 'emerald',
      neutral: 'slate',
    },
    container: {
      base: 'w-full max-w-(--ui-container) mx-auto px-4 sm:px-6 lg:px-8'
    },
    accordion: {
      slots: {
        root: 'w-full',
        item: 'border-b border-default last:border-b-0',
        header: 'flex',
        trigger: 'group flex-1 flex items-center gap-1.5 font-medium text-sm py-3.5 focus-visible:outline-primary min-w-0',
        // Remove the problematic animations
        content: 'overflow-hidden focus:outline-none transition-all duration-200',
        body: 'text-sm pb-3.5',
        leadingIcon: 'shrink-0 size-5',
        trailingIcon: 'shrink-0 size-5 ms-auto group-data-[state=open]:rotate-180 transition-transform duration-200',
        label: 'text-start break-words'
      },
      variants: {
        disabled: {
          true: {
            trigger: 'cursor-not-allowed opacity-75'
          }
        }
      }
    },
    button: {
      defaultVariants: {
        // Set default button color to neutral
        // color: 'neutral'
      }
    }
  }
})
