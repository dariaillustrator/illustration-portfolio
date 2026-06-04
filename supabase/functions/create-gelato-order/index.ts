import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@12.1.1?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GELATO_KEY = Deno.env.get('GELATO_API_KEY')
const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY')
const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')

const stripe = new Stripe(STRIPE_SECRET!, { apiVersion: '2022-11-15', httpClient: Stripe.createFetchHttpClient() })
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  
  try {
    const body = await req.text()
    const event = await stripe.webhooks.constructEventAsync(body, signature!, WEBHOOK_SECRET!)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.metadata.user_id
      const gelatoItems = JSON.parse(session.metadata.gelato_data)
      
      const shipping = session.shipping_details
      const address = shipping?.address

      // FASE 3: Sottomissione Ordine Gelato v4 (Produzione Diretta)
      const gelatoPayload = {
        orderType: "order", 
        orderReferenceId: session.id,
        customerReferenceId: userId,
        currencyIsoCode: "EUR",
        items: gelatoItems.map((item: any, idx: number) => ({
          itemReferenceId: `ITEM-${idx}-${Date.now()}`,
          productUid: item.productUid,
          quantity: item.qty,
          files: [{ type: "default", url: item.fileUrl }]
        })),
        shippingAddress: {
          firstName: shipping?.name?.split(' ')[0] || "Customer",
          lastName: shipping?.name?.split(' ').slice(1).join(' ') || "Name",
          addressLine1: address?.line1,
          city: address?.city,
          postCode: address?.postal_code,
          countryIsoCode: address?.country || "IT",
          email: session.customer_details?.email,
          phone: session.customer_details?.phone || "0000000000"
        }
      }

      console.log("📤 Submitting order to Gelato v4...");
      const gResp = await fetch("https://order.gelatoapis.com/v4/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-KEY": GELATO_KEY! },
        body: JSON.stringify(gelatoPayload)
      })
      
      const gResult = await gResp.json()
      console.log("🚀 Gelato Result:", JSON.stringify(gResult))

      // Salvataggio nel database per sincronizzazione tracking (Fase 4)
      const { error: orderError } = await supabase.from('orders').insert({
        user_id: userId,
        gelato_order_id: gResult.id || gResult.orderId,
        status: 'production',
        total_amount: session.amount_total / 100,
        stripe_payment_intent_id: session.payment_intent,
        items: gelatoItems
      })

      if (orderError) console.error("Database Save Error:", orderError)
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err) {
    console.error("Webhook Error:", err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 400 })
  }
})
