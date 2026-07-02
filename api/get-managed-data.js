import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { manager_id, managed_user_id } = req.body;
  if (!manager_id || !managed_user_id) return res.status(400).json({ error: 'Missing fields' });

  try {
    // Verify delegated access exists
    const { data: access } = await supabase
      .from('delegated_access')
      .select('can_view, can_edit')
      .eq('manager_id', manager_id)
      .eq('managed_user_id', managed_user_id)
      .single();

    if (!access?.can_view) return res.status(403).json({ error: 'No access' });

    // Fetch all planner store keys for managed user
    const { data: rows } = await supabase
      .from('planner_data')
      .select('store_key, value')
      .eq('user_id', managed_user_id);

    return res.status(200).json({ rows, can_edit: access.can_edit });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
