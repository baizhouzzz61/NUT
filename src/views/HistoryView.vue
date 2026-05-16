<script setup>
import { ref, h } from 'vue'
import { useRouter } from 'vue-router'
import { useTopicStore } from '../stores/topic'
import {
  NButton, NDataTable, NModal, NTabs, NTabPane, NText, NH1,
  NSpace, NTag, NCard, useMessage
} from 'naive-ui'

const router = useRouter()
const store = useTopicStore()
const message = useMessage()

const showPreview = ref(false)
const previewTopic = ref(null)
const previewTab = ref('all')

function preview(topic) {
  previewTopic.value = topic
  previewTab.value = 'all'
  showPreview.value = true
}

const columns = [
  { title: 'Title', key: 'title', ellipsis: { tooltip: true } },
  { title: 'Examples', key: 'examples', width: 80,
    render(row) { return row.examples?.length || 0 }
  },
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

    <NModal v-model:show="showPreview" title="Topic Detail" style="width: 750px">
      <div v-if="previewTopic" style="padding: 8px; max-height: 70vh; overflow-y: auto">
        <h2 style="margin-bottom: 16px">{{ previewTopic.title }}</h2>

        <NTabs v-model:value="previewTab">
          <NTabPane name="all" tab="All Examples">
            <div v-for="(ex, i) in previewTopic.examples" :key="i" style="margin-bottom: 8px">
              <NCard :bordered="false" size="small"
                :style="ex.source !== 'ai'
                  ? 'background: #f0f9eb; border: 1px solid #b3e19d'
                  : 'background: var(--n-color); border: 1px solid var(--n-border-color)'">
                <NText>{{ i + 1 }}. {{ ex.text }}</NText>
                <NTag size="tiny" :type="ex.source !== 'ai' ? 'success' : 'default'" style="margin-left: 12px">
                  {{ ex.source !== 'ai' ? `From: ${ex.transcriptTitle}` : 'AI' }}
                </NTag>
              </NCard>
            </div>
          </NTabPane>
          <NTabPane name="source" tab="From Transcripts">
            <div v-for="(ex, i) in previewTopic.examples.filter(e => e.source !== 'ai')" :key="i" style="margin-bottom: 8px">
              <NCard :bordered="false" size="small" style="background: #f0f9eb; border: 1px solid #b3e19d">
                <NText>{{ i + 1 }}. {{ ex.text }}</NText>
                <NTag size="tiny" type="success" style="margin-left: 12px">
                  {{ ex.transcriptTitle }}
                </NTag>
              </NCard>
            </div>
            <NText v-if="!previewTopic.examples.filter(e => e.source !== 'ai').length" depth="3">
              No examples from transcripts.
            </NText>
          </NTabPane>
        </NTabs>
      </div>
    </NModal>
  </div>
</template>
