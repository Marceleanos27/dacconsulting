import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get Supabase credentials from environment variables
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  // Validate environment variables
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { userMessage, botResponse, website } = req.body;

    // Validate required fields
    if (!userMessage || !botResponse) {
      return res.status(400).json({ error: 'Missing required fields: userMessage and botResponse' });
    }

    // Get user's IP address from request headers
    const userIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                   req.headers['x-real-ip'] || 
                   req.connection?.remoteAddress || 
                   req.socket?.remoteAddress ||
                   'unknown';

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Insert chat record into Supabase
    const { data, error } = await supabase
      .from('chat_logs')
      .insert([
        {
          user_message: userMessage,
          bot_response: botResponse,
          website: website || null,
          user_ip: userIP,
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to save chat', details: error.message });
    }

    // Successfully saved
    return res.status(200).json({ success: true, message: 'Chat saved successfully' });

  } catch (error) {
    console.error('Error saving chat:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
