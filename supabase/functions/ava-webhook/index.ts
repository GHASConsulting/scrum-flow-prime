import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Validar token de autenticação
    const authHeader = req.headers.get('X-BotConversa-Token')
    if (!authHeader) {
      console.error('Missing X-BotConversa-Token header')
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar configuração do webhook
    const { data: config, error: configError } = await supabase
      .from('integracao_config')
      .select('webhook_token')
      .single()

    if (configError || !config) {
      console.error('Config not found:', configError)
      return new Response(
        JSON.stringify({ error: 'Configuration not found' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validar token
    if (authHeader !== config.webhook_token) {
      console.error('Invalid token')
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse do body
    const body = await req.json()
    const { nm_cliente, dt_registro, ds_tipo, ds_descricao, ie_status: rawStatus } = body

    // Validar campos obrigatórios
    if (!nm_cliente || !dt_registro || !ds_tipo || !rawStatus) {
      console.error('Missing required fields:', body)
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          required: ['nm_cliente', 'dt_registro', 'ds_tipo', 'ie_status']
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mapear ie_status para valores válidos
    const statusMap: Record<string, string> = {
      '1': 'success',
      '0': 'error',
      '2': 'pending',
      '3': 'info',
      'success': 'success',
      'error': 'error',
      'pending': 'pending',
      'info': 'info',
      'other': 'other'
    }
    
    const ie_status = statusMap[String(rawStatus).toLowerCase()] || 'other'

    // Converter dt_registro para timestamptz
    let parsedDate: Date
    try {
      // Tentar ISO primeiro
      parsedDate = new Date(dt_registro)
      
      // Se não for ISO, tentar formato dd/MM/yyyy HH:mm
      if (isNaN(parsedDate.getTime())) {
        const [datePart, timePart] = dt_registro.split(' ')
        const [day, month, year] = datePart.split('/')
        const [hour, minute] = (timePart || '00:00').split(':')
        parsedDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hour),
          parseInt(minute)
        )
      }
    } catch (e) {
      console.error('Invalid date format:', dt_registro, e)
      return new Response(
        JSON.stringify({ error: 'Invalid date format. Use ISO or dd/MM/yyyy HH:mm' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar chave de idempotência (hash dos campos)
    const dedupeString = `${nm_cliente}|${parsedDate.toISOString()}|${ds_tipo}|${ie_status}|${(ds_descricao || '').substring(0, 100)}`
    const encoder = new TextEncoder()
    const data = encoder.encode(dedupeString)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const dedupe_key = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Inserir evento (ignorar se já existe)
    const { error: insertError } = await supabase
      .from('ava_evento')
      .insert({
        nm_cliente,
        dt_registro: parsedDate.toISOString(),
        ds_tipo,
        ds_descricao: ds_descricao || null,
        ie_status,
        dedupe_key
      })

    if (insertError) {
      // Se for erro de duplicação, retornar sucesso mesmo assim
      if (insertError.code === '23505') {
        console.log('Duplicate event ignored:', dedupe_key)
        return new Response(
          JSON.stringify({ message: 'Event already processed', dedupe_key }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      console.error('Insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to insert event', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Event inserted successfully:', dedupe_key)
    return new Response(
      JSON.stringify({ message: 'Event processed successfully', dedupe_key }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
