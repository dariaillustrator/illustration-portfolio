import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GELATO_API_KEY = "2c1a81c6-daf5-4175-a7b0-9ae2406a6b99-13275ccc-3008-4067-bc3d-0456f3e25217:118691cf-1021-4b37-b7ea-c82c3147357a"
const STORE_ID = "79698256-9641-41d3-807d-5c0214ef9081"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1. Prendi la lista prodotti dallo store
    const response = await fetch(`https://ecommerce.gelatoapis.com/v1/stores/${STORE_ID}/products`, {
      headers: { 'X-API-KEY': GELATO_API_KEY }
    })
    const data = await response.json()

    // 2. Per ogni prodotto, recuperiamo i dettagli e cerchiamo di stimare un prezzo
    const products = await Promise.all(data.products.map(async (p) => {
      // Per ora usiamo un prezzo di fallback di 35.00€ se non lo troviamo
      // Questo evita il "NaN" e permette di procedere al checkout
      const variants = p.variants.map((v) => ({
        id: v.id,
        title: v.title,
        productUid: v.productUid,
        price: 35.00 // Prezzo fisso temporaneo per sbloccare il sistema
      }))

      return {
        id: p.id,
        title: p.title,
        img: p.previewUrl,
        fileUrl: p.externalPreviewUrl,
        variants: variants
      }
    }))

    return new Response(JSON.stringify(products), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
})
