# Content Studio

A private workspace for planning YouTube and Instagram content. Each account sees only its own ideas, drafts, calendar, thumbnail prompts, and hashtag collections.

The first version stores everything in Supabase and writes thumbnail prompts and content drafts with a built-in template generator. You can connect an AI API later without changing the screens.

## Project structure

```
app/
  (app)/                Signed-in workspace
    dashboard/          Counts, recent edits, upcoming dates
    content/            List, create, and edit content
    planner/            1–7 day video ideas, how-to notes, and timed audio scripts
    calendar/           Month and week planning
    library/            Links, thumbnails, descriptions, ideas, references
    thumbnails/         Thumbnail prompt generator
    assistant/          Titles, captions, tags, hooks, script outlines
    hashtags/           Reusable hashtag collections
    settings/           Profile, categories, CSV, backup
  (auth)/               Sign in, register, password reset
  auth/callback/        Supabase email link handler
  api/export/           CSV and JSON download
components/             Shared interface pieces
lib/
  actions/              Validated server actions
  ai/                   Local generator and optional remote provider
  supabase/             Browser client, server client, session proxy
supabase/migrations/    Database, Row Level Security, thumbnail storage
proxy.ts                Keeps the session fresh and blocks other people's pages
```

## Local setup

1. Install Node.js 22 or newer.
2. Install dependencies:

```bash
npm install
```

3. Copy the environment file:

```bash
cp .env.example .env.local
```

4. Create a Supabase project and paste its URL and publishable key into `.env.local`. The steps are in the next section. You can run the app before that. Thumbnail prompts and writing drafts work without keys. Saving content, accounts, and the calendar need Supabase. A production deploy refuses to start until those two values are set, so a public site cannot run as an open workspace.

5. Start the app:

```bash
npm run dev
```

Open http://localhost:3000.

6. Run the unit tests:

```bash
npm test
```

## Supabase setup

1. Create a free project at https://supabase.com/dashboard.
2. Open **Project Settings → API**.
3. Copy the project URL into `NEXT_PUBLIC_SUPABASE_URL` (example: `https://your-project-id.supabase.co`).
4. Copy the **publishable** key (`sb_publishable_...`) into `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The older JWT **anon** key still works in `NEXT_PUBLIC_SUPABASE_ANON_KEY` if that is all the dashboard shows. Do not put a secret or service-role key in this app. Row Level Security is the privacy boundary, and those keys bypass it.
5. Open **SQL Editor**, paste the full file `supabase/migrations/20261120120000_init.sql`, and run it once. It creates:
   - `profiles`, `categories`, `contents`, `thumbnail_prompts`, `hashtag_collections`
   - a private `thumbnails` storage bucket
   - Row Level Security so `user_id` must match the signed-in user
   - a trigger that creates a profile when someone registers
6. Open **Authentication → Providers** and keep Email enabled.
7. For a personal workspace, you can turn off **Confirm email** under **Authentication → Sign In / Providers → Email**. Registration will sign you in immediately. Leave it on if you want people to confirm their address before they can sign in.
8. Open **Authentication → URL Configuration**.
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`
9. Restart `npm run dev` after saving `.env.local`.
10. Register from the app. That creates your private workspace. Nothing in the database is tied to a specific person until they register.

Password hashing and session cookies are handled by Supabase Auth. The app never stores a raw password. New passwords need at least 8 characters, including a letter and a number. Sign-in, sign-up, and password reset are limited to a few attempts per email and address.

In the Supabase dashboard, also set:

- **Authentication → Sign In / Providers → Email:** leave Email on. For a site on the internet, leave **Confirm email** on.
- **Authentication → URL Configuration:** only your real site URL and `/auth/callback`. Do not add a wildcard.
- **Authentication → Attack Protection:** leave the built-in rate limits on.
- Never copy a **secret** or **service role** key into this app or into Vercel. The publishable (or legacy anon) key is the only key the app should have.

## Security

Each signed-in person can read and change only their own rows. That rule is in the database, not only in the screens. Thumbnail files sit in a private bucket under that person’s id, and only JPEG, PNG, WebP, and GIF files up to 5 MB are accepted.

