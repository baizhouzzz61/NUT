<script setup>
import { ref, h, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTranscriptStore } from '../stores/transcript'
import { useTopicStore } from '../stores/topic'
import { generateTopic } from '../api'
import { enrichExamples, SOURCE_AI } from '../shared/schema'
import {
  NButton, NCheckbox, NDataTable, NModal, NText, NH1, NSpace,
  NCard, NTag, NDivider, NSpin, NPopconfirm, useMessage
} from 'naive-ui'

const router = useRouter()
const transcriptStore = useTranscriptStore()
const topicStore = useTopicStore()
const message = useMessage()

const selectedIds = ref(new Set())
const generating = ref(false)
const generatedTopic = ref(null)
const showPreview = ref(false)
const previewTopic = ref(null)

function toggleSelect(id) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

async function doGenerate() {
  if (selectedIds.value.size === 0) {
    message.warning('Select at least one transcript')
    return
  }
  generating.value = true
  try {
    const selected = transcriptStore.transcripts.filter(t => selectedIds.value.has(t.id))
    const slim = selected.map(({ id, title, content }) => ({ id, title, content }))
    const { topic } = await generateTopic(slim)

    topic.examples = enrichExamples(topic.examples, slim)
    topic.usedTranscriptIds = slim.map(t => t.id)

    generatedTopic.value = topic
    message.success('Topic generated')
  } catch (e) {
    message.error(e.message)
  } finally {
    generating.value = false
  }
}

async function saveGenerated() {
  await topicStore.saveTopic(generatedTopic.value)
  message.success('Topic saved to history')
  generatedTopic.value = null
}

function preview(topic) {
  previewTopic.value = topic
  showPreview.value = true
}
</script>

<template>
  <div style="max-width: 900px; margin: 40px auto; padding: 0 20px">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
      <NH1>Topic Generator</NH1>
      <NSpace>
        <NButton @click="router.push('/')" secondary>Library</NButton>
        <NButton @click="router.push('/history')" tertiary>History</NButton>
      </NSpace>
    </div>

    <NCard title="1. Select source transcripts" size="small" style="margin-bottom: 16px">
      <NText depth="3" v-if="!transcriptStore.transcripts.length">
        No transcripts yet — go to Library to add some.
      </NText>
      <div v-for="t in transcriptStore.transcripts" :key="t.id" style="margin-bottom: 4px">
        <NCheckbox :checked="selectedIds.has(t.id)" @update:checked="() => toggleSelect(t.id)">
          {{ t.title }}
          <NTag size="tiny" :bordered="false" style="margin-left: 8px">
            {{ t.source === 'audio' ? 'Audio' : 'Manual' }}
          </NTag>
        </NCheckbox>
      </div>
    </NCard>

    <NButton type="primary" :loading="generating" @click="doGenerate" :disabled="selectedIds.size === 0" block>
      {{ generating ? 'Generating...' : `2. Generate Topic (${selectedIds.size} transcripts selected)` }}
    </NButton>

    <div v-if="generatedTopic" style="margin-top: 24px">
      <NCard :title="generatedTopic.title" size="small">
        <template #header-extra>
          <NButton type="primary" size="small" @click="saveGenerated">Save to History</NButton>
        </template>
        <div v-for="(ex, i) in generatedTopic.examples" :key="i" style="margin-bottom: 8px">
          <div :style="{ padding: '8px 12px', borderRadius: '6px',
            background: ex.source !== SOURCE_AI ? '#f0f9eb' : 'transparent',
            border: ex.source !== SOURCE_AI ? '1px solid #b3e19d' : '1px solid #eee' }">
            {{ i + 1 }}. {{ ex.text }}
            <NTag size="tiny" :type="ex.source !== SOURCE_AI ? 'success' : 'default'" style="margin-left: 8px">
              {{ ex.source !== SOURCE_AI ? `From: ${ex.transcriptTitle}` : 'AI' }}
            </NTag>
          </div>
        </div>
      </NCard>
    </div>
  </div>

  <NModal v-model:show="showPreview" title="Topic Detail" style="width: 700px">
    <div v-if="previewTopic" style="padding: 8px">
      <div v-for="(ex, i) in previewTopic.examples" :key="i" style="margin-bottom: 8px">
        <div :style="{ padding: '8px 12px', borderRadius: '6px',
          background: ex.source !== SOURCE_AI ? '#f0f9eb' : 'transparent',
          border: ex.source !== SOURCE_AI ? '1px solid #b3e19d' : '1px solid #eee' }">
          {{ i + 1 }}. {{ ex.text }}
          <NTag size="tiny" :type="ex.source !== SOURCE_AI ? 'success' : 'default'" style="margin-left: 8px">
            {{ ex.source !== SOURCE_AI ? `From: ${ex.transcriptTitle}` : 'AI' }}
          </NTag>
        </div>
      </div>
    </div>
  </NModal>
</template>
