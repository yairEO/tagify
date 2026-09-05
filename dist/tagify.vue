<template>
  <textarea v-if="mode === 'textarea'" ref="textarea" v-model="tags" />
  <input v-else ref="input" v-model="tags" />
</template>

<script setup>
import Tagify from './tagify.js'
import './tagify.css'

import { onMounted, useTemplateRef, watch } from 'vue'

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
})

watch(tags, (newVal) => {
  tagify.loadOriginalValues(newVal)
})
</script>
