// Tombstone for existing deployments: never execute the retired mail worker.
Deno.serve(() => new Response(null, { status:410, headers:{'Cache-Control':'no-store'} }));
