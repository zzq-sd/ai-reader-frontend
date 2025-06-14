import { createApp, ref } from 'vue'
import Toast from '@/components/common/Toast.vue'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  showClose?: boolean
}

interface ToastInstance {
  id: string
  app: any
  container: HTMLElement
}

const toasts = ref<ToastInstance[]>([])

let toastId = 0

export const useToast = () => {
  const showToast = (options: ToastProps) => {
    const id = `toast-${++toastId}`
    const container = document.createElement('div')
    container.id = id
    
    const app = createApp(Toast, {
      ...options,
      onClose: () => {
        removeToast(id)
      }
    })
    
    app.mount(container)
    
    const instance: ToastInstance = {
      id,
      app,
      container
    }
    
    toasts.value.push(instance)
    
    return id
  }
  
  const removeToast = (id: string) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index > -1) {
      const toast = toasts.value[index]
      toast.app.unmount()
      if (toast.container.parentNode) {
        toast.container.parentNode.removeChild(toast.container)
      }
      toasts.value.splice(index, 1)
    }
  }
  
  const success = (message: string, duration?: number) => {
    return showToast({ message, type: 'success', duration })
  }
  
  const error = (message: string, duration?: number) => {
    return showToast({ message, type: 'error', duration })
  }
  
  const warning = (message: string, duration?: number) => {
    return showToast({ message, type: 'warning', duration })
  }
  
  const info = (message: string, duration?: number) => {
    return showToast({ message, type: 'info', duration })
  }
  
  const clear = () => {
    toasts.value.forEach(toast => {
      removeToast(toast.id)
    })
  }
  
  return {
    showToast,
    success,
    error,
    warning,
    info,
    clear,
    removeToast
  }
} 