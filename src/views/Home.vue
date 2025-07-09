<script setup lang="ts">
import Header from "../components/Header.vue"
import Recommend from "./recommend/recommend.vue"
</script>

<template>
  <Header/>
  <router-view />
  <Recommend />
</template>


<style scoped>
</style>
