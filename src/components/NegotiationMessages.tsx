import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useFlow } from '../context/FlowContext'
import { supabase } from '../lib/supabase'

type Message = { id: number; sender_id: string; body: string; created_at: string }

export function NegotiationMessages({ negotiationId }: { negotiationId: number }) {
  const { user } = useFlow()
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const reload = useCallback(async () => {
    const { data, error: fetchError } = await supabase.from('negotiation_messages')
      .select('id,sender_id,body,created_at').eq('negotiation_id', negotiationId)
      .order('created_at', { ascending: true }).limit(200)
    if (fetchError) setError(fetchError.message)
    else { setMessages(data || []); setError('') }
  }, [negotiationId])

  useEffect(() => {
    void reload()
    const interval = window.setInterval(() => { void reload() }, 15000)
    return () => window.clearInterval(interval)
  }, [reload])

  async function send(event: FormEvent) {
    event.preventDefault()
    if (!user || !draft.trim()) return
    setSending(true); setError('')
    const { error: sendError } = await supabase.from('negotiation_messages')
      .insert({ negotiation_id: negotiationId, sender_id: user.id, body: draft.trim() })
    if (sendError) setError(sendError.message)
    else { setDraft(''); await reload() }
    setSending(false)
  }

  return <section className="card p-4 mt-3" aria-label="Private negotiation messages">
    <h2 className="h5">Private conversation</h2>
    <p className="small text-secondary">Messages are shared with the tenant and landowner. Use the proposal buttons above for formal decisions.</p>
    <div className="border rounded p-3 mb-3 overflow-auto" style={{ maxHeight: 320 }} aria-live="polite">
      {messages.length === 0 ? <p className="text-secondary mb-0">No messages yet.</p> : messages.map(item => <div key={item.id} className="mb-3">
        <strong>{item.sender_id === user?.id ? 'You' : 'Other party'}</strong>
        <small className="text-secondary ms-2">{new Date(item.created_at).toLocaleString()}</small>
        <p className="mb-0" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{item.body}</p>
      </div>)}
    </div>
    <form className="d-flex gap-2" onSubmit={event => void send(event)}>
      <input className="form-control" aria-label="Write a message" maxLength={2000} value={draft} onChange={event => setDraft(event.target.value)} placeholder="Write a message…" />
      <button className="btn btn-primary" type="submit" disabled={sending || !draft.trim()}>Send</button>
    </form>
    {error && <p className="text-danger mt-2 mb-0" role="alert">{error}</p>}
  </section>
}
