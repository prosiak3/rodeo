import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

/**
 * Scheduled Edge Function to refresh auto-order suggestions for all active stores
 * Should be triggered daily at 5:00 AM via cron or external scheduler
 * Can also be triggered manually by admin users
 */

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authorization (allow only service role or admin users)
    const authHeader = req.headers.get('Authorization');
    
    // Check if this is a scheduled trigger (no auth header) or manual trigger
    let isScheduled = false;
    let triggeredByUserId = null;
    
    if (!authHeader) {
      // Scheduled trigger - verify it's coming from a trusted source
      // In production, you'd check a secret token or cron job signature
      isScheduled = true;
    } else {
      // Manual trigger - verify admin user
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      
      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user is admin
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (!userData || userData.role !== 'admin') {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      triggeredByUserId = user.id;
    }

    // Get all active stores with auto-suggestions enabled
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name, code')
      .eq('active', true)
      .eq('auto_suggestions_enabled', true);

    if (storesError) {
      console.error('Error fetching stores:', storesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch stores', details: storesError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!stores || stores.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active stores with auto-suggestions enabled', stores_processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Process each store
    for (const store of stores) {
      const startTime = Date.now();
      
      try {
        const { data: suggestionData, error: genError } = await supabase.rpc(
          'generate_auto_order_suggestion',
          { p_store_id: store.id }
        );

        const executionTime = Date.now() - startTime;

        if (genError) {
          console.error(`Failed to generate suggestion for store ${store.code}:`, genError);
          
          await supabase.from('auto_order_logs').insert({
            store_id: store.id,
            triggered_by: triggeredByUserId,
            manually_triggered: !isScheduled,
            success: false,
            execution_time_ms: executionTime,
            error_message: genError.message,
            products_count: 0,
          });

          failureCount++;
          results.push({
            store_id: store.id,
            store_code: store.code,
            success: false,
            error: genError.message,
          });
          continue;
        }

        // Handle insufficient data case (not an error)
        if (suggestionData.error === 'insufficient_data') {
          await supabase.from('auto_order_logs').insert({
            store_id: store.id,
            triggered_by: triggeredByUserId,
            manually_triggered: !isScheduled,
            success: true,
            execution_time_ms: executionTime,
            products_count: 0,
          });

          results.push({
            store_id: store.id,
            store_code: store.code,
            success: true,
            products_count: 0,
            message: 'Insufficient data',
          });
          successCount++;
          continue;
        }

        const productsCount = suggestionData.products?.length || 0;

        // Calculate confidence score
        let confidenceScore = 0;
        if (productsCount > 0) {
          const avgConfidence = suggestionData.products.reduce((sum: number, p: any) => sum + p.confidence, 0) / productsCount;
          confidenceScore = Math.round(avgConfidence * 100) / 100;
        }

        // Save to cache
        const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        await supabase
          .from('auto_order_suggestions')
          .upsert({
            store_id: store.id,
            suggestion_data: suggestionData,
            confidence_score: confidenceScore,
            based_on_orders_count: suggestionData.metadata?.based_on_orders_count || 0,
            generation_time_ms: executionTime,
            generated_at: new Date().toISOString(),
            valid_until: validUntil.toISOString(),
            manually_triggered: !isScheduled,
          }, {
            onConflict: 'store_id'
          });

        // Log success
        await supabase.from('auto_order_logs').insert({
          store_id: store.id,
          triggered_by: triggeredByUserId,
          manually_triggered: !isScheduled,
          success: true,
          execution_time_ms: executionTime,
          products_count: productsCount,
        });

        // Update store's last suggestion timestamp
        await supabase
          .from('stores')
          .update({ last_auto_suggestion_at: new Date().toISOString() })
          .eq('id', store.id);

        successCount++;
        results.push({
          store_id: store.id,
          store_code: store.code,
          success: true,
          products_count: productsCount,
          execution_time_ms: executionTime,
        });

      } catch (error) {
        console.error(`Unexpected error processing store ${store.code}:`, error);
        failureCount++;
        results.push({
          store_id: store.id,
          store_code: store.code,
          success: false,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Refresh completed',
        total_stores: stores.length,
        success_count: successCount,
        failure_count: failureCount,
        scheduled: isScheduled,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in scheduler:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});