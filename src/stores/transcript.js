import { defineStore } from 'pinia'
import { ref } from 'vue'
import { addTranscript, updateTranscript, deleteTranscript, getAllTranscripts } from '../db'

export const useTranscriptStore = defineStore('transcript', () => {
  const transcripts = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function loadTranscripts() {
    loading.value = true
    error.value = null
    try {
      transcripts.value = await getAllTranscripts()
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function saveTranscript(transcript, id) {
    error.value = null
    if (id) {
      await updateTranscript(id, transcript)
    } else {
      await addTranscript(transcript)
    }
    await loadTranscripts()
  }

  async function removeTranscript(id) {
    error.value = null
    await deleteTranscript(id)
    await loadTranscripts()
  }

  loadTranscripts()

  return { transcripts, loading, error, loadTranscripts, saveTranscript, removeTranscript }
})
