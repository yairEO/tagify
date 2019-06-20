<template>
  <textarea v-if="mode=='textarea'"></textarea>
  <input v-else>
</template>

<script>
import Tagify from "./tagify";
export default {
  name: "tagify",
  props: {
    mode: String,
    settings: Object
  },
  mounted() {
    this.tagify = new Tagify(this.$el, this.settings);
  }
};
</script>

<style>
  @import "./tagify.css";
</style>

