-- Ak tabuľka chat_logs už existuje, pridaj stĺpec user_ip
ALTER TABLE chat_logs ADD COLUMN IF NOT EXISTS user_ip VARCHAR(45);

-- Vytvor index pre lepší výkon pri vyhľadávaní podľa IP
CREATE INDEX IF NOT EXISTS idx_chat_logs_user_ip ON chat_logs(user_ip);

-- Ak tabuľka ešte neexistuje, vytvor ju s IP stĺpcom
CREATE TABLE IF NOT EXISTS chat_logs (
  id BIGSERIAL PRIMARY KEY,
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  website VARCHAR(255),
  user_ip VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vytvor indexy pre lepší výkon
CREATE INDEX IF NOT EXISTS idx_chat_logs_created_at ON chat_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_logs_website ON chat_logs(website);
CREATE INDEX IF NOT EXISTS idx_chat_logs_user_ip ON chat_logs(user_ip);
