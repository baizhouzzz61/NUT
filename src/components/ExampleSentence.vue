<script setup>
import { NTag } from 'naive-ui'
import { SOURCE_AI } from '../shared/schema'

defineProps({
  index: { type: Number, required: true },
  text: { type: String, required: true },
  source: { type: String, required: true },
  transcriptTitle: { type: String, default: null },
})

const fromTranscript = (source) => source !== SOURCE_AI
</script>

<template>
  <div
    :style="{
      padding: '8px 12px',
      borderRadius: '6px',
      background: fromTranscript(source) ? '#f0f9eb' : 'transparent',
      border: fromTranscript(source) ? '1px solid #b3e19d' : '1px solid #eee',
    }"
  >
    {{ index }}. {{ text }}
    <NTag
      size="tiny"
      :type="fromTranscript(source) ? 'success' : 'default'"
      style="margin-left: 8px"
    >
      {{ fromTranscript(source) ? `From: ${transcriptTitle}` : 'AI' }}
    </NTag>
  </div>
</template>
