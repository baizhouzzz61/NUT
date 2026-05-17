<script setup>
import { NMessageProvider, NConfigProvider, zhCN } from 'naive-ui'
</script>

<template>
  <NConfigProvider :locale="zhCN">
    <NMessageProvider>
      <router-view />
    </NMessageProvider>
  </NConfigProvider>
</template>
