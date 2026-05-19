import { useState } from 'react'

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
}

interface DialogState extends ConfirmOptions {
  resolve: (value: boolean) => void
}

export function useConfirm() {
  const [state, setState] = useState<DialogState | null>(null)

  function confirm(opts: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => setState({ ...opts, resolve }))
  }

  function handleConfirm() {
    state?.resolve(true)
    setState(null)
  }

  function handleCancel() {
    state?.resolve(false)
    setState(null)
  }

  const dialog = state ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleCancel} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-2">{state.title}</h2>
        <p className="text-sm text-gray-600 mb-6">{state.message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 cursor-pointer"
          >
            {state.confirmLabel ?? 'Delete'}
          </button>
        </div>
      </div>
    </div>
  ) : null

  return { confirm, dialog }
}
