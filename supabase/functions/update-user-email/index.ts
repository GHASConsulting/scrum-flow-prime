import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Não autenticado');
    }

    // Verificar se é administrador
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || roleData?.role !== 'administrador') {
      throw new Error('Sem permissão');
    }

    const { userId, newEmail, newPassword } = await req.json();

    // Preparar dados para atualização
    const updateData: any = {};
    
    if (newEmail) {
      updateData.email = newEmail;
      updateData.email_confirm = true; // Confirmar email automaticamente
    }
    
    if (newPassword) {
      updateData.password = newPassword;
    }

    // Atualizar no auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      updateData
    );

    if (updateError) throw updateError;

    // Atualizar email na tabela profiles se foi alterado
    if (newEmail) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ email: newEmail })
        .eq('user_id', userId);

      if (profileError) throw profileError;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});