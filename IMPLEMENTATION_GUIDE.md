# Chatbot Conversation Logging - Implementation Guide

## 📋 Overview
Your chatbot widget has been successfully modified to automatically save all conversations to your Vercel backend API, which stores them in Supabase.

## ✅ What Was Changed

### 1. **New API Endpoint Created** (`api/saveChat.js`)
- Accepts POST requests with conversation data
- Connects to Supabase using environment variables
- Saves user messages and bot responses with timestamps
- Includes website hostname for tracking

### 2. **Modified Files**
- ✅ `api/saveChat.js` - New API endpoint for saving chats
- ✅ `package.json` - Added @supabase/supabase-js dependency
- ✅ `index.html` - Added conversation logging functionality

### 3. **Added Functionality in index.html**
- New `saveChatToAPI()` function that sends conversation data to the API
- Integrated into 3 places where bot responds:
  1. `handleTopicClick()` - When user clicks on topic buttons
  2. `searchInDatabase()` - When searching database categories
  3. `sendMessage()` - When user types and sends a message

## 🔧 Setup Instructions

### Step 1: Install Dependencies
Run this command in your project directory:
```bash
npm install
```

### Step 2: Configure Supabase Database
You need to create a table in your Supabase database. Run this SQL in your Supabase SQL editor:

```sql
CREATE TABLE IF NOT EXISTS chat_logs (
  id BIGSERIAL PRIMARY KEY,
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  website VARCHAR(255),
  user_ip VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_chat_logs_created_at ON chat_logs(created_at DESC);
CREATE INDEX idx_chat_logs_website ON chat_logs(website);
CREATE INDEX idx_chat_logs_user_ip ON chat_logs(user_ip);
```

**If the table already exists**, just add the IP column:
```sql
ALTER TABLE chat_logs ADD COLUMN IF NOT EXISTS user_ip VARCHAR(45);
CREATE INDEX IF NOT EXISTS idx_chat_logs_user_ip ON chat_logs(user_ip);
```

### Step 3: Set Environment Variables in Vercel
Make sure these environment variables are configured in your Vercel project:

1. Go to your Vercel dashboard
2. Navigate to your project settings
3. Go to "Environment Variables"
4. Add/verify these variables:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_KEY` - Your Supabase anon/service key
   - `API_KEY` - Your existing DeepSeek API key (already configured)

### Step 4: Deploy to Vercel
```bash
vercel --prod
```

Or simply push to your git repository if you have automatic deployments enabled.

## 🎯 How It Works

### Conversation Flow:
1. User sends a message
2. Bot processes and responds
3. **NEW:** Conversation is automatically saved to API
4. API stores it in Supabase database
5. User experience is unaffected (runs in background)

### Data Saved:
```json
{
  "userMessage": "What are your services?",
  "botResponse": "We offer customs consulting, excise duties...",
  "website": "dacconsulting.sk",
  "userIP": "192.168.1.1"
}
```

**Note:** IP address is automatically extracted from request headers on the server side for privacy and security.

### Error Handling:
- All API calls are non-blocking
- Errors are logged to console only
- User experience is never interrupted
- Failed saves don't break the chatbot

## 📊 Accessing Your Data

You can query your conversation logs in Supabase:

```sql
-- Get all conversations
SELECT * FROM chat_logs ORDER BY created_at DESC;

-- Get conversations from a specific website
SELECT * FROM chat_logs 
WHERE website = 'dacconsulting.sk' 
ORDER BY created_at DESC;

-- Get conversations from a specific IP address
SELECT * FROM chat_logs 
WHERE user_ip = '192.168.1.1' 
ORDER BY created_at DESC;

-- Get conversations from the last 24 hours
SELECT * FROM chat_logs 
WHERE created_at > NOW() - INTERVAL '24 hours' 
ORDER BY created_at DESC;

-- Count conversations per website
SELECT website, COUNT(*) as total_conversations 
FROM chat_logs 
GROUP BY website 
ORDER BY total_conversations DESC;

-- Count conversations per IP address
SELECT user_ip, COUNT(*) as total_conversations 
FROM chat_logs 
GROUP BY user_ip 
ORDER BY total_conversations DESC;
```

## 🔍 Testing

### Local Testing:
```bash
vercel dev
```

Then open your browser console and watch for:
- ✅ "Chat saved successfully" - when save succeeds
- ❌ Error messages - if there are issues

### Production Testing:
After deployment, check:
1. Have a conversation with your chatbot
2. Check Supabase Table Editor to see new entries
3. Verify the data is correct

## 🚨 Troubleshooting

### Issue: "Failed to save chat"
- Check if SUPABASE_URL and SUPABASE_KEY are set in Vercel
- Verify your Supabase table exists
- Check Vercel function logs for detailed errors

### Issue: "Server configuration error"
- Environment variables are missing
- Add them in Vercel dashboard and redeploy

### Issue: Database errors
- Verify the table schema matches the SQL above
- Check Supabase permissions for your API key

## 📝 Notes

- The widget remains fully functional even if saving fails
- All saves happen in the background
- No impact on chatbot performance
- Works across all allowed domains (dacconsulting.sk, dacconsulting.eu, ragnetiq.com)

## 🎉 You're All Set!

Your chatbot now automatically logs all conversations to your database. This data can be used for:
- Analytics and insights
- Training improvements
- Customer support follow-ups
- Understanding user needs
