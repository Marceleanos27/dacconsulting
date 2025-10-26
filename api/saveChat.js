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
    const { 
      userMessage, 
      botResponse, 
      website, 
      ipAddress,
      sessionId, 
      messageIndex, 
      timeToRespond,
      category, 
      geoLocationCity, 
      emailSubmitted 
    } = req.body;

    // Validate required fields
    if (!userMessage || !website || !sessionId) {
      return res.status(400).json({ error: 'Missing required fields: userMessage, website, and sessionId' });
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Prepare data for insertion
    const chatData = {
      user_message: userMessage,
      bot_response: botResponse || null,
      website: website,
      user_ip: ipAddress || null,
      session_id: sessionId,
      message_index: messageIndex || null,
      time_to_respond: timeToRespond || null,
      category: category || null,
      geo_location_city: geoLocationCity || null,
      email_submitted: emailSubmitted || false,
      created_at: new Date().toISOString()
    };

    // Insert chat record into Supabase
    const { data, error } = await supabase
      .from('chat_logs')
      .insert([chatData])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to save chat', details: error.message });
    }

    // Successfully saved
    return res.status(200).json({ success: true, message: 'Chat saved successfully', data });

  } catch (error) {
    console.error('Error saving chat:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
