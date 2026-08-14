import { afterEach } from 'vitest'

afterEach(() => {
  document.documentElement.removeAttribute('data-theme')
  localStorage.clear()
})
