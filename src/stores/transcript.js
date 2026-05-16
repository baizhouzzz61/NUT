import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { addTranscript, updateTranscript, deleteTranscript, getAllTranscripts } from '../db'

export const useTranscriptStore = defineStore('transcript', () => {
  const transcripts = ref([])
  const loading = ref(false)

  const sortedTranscripts = computed(() =>
    [...transcripts.value].sort((a, b) => b.createdAt - a.createdAt)
  )

  async function loadTranscripts() {
    loading.value = true
    transcripts.value = await getAllTranscripts()
    loading.value = false
  }

  async function saveTranscript(transcript, id) {
    if (id) {
      await updateTranscript(id, transcript)
    } else {
      await addTranscript(transcript)
    }
    await loadTranscripts()
  }

  async function removeTranscript(id) {
    await deleteTranscript(id)
    await loadTranscripts()
  }

  loadTranscripts()

  return { transcripts, loading, sortedTranscripts, loadTranscripts, saveTranscript, removeTranscript }
})
