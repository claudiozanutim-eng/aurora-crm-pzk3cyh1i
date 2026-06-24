import { useSyncExternalStore } from 'react'

interface DashboardState {
  vendedorId: string
  periodo: string
}

let state: DashboardState = {
  vendedorId: 'todos',
  periodo: 'este_mes',
}

let listeners: Array<() => void> = []

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

export const dashboardStore = {
  setVendedorId: (vendedorId: string) => {
    state = { ...state, vendedorId }
    emitChange()
  },
  setPeriodo: (periodo: string) => {
    state = { ...state, periodo }
    emitChange()
  },
  subscribe: (listener: () => void) => {
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  },
  getSnapshot: () => state,
}

export default function useDashboardStore() {
  const storeState = useSyncExternalStore(dashboardStore.subscribe, dashboardStore.getSnapshot)
  return {
    ...storeState,
    setVendedorId: dashboardStore.setVendedorId,
    setPeriodo: dashboardStore.setPeriodo,
  }
}
