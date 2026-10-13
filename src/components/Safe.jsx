import { Component } from 'react'

// Bir bölümde hata olursa sadece o bölüm gizlenir, sitenin geri kalanı çalışmaya devam eder.
// Hata Vercel kayıtlarına düşer.
export default class Safe extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(err) {
    // zarf ekranı kilitliyken çökerse sayfa kaydırılamaz kalmasın
    document.documentElement.classList.remove('locked')
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: `crash:${this.props.name || 'bolum'}`, message: err?.message || String(err), file: window.location.pathname }),
    }).catch(() => {})
    this.props.onError?.()
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null
    return this.props.children
  }
}
