# Simpleng Setup Guide — POS Philippines

## Ano ang nasa package?

- **GitHub Pages** — customer website at admin page
- **Cloudflare Worker** — secure API/backend
- **Cloudflare D1** — actual online database
- **Cloudflare R2** — images ng logo, products, packages, at reviews

Hindi puwedeng GitHub Pages lang ang database dahil static hosting ito. Kaya ang frontend ay nasa GitHub, habang ang database at secure login ay nasa Cloudflare.

## Unang gagawin sa Cloudflare

Buksan ang folder na `cloudflare-worker` sa terminal:

```bash
npm install
npx wrangler login
npx wrangler d1 create pos-philippines-db
```

Kopyahin ang `database_id` at ilagay sa `wrangler.jsonc`.

Gumawa ng image storage:

```bash
npx wrangler r2 bucket create pos-philippines-media
```

Ilagay ang GitHub username mo sa `ALLOWED_ORIGINS` sa `wrangler.jsonc`.

Halimbawa:

```text
https://joebertgreganda.github.io
```

Gawin ang tables at sample data:

```bash
npm run db:schema:remote
npm run db:seed:remote
```

I-deploy ang API:

```bash
npm run deploy
```

Kopyahin ang lalabas na `workers.dev` URL.

## Ikabit ang API sa website

Buksan ang:

```text
frontend/config.js
```

Palitan ang placeholder ng Worker URL.

## Upload sa GitHub

I-upload ang buong project sa bagong GitHub repository. Sa repository settings:

1. Pumunta sa **Settings**
2. Piliin ang **Pages**
3. Source: **GitHub Actions**
4. I-upload/push sa `main` branch
5. Tingnan ang Actions kung successful

## Admin login

- Username: `admin`
- Temporary password: `POSAdmin2026!`

Required gumawa ng bagong password sa unang login.

## Domain bukas

Kapag approved na ang price:

1. Add custom domain sa GitHub Pages
2. Ayusin DNS sa Squarespace
3. Idagdag ang domain sa `ALLOWED_ORIGINS`
4. Deploy ulit ang Worker

Hindi mawawala o magbabago ang D1 database kapag kinabit ang domain.
