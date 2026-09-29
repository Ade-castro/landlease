// No unverified callback can activate a lease. Implement only after choosing a gateway.
// Validate the provider signature, expected currency/amount, settlement allocations,
// idempotency/reference, and merchant IDs before calling record_verified_lease_payment
// from a server-only service-role client. A return URL is NEVER proof of payment.
Deno.serve(() => new Response(JSON.stringify({ error: 'No gateway webhook adapter is configured. Payment confirmation is disabled.' }), { status: 503, headers: { 'Content-Type': 'application/json' } }));