The Gemini key stays in server environment variables. Generating a prompt or a draft requires a signed-in account once Supabase is connected. On your own computer, with no database keys, the generators still run so you can try them.

Saved links must start with `https://`. Redirects after sign-in stay inside this app. Password-reset links use `NEXT_PUBLIC_SITE_URL` when it is set, so a request cannot point the email at another site. CSV export prefixes cells that spreadsheets would treat as formulas. A hosted build also sends standard browser protections: no framing, no content-type sniffing, a content security policy, and HTTPS strict transport security.

### If the storage bucket statement fails

Some projects want the bucket created in the dashboard. Create a **private** bucket named `thumbnails`, then run the four `storage.objects` policies from the bottom of the migration file.

## Environment variables

| Name | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | To save data | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | To save data | Public `sb_publishable_` key. Safe in the browser because RLS is on |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Alternate | Legacy JWT anon key. Used only if the publishable key is empty |
| `NEXT_PUBLIC_SITE_URL` | No | Used for password-reset links when a request has no origin |
| `AI_PROVIDER` | No | `local` (default), `openai`, or `gemini` |
| `AI_API_KEY` | Only for a remote model | Secret. Server only |
| `AI_BASE_URL` | No | Override the provider URL |
| `AI_MODEL` | No | Override the model name |

Leave `AI_PROVIDER=local` and `AI_API_KEY` empty. The thumbnail and writing tools then use the built-in templates. Image prompts are written in English so Google Flow can follow them. A Malayalam topic is quoted as the exact words to place on the thumbnail. Writing drafts follow the language you select.

To connect a model later, set `AI_PROVIDER` to `openai` or `gemini`, set `AI_API_KEY`, and optionally `AI_MODEL`. Gemini uses `gemini-3.5-flash` unless you set `AI_MODEL`. Redeploy or restart. The same buttons call the provider. If the provider is unset or has no key, the app stays on the local generator. The API key stays on the server.

## What you can do

