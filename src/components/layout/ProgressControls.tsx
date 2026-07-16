import { useRef } from 'react'
import { useProgress } from '../../lib/ProgressContext'
import { exportProgressToFile, importProgressFromJSON, saveProgress } from '../../lib/progressStore'

export function ProgressControls() {
  const { progress, resetProgress } = useProgress()
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleExport() {
    exportProgressToFile(progress)
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = String(reader.result)
        const restored = importProgressFromJSON(text)
        saveProgress(restored)
        window.location.reload()
      } catch {
        alert('קובץ הגיבוי אינו תקין')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleReset() {
    if (confirm('לאפס את כל ההתקדמות? לא ניתן לשחזר פעולה זו ללא גיבוי קיים.')) {
      resetProgress()
    }
  }

  return (
    <div className="flex flex-col gap-1 text-xs">
      <button onClick={handleExport} className="rounded border border-[var(--color-border)] px-2 py-1 hover:border-[var(--color-accent)]">
        גיבוי התקדמות
      </button>
      <button onClick={handleImportClick} className="rounded border border-[var(--color-border)] px-2 py-1 hover:border-[var(--color-accent)]">
        שחזור מגיבוי
      </button>
      <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFileChange} />
      <button onClick={handleReset} className="rounded border border-[var(--color-danger)] px-2 py-1 text-[var(--color-danger)]">
        איפוס התקדמות
      </button>
    </div>
  )
}
