import { useReveal } from '../hooks'

export default function Section({ id, className = '', children }) {
  const ref = useReveal()
  return (
    <section id={id} ref={ref} className={`section reveal ${className}`}>
      {children}
    </section>
  )
}