- Register, sign in, and reset a password by email.
- Create, edit, search, filter, sort, duplicate, and delete content.
- Track status from Idea through Published, with a checklist and manual views, likes, and comments.
- Save categories, templates, notes, reference links, and hashtag collections.
- Generate 16:9 and 9:16 thumbnail prompts, edit them, copy them, and open [Google Flow](https://labs.google/fx/tools/flow). The app does not generate images.
- Generate titles, descriptions, captions, tags, hashtags, hooks, and a script outline, then edit, copy, or save them onto content.
- On a content item, generate a description, YouTube tags, and hashtags from the topic, and choose how many tags to create.
- Plan 1 to 7 days of video ideas: titles, how to shoot them, and a spoken audio script for 15 seconds up to 5 minutes. Edit anything, then save it to the calendar.
- Use a month or week calendar and move a planned date by dragging or with the date field.
- Browse the library, export CSV, and download or restore a JSON backup of your rows.

Deleting content asks for confirmation. Thumbnail files live in a private bucket at `{your user id}/{content id}/...`.

## Host it free, with the database

Use two free services. **Supabase** holds accounts, content, and thumbnail files. **Vercel** runs the website. You do not need a paid database or a paid host for a personal workspace.

### 1. Put the code on GitHub

From this folder, commit the project and create an empty GitHub repository. Do not commit `.env.local`.

```bash
git add .
git commit -m "Add the content studio"
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### 2. Create the free database

1. Create a project at https://supabase.com/dashboard. The free plan is enough.
2. Open **Project Settings → API**.
3. Copy the project URL and the **publishable** key. Leave the secret / service role key where it is.
4. Open **SQL Editor**, paste the whole file `supabase/migrations/20261120120000_init.sql`, and run it. If a previous run failed, run this updated file again.
5. If the storage bucket line fails, create a **private** bucket named `thumbnails` in the dashboard, then run the four `storage.objects` policies at the bottom of that file.
6. Open **Authentication → URL Configuration** and set the site URL and redirect after you know the Vercel address in step 4. Until then you can use `http://localhost:3000` and `http://localhost:3000/auth/callback`, then add the live URLs.

### 3. Deploy the site on Vercel

1. Sign in at https://vercel.com and choose **Add New → Project**.
2. Import the GitHub repository. Leave the Next.js build command as `npm run build`.
3. Add these environment variables. Use the Supabase values from step 2. Put the Gemini key only if you want live writing and thumbnail prompts. Leave `AI_BASE_URL` empty.

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (`sb_publishable_...`) |
| `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` after the first deploy, then redeploy |
| `AI_PROVIDER` | `gemini` (required for live writing and tags; without this the app uses local templates) |
| `AI_API_KEY` | Your Gemini key |
| `AI_MODEL` | `gemini-3.5-flash` |

After you add or change these values, click **Redeploy**. `NEXT_PUBLIC_*` values are baked in at build time. `AI_API_KEY` is server-only and must not be prefixed with `NEXT_PUBLIC_`.

4. Deploy. Copy the `https://….vercel.app` address.
5. In Supabase **URL Configuration**, set Site URL to that address and add `https://….vercel.app/auth/callback` as a redirect URL. Remove any address you do not use.
6. In Vercel, set `NEXT_PUBLIC_SITE_URL` to the same `https://….vercel.app` address and redeploy. Password-reset emails use that value.
7. Open the live site. It should show **Sign in**, not the open dashboard. Create an account, confirm the email if you left confirmation on, then sign in. That account is the only one that can see what it saves.

If the live site says it is not ready, the Supabase URL or publishable key is missing from Vercel. Add both and redeploy. Do not turn off the production check to browse the app without a database. That would publish the generators to anyone on the internet.

### 4. Custom domain later

1. In Vercel, open **Settings → Domains** and add your domain.
2. At your registrar, add the DNS records Vercel shows.
3. Add `https://your-domain` and `https://your-domain/auth/callback` in Supabase.
4. Change `NEXT_PUBLIC_SITE_URL` to `https://your-domain` and redeploy.

### 5. Update the live app

Change the code, commit, and push to `main`. Vercel builds that push. Database changes belong in a new SQL file under `supabase/migrations/`. Run that SQL in the Supabase SQL editor before you rely on the new columns.

Vercel’s free Hobby plan can attach a custom domain for a personal project. Do not commit `.env.local`. `.env.example` is safe to commit because it has no secrets.

## Free-tier limits

These are the usual free allowances. Check the current pages before you depend on a number: [Supabase pricing](https://supabase.com/pricing) and [Vercel pricing](https://vercel.com/pricing).

- **Supabase free:** about 500 MB of database, 1 GB of file storage, a 50 MB upload cap (this app limits thumbnails to 5 MB), and roughly 50,000 monthly active users. A free project can pause after about a week without traffic. Auth emails on the built-in mailer are meant for personal use and low volume. Two free projects is the usual account limit.
- **Vercel Hobby:** for personal, non-commercial projects. Bandwidth is generous for one person and is not a paid AI bill. Selling this app as a product means moving that Vercel project to a plan that allows commercial use.
- **GitHub:** a public or private repository is free.
- **Local AI mode:** no API cost. A connected OpenAI or Gemini key is billed by that provider.
- **Google Flow:** opening the link is free to start. Google’s own image-generation quota is separate from this app.

You do not need a paid database, a paid host, or a paid model to run the personal workspace.

## Later, if this becomes a product

The data model is already one private workspace per account. Useful next steps, in roughly this order:

- Plan limits and Stripe billing, with the existing `user_id` columns as the tenant key.
- A workspace table if several people should share one library. Change policies from `user_id = auth.uid()` to membership in that workspace.
- OAuth providers in Supabase Auth.
- The `AI_PROVIDER` switch already calls an OpenAI-compatible endpoint. Point it at the model you want to resell.
- YouTube Data API and Instagram Graph API if you want measured stats instead of the manual view, like, and comment fields.
- Pagination once one account holds more than a few hundred items. The current screens load a few hundred rows, which is enough for a personal channel.
- Custom SMTP so password emails come from your domain.
- Move hosting to a commercial Vercel plan before charging users.

## Scripts

```bash
npm run dev
npm run build
npm test
npm run lint
```
