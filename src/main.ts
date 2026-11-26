import { mount } from 'svelte'
import App from './App.svelte'
import { catalog, site } from './lib/content/load'
import { guestbookConfig } from './lib/guestbook/config'
import { safeStorage } from './lib/state/persist'
import { supabaseRpc, VisitorCounter } from './lib/visitors/visitors.svelte'

const storage = safeStorage()
const visitors = new VisitorCounter(guestbookConfig ? supabaseRpc(guestbookConfig) : null, storage)

const app = mount(App, {
  target: document.getElementById('app')!,
  props: { catalog, storage, site, visitors },
})

export default app
