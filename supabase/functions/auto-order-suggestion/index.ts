import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RateLimitRecord {
  count: number;
  first_attempt: string;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Rate limiting: 3 requests per hour per store
function checkRateLimit(storeId: string): { allowed: boolean; remainingTime?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(storeId);
  
  if (!record) {
    rateLimitStore.set(storeId, { count: 1, first_attempt: new Date().toISOString() });
    return { allowed: true };
  }
  
  const firstAttemptTime = new Date(record.first_attempt).getTime();
  const hourInMs = 60 * 60 * 1000;
  const timeSinceFirst = now - firstAttemptTime;
  
  if (timeSinceFirst > hourInMs) {
    // Reset counter after 1 hour
    rateLimitStore.set(storeId, { count: 1, first_attempt: new Date().toISOString() });
    return { allowed: true };
  }
  
  if (record.count >= 3) {
    const remainingTime = Math.ceil((hourInMs - timeSinceFirst) / 60000); // minutes
    return { allowed: false, remainingTime };
  }
  
  record.count++;
  return { allowed: true };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth token from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(p => p);
    const storeId = pathParts[pathParts.length - 1];
    const isRefresh = req.method === 'POST';

    if (!storeId) {
      return new Response(
        JSON.stringify({ error: 'Store ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user info to verify permissions and preferences
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('role, store_id, auto_order_analysis_days')
      .eq('id', user.id)
      .maybeSingle();

    if (userDataError || !userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check permissions
    const isAdmin = userData.role === 'admin';
    const isOperator = userData.role === 'operator';
    const isOwnStore = userData.store_id === storeId;
    
    if (!isAdmin && !isOperator && !isOwnStore) {
      return new Response(
        JSON.stringify({ error: 'Access denied to this store' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle GET request - return cached suggestion if valid and matches user preferences
    if (req.method === 'GET') {
      const { data: cachedSuggestion, error: cacheError } = await supabase
        .from('auto_order_suggestions')
        .select('*')
        .eq('store_id', storeId)
        .gt('valid_until', new Date().toISOString())
        .maybeSingle();

      if (cacheError) {
        console.error('Cache fetch error:', cacheError);
      }

      if (cachedSuggestion) {
        const cachedAnalysisDays = cachedSuggestion.suggestion_data?.metadata?.analysis_period_days;
        const userPreferredDays = userData.auto_order_analysis_days || 180;

        if (cachedAnalysisDays === userPreferredDays) {
          return new Response(
            JSON.stringify({
              ...cachedSuggestion.suggestion_data,
              cached: true,
              cache_generated_at: cachedSuggestion.generated_at,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Cache invalidated: user prefers ${userPreferredDays} days but cache has ${cachedAnalysisDays} days`);
      }

      // No cache or preferences changed - generate on demand
      // Fall through to generation logic
    }

    // Handle POST request - manual refresh with rate limiting
    if (isRefresh) {
      const rateCheck = checkRateLimit(storeId);
      if (!rateCheck.allowed) {
        return new Response(
          JSON.stringify({
            error: 'rate_limit_exceeded',
            message: `Osiągnięto limit odświeżeń. Spróbuj ponownie za ${rateCheck.remainingTime} minut`,
            remaining_time_minutes: rateCheck.remainingTime,
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Generate new suggestion with user's preferred analysis period
    const startTime = Date.now();
    const analysisDays = userData.auto_order_analysis_days || 180;

    const { data: suggestionData, error: genError } = await supabase.rpc(
      'generate_auto_order_suggestion',
      { p_store_id: storeId, p_analysis_days: analysisDays }
    );

    const executionTime = Date.now() - startTime;

    if (genError) {
      // Log error
      await supabase.from('auto_order_logs').insert({
        store_id: storeId,
        triggered_by: user.id,
        manually_triggered: isRefresh,
        success: false,
        execution_time_ms: executionTime,
        error_message: genError.message,
        products_count: 0,
      });

      return new Response(
        JSON.stringify({ error: 'Failed to generate suggestion', details: genError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for insufficient data
    if (suggestionData.error === 'insufficient_data') {
      return new Response(
        JSON.stringify(suggestionData),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
        store_id: storeId,
        suggestion_data: suggestionData,
        confidence_score: confidenceScore,
        based_on_orders_count: suggestionData.metadata?.based_on_orders_count || 0,
        generation_time_ms: executionTime,
        generated_at: new Date().toISOString(),
        valid_until: validUntil.toISOString(),
        manually_triggered: isRefresh,
      }, {
        onConflict: 'store_id'
      });

    // Log success
    await supabase.from('auto_order_logs').insert({
      store_id: storeId,
      triggered_by: user.id,
      manually_triggered: isRefresh,
      success: true,
      execution_time_ms: executionTime,
      products_count: productsCount,
    });

    // Update store's last suggestion timestamp
    await supabase
      .from('stores')
      .update({ last_auto_suggestion_at: new Date().toISOString() })
      .eq('id', storeId);

    return new Response(
      JSON.stringify({
        ...suggestionData,
        cached: false,
        generation_time_ms: executionTime,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});