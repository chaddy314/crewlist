// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/test-utils',
    '@nuxt/scripts',
    '@nuxtjs/i18n'
  ],

  css: ['~/assets/css/main.css'],

  future: {
    compatibilityVersion: 4
  },

  compatibilityDate: '2024-11-27',
  vite: {
    resolve: {
      alias: {
        'jspdf': 'jspdf/dist/jspdf.es.js'
      }
    }
  },
  i18n: {
    defaultLocale: 'en',
    locales: [
      { code: 'en', name: 'English', file: 'en.json' , icon: 'i-circle-flags-en' },
      { code: 'de', name: 'German', file: 'de.json', icon: 'i-circle-flags-de'}
    ]
  }
})