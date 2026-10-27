-- =========================================================================
-- SCHEMA SUPABASE POSTGRESQL PER BRISCOLA CLUB (MULTI-CASA / MULTI-TENANT)
-- Incolla questo script nell'SQL Editor del tuo progetto Supabase per attivare
-- la persistenza cloud e la sincronizzazione Realtime tra tutti i dispositivi.
-- =========================================================================

-- 1. Tabella delle Case
CREATE TABLE IF NOT EXISTS public.houses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Giocatori della Casa
CREATE TABLE IF NOT EXISTS public.players (
  id TEXT NOT NULL,
  house_id TEXT NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  nickname TEXT,
  avatar_suit TEXT NOT NULL DEFAULT 'coppe',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (house_id, id)
);

-- 3. Squadre della Casa
CREATE TABLE IF NOT EXISTS public.teams (
  id TEXT NOT NULL,
  house_id TEXT NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  player_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  color TEXT NOT NULL DEFAULT '#f59e0b',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (house_id, id)
);

-- 4. Partite Registrate
CREATE TABLE IF NOT EXISTS public.matches (
  id TEXT NOT NULL,
  house_id TEXT NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL DEFAULT 'briscola',
  timestamp TIMESTAMPTZ NOT NULL,
  date_key TEXT NOT NULL,
  team1_id TEXT NOT NULL,
  team2_id TEXT NOT NULL,
  winner_team_id TEXT NOT NULL,
  score_team1 INT,
  score_team2 INT,
  notes TEXT,
  PRIMARY KEY (house_id, id)
);

-- 5. Sessioni di Torneo Serata
CREATE TABLE IF NOT EXISTS public.tournament_sessions (
  id TEXT NOT NULL,
  house_id TEXT NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  date_key TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT '2vs2',
  team1_name TEXT NOT NULL,
  team2_name TEXT NOT NULL,
  team3_name TEXT,
  team1_players JSONB,
  team2_players JSONB,
  team3_players JSONB,
  team1_wins INT NOT NULL DEFAULT 0,
  team2_wins INT NOT NULL DEFAULT 0,
  team3_wins INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  winner_team TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  PRIMARY KEY (house_id, id)
);

-- 6. Abilitazione Row Level Security (RLS) aperta ad accesso anonimo per house_id
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accesso anonimo alle case" ON public.houses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Accesso anonimo ai giocatori" ON public.players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Accesso anonimo alle squadre" ON public.teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Accesso anonimo alle partite" ON public.matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Accesso anonimo ai tornei" ON public.tournament_sessions FOR ALL USING (true) WITH CHECK (true);

-- 7. Abilitazione Pubblicazione Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'houses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.houses;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'players'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'teams'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'matches'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'tournament_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_sessions;
  END IF;
END $$;
