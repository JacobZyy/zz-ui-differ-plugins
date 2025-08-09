import { create } from 'zustand'

interface DocumentWidthStore {
  documentWidth: number
  rootFontSize: number
  setDocumentWidth: (width: number) => void
  setRootFontSize: (size: number) => void
}

const useDocumentWidth = create<DocumentWidthStore>(set => ({
  documentWidth: 0,
  rootFontSize: 0,
  setDocumentWidth: (width: number) => set({ documentWidth: width }),
  setRootFontSize: (size: number) => set({ rootFontSize: size }),
}))

export default useDocumentWidth
