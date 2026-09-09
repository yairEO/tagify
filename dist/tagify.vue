<template>
  <textarea v-if="mode === 'textarea'" ref="textarea" />
  <input v-else ref="input" type="text" />
</template>

<script setup>
import Tagify from './tagify.js'
import './tagify.css'

import { onMounted, useTemplateRef } from 'vue'

defineOptions({
  name: 'Tags',
})

const tags = defineModel()

const { mode, settings } = defineProps({
  mode: String,
  settings: Object,
})

let tagify
let el

if (mode === 'textarea') {
  el = useTemplateRef('textarea')
} else {
  el = useTemplateRef('input')
}

onMounted(() => {
  tagify = new Tagify(el.value, settings)
  tagify.loadOriginalValues(tags.value)
  eventCallbacks()
})

const eventCallbacks = () => {
  tagify.on('add', () => {
    tags.value = tagify.value.map((v) => v.value)
  })
  tagify.on('remove', () => {
    tags.value = tagify.value.map((v) => v.value)
  })
}
</script>
