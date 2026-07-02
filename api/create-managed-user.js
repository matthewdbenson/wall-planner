import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { display_name, email, manager_id } = req.body;
  if (!display_name || !manager_id) return res.status(400).json({ error: 'Missing required fields' });

  try {
    // Create auth user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: email || `managed-${Date.now()}@wallplanner.internal`,
      password: Math.random().toString(36).slice(-12) + 'Aa1!',
      email_confirm: true,
      user_metadata: { display_name, managed: true }
    });
    if (userError) return res.status(500).json({ error: userError.message });

    const managed_user_id = userData.user.id;

    // Create profile
    await supabase.from('profiles').upsert({
      user_id: managed_user_id,
      display_name
    });

    // Create managed_users record
    await supabase.from('managed_users').insert({
      managed_user_id,
      managed_by: manager_id,
      display_name,
      email: email || null,
      can_manager_edit: true
    });

    // Create delegated_access record
    await supabase.from('delegated_access').insert({
      manager_id,
      managed_user_id,
      can_edit: true,
      can_view: true
    });

    // If email provided, send invite
    if (email) {
      await supabase.auth.admin.generateLink({
        type: 'invite',
        email,
        options: { redirectTo: process.env.APP_URL || req.headers.origin }
      });
    }

    return res.status(200).json({ managed_user_id, display_name });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
