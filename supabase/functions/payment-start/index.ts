// Deliberately disabled until a licensed marketplace gateway is contracted.
// Never add a service-role key to VITE_* variables or browser code.
Deno.serve(() => new Response(JSON.stringify({ error: 'Gateway not configured. A merchant account, direct settlement and 3% split capability are required.' }), { status: 503, headers: { 'Content-Type': 'application/json' } }));
