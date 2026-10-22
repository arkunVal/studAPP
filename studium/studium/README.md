# Studium-App

Stundenplan, Abgaben und Wissensablage. Vite (ohne Framework), Supabase (Login, Datenbank, Dateien) und Vercel (Hosting).

## 1. Supabase einrichten

1. Auf supabase.com ein neues Projekt anlegen.
2. Links **SQL Editor** öffnen, den Inhalt von `supabase/schema.sql` einfügen und **Run** drücken.
   Das legt Tabellen, Zugriffsregeln, den privaten Datei-Speicher `dateien` und den Live-Sync an.
3. **Project Settings → API**: `Project URL` und den `anon public` Key kopieren.
4. **Authentication → URL Configuration**: bei *Site URL* später deine Vercel-Adresse eintragen
   (und `http://localhost:5173` unter *Redirect URLs*). Das braucht der Link in den Bestätigungs-
   und Passwort-vergessen-Mails.
5. Optional: **Authentication → Providers → Email**: „Confirm email“ ausschalten, wenn du dich
   ohne Bestätigungsmail registrieren willst (du bist der einzige Nutzer).

## 2. Lokal testen

```
npm install
cp .env.example .env     # URL und Key eintragen
npm run dev
```

## 3. Auf Vercel bringen

1. Ordner in ein GitHub-Repository hochladen.
2. Auf vercel.com **Add New → Project**, das Repo wählen. Framework (Vite) wird erkannt.
3. Unter **Environment Variables** `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` eintragen.
4. **Deploy**. Danach die Vercel-Adresse bei Supabase als *Site URL* eintragen (Schritt 1.4).

Der anon Key darf öffentlich sein, der Schutz kommt von den Zeilenregeln (RLS) im SQL-Skript:
Jeder sieht nur seine eigenen Daten und Dateien.

## Auf iPhone und iPad

In Safari die Vercel-Adresse öffnen, **Teilen → Zum Home-Bildschirm**. Die App startet dann ohne
Browserleiste. Der Stundenplan bleibt offline sichtbar, Änderungen werden nachgeholt, sobald du online bist.

## Was die App kann

- **Start:** Kennzahlen zu Terminen, Abgaben, ECTS, Schnitt, fälligen Karten und Lernzeit, dazu Kalender und Erinnerungen
- **Stundenplan, Abgaben, Prüfungen:** Prüfungen mit Anmeldefrist, Raum und Haken für „angemeldet“
- **Lernen:** Karteikarten mit Wiederholung (Stufen 1 bis 5, Import per „Frage ; Antwort“) und Pomodoro-Timer mit Lernzeit pro Modul
- **Wissen:** Dateien mit Vorschau und Notizen pro Vorlesung, verknüpft mit Datei und Seitenzahl
- **Noten und ECTS:** Fortschrittsbalken, Schnitt mit Gewichtung und „Was brauche ich noch für Schnitt X?“
- **Semesterplanung, Module, Kontakte:** Dozenten und Lerngruppen mit Kontaktdaten, Dozent wird beim Modul gewählt

Alle neuen Daten liegen im bestehenden `app_state`-Eintrag. Du musst das SQL-Skript nicht erneut ausführen.
