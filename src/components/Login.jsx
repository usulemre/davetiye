import { useEffect, useRef, useState } from 'react'
import { login } from '../admin'

export default function Login({ onSuccess, onClose }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const first = useRef(null)

  useEffect(() => {
    first.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      onSuccess(await login(username.trim(), password))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login" onClick={onClose}>
      <form className="login__card" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <button type="button" className="login__close" onClick={onClose} aria-label="Kapat">×</button>
        <span className="login__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" d="M7 11V8a5 5 0 0 1 10 0v3M5.5 11h13a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1ZM12 15v2.5"/></svg>
        </span>
        <h2>Yönetici girişi</h2>
        <p>Davetiyeyi düzenlemek ve paylaşımları yönetmek için giriş yapın.</p>
        <label className="afield">
          <span>Kullanıcı adı</span>
          <input ref={first} value={username} autoComplete="username" autoCapitalize="none" autoCorrect="off"
            onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label className="afield">
          <span>Şifre</span>
          <div className="login__pass">
            <input type={show ? 'text' : 'password'} value={password} autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShow((s) => !s)}>{show ? 'Gizle' : 'Göster'}</button>
          </div>
        </label>
        {error && <p className="login__error" role="alert">{error}</p>}
        <button type="submit" className="abtn abtn--block" disabled={busy || !username || !password}>
          {busy ? 'Giriş yapılıyor…' : 'Giriş yap'}
        </button>
      </form>
    </div>
  )
}
