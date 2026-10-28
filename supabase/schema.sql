-- =========================================================================
-- SCHEMA SUPABASE POSTGRESQL PER BRISCOLA CLUB (MULTI-CASA / MULTI-TENANT)
-- Incolla questo script nell'SQL Editor del tuo progetto Supabase per attivare
-- l'autenticazione Google, la persistenza profili, case e sincronizzazione Realtime.
-- =========================================================================

-- 1. Tabella delle Case
CREATE TABLE IF NOT EXISTS public.houses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profili Utente (collegati ad auth.users di Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Membri della Casa (collega utenti registrati alle case a cui partecipano)
CREATE TABLE IF NOT EXISTS public.house_members (
  house_id TEXT NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nickname TEXT, -- soprannome personalizzato opzionale specifico solo per questa casa
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (house_id, user_id)
);

-- Assicura vincolo esplicito verso profiles anche se la tabella esisteva già prima
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'house_members_user_id_fkey_profiles'
  ) THEN
    BEGIN
      ALTER TABLE public.house_members 
        ADD CONSTRAINT house_members_user_id_fkey_profiles 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;

-- 4. Giocatori della Casa (giocatori locali o generati)
CREATE TABLE IF NOT EXISTS public.players (
  id TEXT NOT NULL,
  house_id TEXT NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  nickname TEXT,
  avatar_suit TEXT NOT NULL DEFAULT 'coppe',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (house_id, id)
);

-- 5. Squadre della Casa
CREATE TABLE IF NOT EXISTS public.teams (
  id TEXT NOT NULL,
  house_id TEXT NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  player_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  color TEXT NOT NULL DEFAULT '#f59e0b',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (house_id, id)
);

-- 6. Partite Registrate
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

-- 7. Sessioni di Torneo Serata
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
  players5 JSONB,
  winner_player_name TEXT,
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

ALTER TABLE public.tournament_sessions ADD COLUMN IF NOT EXISTS players5 JSONB;
ALTER TABLE public.tournament_sessions ADD COLUMN IF NOT EXISTS winner_player_name TEXT;

-- 8. Trigger per sincronizzare automaticamente auth.users -> public.profiles al login Google
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1),
      'Giocatore'
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture',
      NULL
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Abilitazione Row Level Security (RLS)
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_sessions ENABLE ROW LEVEL SECURITY;

-- Policy aperte per multi-casa con token anonimo o utente autenticato
CREATE POLICY "Accesso case" ON public.houses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Accesso profili" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Accesso membri casa" ON public.house_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Accesso giocatori" ON public.players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Accesso squadre" ON public.teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Accesso partite" ON public.matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Accesso tornei" ON public.tournament_sessions FOR ALL USING (true) WITH CHECK (true);

-- 10. Abilitazione Pubblicazione Realtime
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
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'house_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.house_members;
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
