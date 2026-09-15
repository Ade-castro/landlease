import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ListingCard } from '../components/ListingCard'
import { useListings } from '../context/ListingsContext'

export function SavedPage() {
  const { listings, saved, toggleSaved } = useListings()
  const savedListings = listings.filter((item) => saved.includes(item.id))

  return <section className="container-xxl py-5">
    <h1 className="fw-bold mb-4">Saved plots</h1>
    {savedListings.length === 0
      ? <div className="host-empty text-center text-secondary py-5">
        <Heart size={26} className="text-primary mb-2" />
        <p className="mb-3">Nothing saved yet — tap the heart on any listing to keep it here.</p>
        <Link className="btn btn-primary rounded-pill" to="/discover">Browse land →</Link>
      </div>
      : <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-4">
        {savedListings.map((listing, index) => <div className="col" key={listing.id}><ListingCard listing={listing} saved onSave={toggleSaved} delay={index * 60} /></div>)}
      </div>}
  </section>
}
