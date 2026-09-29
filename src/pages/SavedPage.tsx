import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ListingCard } from '../components/ListingCard'
import { useListings } from '../context/ListingsContext'
import { useToast } from '../context/ToastContext'
import { useFlow } from '../context/FlowContext'

export function SavedPage() {
  const { listings, saved, toggleSaved } = useListings()
  const { user } = useFlow()
  const { show } = useToast()
  const savedListings = listings.filter((item) => saved.includes(item.id) && item.verificationStatus === 'approved')
  const removeSaved = async (id: number) => {
    try { await toggleSaved(id) } catch (cause) { show(cause instanceof Error ? cause.message : 'Could not update saved plots.') }
  }

  return <section className="container-xxl py-5">
    <h1 className="fw-bold mb-4">Saved plots</h1>
    {!user && <p><Link to="/account?next=%2Fsaved">Sign in</Link> to save plots across your devices.</p>}
    {savedListings.length === 0
      ? <div className="host-empty text-center text-secondary py-5">
        <Heart size={26} className="text-primary mb-2" />
        <p className="mb-3">Nothing saved yet — tap the heart on any listing to keep it here.</p>
        <Link className="btn btn-primary rounded-pill" to="/discover">Browse land →</Link>
      </div>
      : <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-4">
        {savedListings.map((listing, index) => <div className="col" key={listing.id}><ListingCard listing={listing} saved onSave={id => { void removeSaved(id) }} delay={index * 60} /></div>)}
      </div>}
  </section>
}
