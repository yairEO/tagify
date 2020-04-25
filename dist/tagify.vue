<template>
  <textarea v-if="mode === 'textarea'" v-on:change="onChange">{{ initialValue ? initialValue : '' }}</textarea>
  <input v-else :value="initialValue" v-on:change="onChange">
</template>

<script>
import Tagify from "./tagify.min.js"
import "./tagify.css"

export default {
  name: "tagify",
  props: {
    mode: String,
    settings: Object,
    onChange: Function,
    initialValue: String
  },
  mounted() {
    this.tagify = new Tagify(this.$el, this.settings)
  }
}
</script>