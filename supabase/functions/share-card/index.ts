// Supabase Edge Function: share-card
// Serves OG meta tags for species farewell card share links.
// When a social platform crawls the link, it receives HTML with
// og:image pointing to the share-cards storage bucket.
//
// GET /functions/v1/share-card?species=<speciesId>

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

serve(async (req) => {
  const url = new URL(req.url);
  const speciesId = url.searchParams.get('species');

  if (!speciesId) {
    return new Response('Missing species parameter', { status: 400 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const imageUrl = `${supabaseUrl}/storage/v1/object/public/share-cards/${speciesId}.png`;
  const appUrl = Deno.env.get('APP_URL') ?? supabaseUrl;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta property="og:title" content="Life Game - Species Farewell" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:url" content="${appUrl}/species/${speciesId}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta http-equiv="refresh" content="0;url=${appUrl}/species/${speciesId}" />
</head>
<body>Redirecting...</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
});
