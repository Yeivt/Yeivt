Deno.serve(() => new Response(null, { status:410, headers:{'Cache-Control':'no-store'} }));
