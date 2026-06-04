import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@12.1.1?target=deno'

const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY')
const stripe = new Stripe(STRIPE_SECRET!, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { cartItems, userId, customerEmail, shippingCost, shippingMethodName } = await req.json()

    // FASE 2: Iniezione metadati strutturati per Gelato v4
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: customerEmail,
      shipping_address_collection: { 
        allowed_countries: ['IT', 'US', 'GB', 'FR', 'DE', 'ES', 'CH'] 
      },
      line_items: [
        ...cartItems.map((item: any) => ({
          price_data: {
            currency: 'eur',
            product_data: { 
              name: item.title, 
              description: item.variantTitle,
              images: item.img ? [item.img] : [] 
            },
            unit_amount: Math.round(parseFloat(item.price) * 100),
          },
          quantity: item.qty,
        })),
        // Aggiungiamo il costo della spedizione come riga separata
        ...(shippingCost ? [{
          price_data: {
            currency: 'eur',
            product_data: { 
              name: `Shipping: ${shippingMethodName}`,
              description: "Gelato Fulfillment Services"
            },
            unit_amount: Math.round(parseFloat(shippingCost) * 100),
          },
          quantity: 1,
        }] : [])
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/portal?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/shop`,
      metadata: {
        user_id: userId,
        gelato_data: JSON.stringify(cartItems.map((i: any) => ({
          pid: i.pid,
          vid: i.vid,
          productUid: i.productUid,
          fileUrl: i.fileUrl,
          qty: i.qty
        })))
      }
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
