import { mount } from 'svelte'
import App from './App.svelte'
import { catalog, site } from './lib/content/load'
import { safeStorage } from './lib/state/persist'

const app = mount(App, {
  target: document.getElementById('app')!,
  props: { catalog, storage: safeStorage(), site },
})

export default app
