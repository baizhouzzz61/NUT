<script setup>
import { ref, h } from 'vue'
import { useRouter } from 'vue-router'
import { useTopicStore } from '../stores/topic'
import {
  NButton, NDataTable, NModal, NText, NH1, NSpace,
} from 'naive-ui'

const router = useRouter()
const store = useTopicStore()

const showPreview = ref(false)
const previewTopic = ref(null)

function preview(topic) {
  previewTopic.value = topic
  showPreview.value = true
}

const columns = [
  { title: 'Title', key: 'title', ellipsis: { tooltip: true } },
  { title: 'Sources', key: 'sources', width: 100,
    render(row) {
      return `${row.usedTranscriptIds?.length || 0} transcripts`
    }
  },
  { title: 'Created', key: 'createdAt', width: 180,
    render(row) { return new Date(row.createdAt).toLocaleString() }
  },
  {
    title: 'Actions', key: 'actions', width: 100,
    render(row) {
      return h(NButton, { size: 'small', onClick: () => preview(row) }, { default: () => 'View' })
    }
  },
]
</script>

<template>
  <div style="max-width: 900px; margin: 40px auto; padding: 0 20px">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
      <NH1>Topic History</NH1>
      <NSpace>
        <NButton @click="router.push('/')" secondary>Library</NButton>
        <NButton @click="router.push('/generate')" tertiary>Generate</NButton>
      </NSpace>
    </div>

    <NDataTable :columns="columns" :data="store.topics" :bordered="false" />
    <NText v-if="!store.topics.length" depth="3" style="display: block; text-align: center; margin-top: 60px">
      No topics yet. Go to Generator to create one.
    </NText>

    <NModal v-model:show="showPreview" preset="card" title="Topic Detail" style="width: 750px">
      <div v-if="previewTopic" style="max-height: 70vh; overflow-y: auto">
        <h2 style="margin-top: 0">{{ previewTopic.title }}</h2>
        <div style="white-space: pre-wrap; line-height: 1.8; font-size: 16px">
          {{ previewTopic.passage }}
        </div>
      </div>
    </NModal>
  </div>
</template>
