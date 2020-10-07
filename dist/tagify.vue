<template v-once>
  <textarea v-if="mode === 'textarea'" v-model="value"/>
  <input v-else :value="value" v-on:change="onChange">
</template>

<script>
import Tagify from "./tagify.min.js"
import "./tagify.css"

export default {
  name: "Tags",
  props: {
    mode: String,
    settings: Object,
    value: [String, Array],
    onChange: Function
  },
  watch: {
    value(newVal, oldVal) {
      this.tagify.loadOriginalValues(newVal)
    },
  },
  mounted() {
    this.tagify = new Tagify(this.$el, this.settings)
  }
};
</script>