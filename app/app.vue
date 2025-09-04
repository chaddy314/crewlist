<script setup lang="ts">
import * as locales from '@nuxt/ui/locale'
import {useI18n} from "vue-i18n";

const { locale } = useI18n();
</script>

c<template>
  <UApp :toaster="{ position: 'bottom-right', expand: true, duration: 2000 }" :locale="locales[locale]">
    <NuxtPage/>
  </UApp>
</template>