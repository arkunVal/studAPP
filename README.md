# Studium-App (PWA)

Läuft im Browser auf Desktop, iPhone und iPad, ist installierbar und offline nutzbar.
Ohne Konfiguration funktioniert sie sofort, speichert dann aber nur lokal pro Gerät.

## 1. Supabase einrichten (kostenlos)

1. Auf supabase.com registrieren -> New project (Region z. B. Frankfurt).
2. SQL Editor -> Inhalt von `supabase-setup.sql` einfügen -> Run.
   (Legt Tabelle, Datei-Bucket, Zugriffsregeln und Live-Sync an.)
3. Project Settings -> API: **Project URL** und **anon public key** in `config.js` eintragen.
4. Authentication -> Providers -> Email: Für den Alleingebrauch kannst du "Confirm email" ausschalten,
   sonst musst du nach der Registrierung einmal den Link in der Bestätigungs-Mail klicken.
5. Nach dem Deploy: Authentication -> URL Configuration -> **Site URL** auf deine Vercel-Adresse setzen.

## 2. Auf Vercel hosten

- Per GitHub: Ordner in ein Repo pushen -> vercel.com -> Add New Project -> Repo wählen.
  Framework "Other", kein Build-Command, Output-Directory leer lassen. Deploy.
- Oder per CLI: `npm i -g vercel` und im Ordner `vercel --prod`.

## 3. Installieren

- iPhone/iPad: Seite in Safari öffnen -> Teilen -> "Zum Home-Bildschirm".
- Desktop (Chrome/Edge): Installieren-Symbol in der Adressleiste.

Beim ersten Start registrieren, auf den anderen Geräten mit derselben E-Mail anmelden.
Ein Klick auf die Sync-Anzeige oben meldet ab bzw. an.

## Hinweise

- Free-Projekte bei Supabase werden nach einer Woche ohne Aktivität pausiert (im Dashboard mit einem Klick wieder aktivierbar).
- Datei-Links sind lange gültige, nicht erratbare Links auf einen privaten Bucket.
- Daten aus der Claude-Version werden nicht automatisch übernommen.
