import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  try {
    const payload = await req.json()
    const { eventName, params } = payload

    console.log(`🔔 Received Gelato Event: ${eventName}`);

    // FASE 4: Gestione Tracking & Stati Spedizione
    if (eventName === 'order_status_updated') {
      await supabase
        .from('orders')
        .update({ status: params.status })
        .eq('gelato_order_id', params.orderId)
    }

    if (eventName === 'order_item_tracking_code_updated') {
      // Evento cruciale: il pacco è partito!
      await supabase
        .from('orders')
        .update({ 
          tracking_code: params.trackingCode,
          tracking_url: params.trackingUrl,
          status: 'shipped'
        })
        .eq('gelato_order_id', params.orderId)
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error("Gelato Webhook Error:", err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
