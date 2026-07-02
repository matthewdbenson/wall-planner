import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { manager_id, managed_user_id, store_key, value } = req.body;
  if (!manager_id || !managed_user_id || !store_key || value === undefined)
    return res.status(400).json({ error: 'Missing fields' });

  try {
    // Verify edit access
    const { data: access } = await supabase
      .from('delegated_access')
      .select('can_edit')
      .eq('manager_id', manager_id)
      .eq('managed_user_id', managed_user_id)
      .single();

    if (!access?.can_edit) return res.status(403).json({ error: 'No edit access' });

    await supabase.from('planner_data').upsert({
      user_id: managed_user_id,
      store_key,
      value,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,store_key' });

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
