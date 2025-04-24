import './app.css'
import App from './App.svelte'

let app;

try {
  app = new App({
    target: document.getElementById('app') || document.body
  })
} catch (error) {
  console.error('Failed to initialize app:', error)
}

export default app