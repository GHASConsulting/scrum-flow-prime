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
    console.log('Update user email function called');
    
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      throw new Error('Não autenticado');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError) {
      console.error('Auth error:', authError);
      throw new Error('Não autenticado');
    }
    
    if (!user) {
      console.error('No user found');
      throw new Error('Não autenticado');
    }

    console.log('User authenticated:', user.id);

    // Verificar se é administrador
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    console.log('Role check:', { roleData, roleError });

    if (roleError || roleData?.role !== 'administrador') {
      console.error('Permission denied:', { roleData, roleError });
      throw new Error('Sem permissão');
    }

    const { userId, newEmail, newPassword } = await req.json();
    const normalizedEmail = newEmail ? String(newEmail).trim().toLowerCase() : undefined;
    console.log('Update request:', { userId, hasEmail: !!normalizedEmail, hasPassword: !!newPassword });

    // Preparar dados para atualização
    const updateData: any = {};
    
    if (normalizedEmail) {
      updateData.email = normalizedEmail;
      updateData.email_confirm = true; // Confirmar email automaticamente
      console.log('Email will be updated and auto-confirmed');
    }
    
    if (newPassword) {
      updateData.password = newPassword;
      console.log('Password will be updated');
    }

    // Atualizar no auth
    console.log('Updating user in auth:', { userId, updateData });
    const { data: authUpdateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      updateData
    );

    if (updateError) {
      console.error('Error updating user in auth:', updateError);
      throw updateError;
    }
    
    console.log('User updated successfully in auth:', authUpdateData);

    // Atualizar email na tabela profiles se foi alterado
    if (normalizedEmail) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ email: normalizedEmail })
        .eq('user_id', userId);

      if (profileError) throw profileError;
    }

    // Confirmar email atualizado obtendo o usuário
    const { data: updatedUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (getUserError) {
      console.error('Error fetching updated user:', getUserError);
    } else {
      console.log('Updated user email:', updatedUser?.user?.email);
    }

    return new Response(
      JSON.stringify({ success: true, email: updatedUser?.user?.email ?? normalizedEmail ?? null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});