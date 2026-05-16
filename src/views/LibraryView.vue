<script setup>
import { ref, h } from 'vue'
import { useRouter } from 'vue-router'
import { useTranscriptStore } from '../stores/transcript'
import { transcribeAudio } from '../api'
import {
  NButton, NDataTable, NModal, NInput, NUpload, NSpin, NSpace,
  NPopconfirm, NTag, NText, NH1, NIcon, useMessage
} from 'naive-ui'

const router = useRouter()
const store = useTranscriptStore()
const message = useMessage()

const showModal = ref(false)
const editMode = ref(false)
const editingId = ref(null)
const transcribing = ref(false)

const form = ref({ title: '', content: '', source: 'manual' })

function openNew() {
  editMode.value = false
  editingId.value = null
  form.value = { title: '', content: '', source: 'manual' }
  showModal.value = true
}

function openEdit(row) {
  editMode.value = true
  editingId.value = row.id
  form.value = { title: row.title, content: row.content, source: row.source }
  showModal.value = true
}

async function saveTranscript() {
  if (!form.value.title.trim() || !form.value.content.trim()) {
    message.warning('Title and content are required')
    return
  }
  await store.saveTranscript({ ...form.value }, editingId.value)
  showModal.value = false
  message.success(editMode.value ? 'Updated' : 'Saved')
}

async function handleUpload({ file }) {
  transcribing.value = true
  try {
    const { transcript } = await transcribeAudio(file.file)
    form.value.content = transcript
    form.value.source = 'audio'
    message.success('Transcription complete')
  } catch (e) {
    message.error(e.message)
  } finally {
    transcribing.value = false
  }
}

async function removeTranscript(id) {
  await store.removeTranscript(id)
  message.success('Deleted')
}

const columns = [
  { title: 'Title', key: 'title', ellipsis: { tooltip: true } },
  { title: 'Source', key: 'source', width: 100,
    render(row) {
      return h(NTag, { type: row.source === 'audio' ? 'info' : 'default', size: 'small' },
        { default: () => row.source === 'audio' ? 'Audio' : 'Manual' })
    }
  },
  { title: 'Created', key: 'createdAt', width: 180,
    render(row) { return new Date(row.createdAt).toLocaleString() }
  },
  {
    title: 'Actions', key: 'actions', width: 210,
    render(row) {
      return h(NSpace, null, {
        default: () => [
          h(NButton, { size: 'small', onClick: () => openEdit(row) }, { default: () => 'Edit' }),
          h(NPopconfirm, { onPositiveClick: () => removeTranscript(row.id) }, {
            trigger: () => h(NButton, { size: 'small', type: 'error', secondary: true }, { default: () => 'Delete' }),
            default: () => 'Delete this transcript?'
          })
        ]
      })
    }
  },
]
</script>

<template>
  <div style="max-width: 900px; margin: 40px auto; padding: 0 20px">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
      <NH1>Transcript Library</NH1>
      <NSpace>
        <NButton @click="router.push('/generate')" secondary>Topic Generator</NButton>
        <NButton @click="router.push('/history')" tertiary>History</NButton>
        <NButton type="primary" @click="openNew">+ New Transcript</NButton>
      </NSpace>
    </div>

    <NDataTable :columns="columns" :data="store.sortedTranscripts" :bordered="false" />
    <NText v-if="!store.transcripts.length" depth="3" style="display: block; text-align: center; margin-top: 60px">
      No transcripts yet. Click "New Transcript" to start.
    </NText>

    <NModal v-model:show="showModal" :title="editMode ? 'Edit Transcript' : 'New Transcript'" style="width: 700px">
      <div style="padding: 20px">
        <NInput v-model:value="form.title" placeholder="Title" style="margin-bottom: 16px" />

        <NUpload :show-file-list="false" accept=".mp3,.wav,.m4a,.flac" @change="handleUpload" style="margin-bottom: 16px">
          <NButton :loading="transcribing" secondary>Upload Audio & Transcribe</NButton>
        </NUpload>

        <NSpin :show="transcribing" description="Transcribing...">
          <NInput
            v-model:value="form.content"
            type="textarea"
            placeholder="Enter English text, or upload audio above"
            :autosize="{ minRows: 8, maxRows: 20 }"
          />
        </NSpin>
      </div>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="showModal = false">Cancel</NButton>
          <NButton type="primary" @click="saveTranscript" :disabled="transcribing">Save</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>
