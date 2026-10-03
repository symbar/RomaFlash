import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Find articles with title containing "Lobont"
    const { data: articles } = await supabase.from('articles').select('id, title').ilike('title', '%Lobont%').order('published_at', { ascending: false });
    
    if (articles && articles.length > 1) {
      // Delete the older one or the specific one
      const toDelete = articles[1];
      await supabase.from('articles').delete().eq('id', toDelete.id);
      return new Response(JSON.stringify({ success: true, deleted: toDelete.title }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, message: "No duplicates found" }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
