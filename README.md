# POS Philippines — Production Starter

This package contains a real online website system with:

- GitHub Pages customer and admin frontend
- Cloudflare Worker API
- Cloudflare D1 database
- Cloudflare R2 image storage
- Secure admin login and first-time password change
- Product, category, brand, and package management
- Customer inquiry submission and tracking
- Inquiry status history and admin notes
- Verified customer reviews and admin approval

## Architecture

- `frontend/` — upload/deploy to GitHub Pages
- `cloudflare-worker/` — deploy to Cloudflare Workers
- D1 stores the website records
- R2 stores uploaded logo, hero, product, package, and review images

## Initial admin login

- Username: `admin`
- Temporary password: `POSAdmin2026!`

The system requires a new password during the first login.

---

# Deployment Order

## 1. Create the Cloudflare database

Open a terminal inside `cloudflare-worker`:

```bash
npm install
npx wrangler login
npx wrangler d1 create pos-philippines-db
```

Copy the returned `database_id` into `cloudflare-worker/wrangler.jsonc`.

## 2. Create the Cloudflare R2 bucket

```bash
npx wrangler r2 bucket create pos-philippines-media
```

The bucket name already matches the binding in `wrangler.jsonc`.

## 3. Set the allowed GitHub origin

Open `cloudflare-worker/wrangler.jsonc` and replace:

```text
https://YOUR-GITHUB-USERNAME.github.io
```

with your real GitHub Pages origin, for example:

```text
https://joebert.github.io
```

The repository name is not included in the CORS origin.

When the Squarespace custom domain is connected later, add it after a comma:

```text
https://joebert.github.io,https://yourdomain.com,https://www.yourdomain.com
```

Then redeploy the Worker.

## 4. Create the tables and sample records

```bash
npm run db:schema:remote
npm run db:seed:remote
```

## 5. Deploy the API

```bash
npm run deploy
```

Wrangler will return a URL similar to:

```text
https://pos-philippines-api.YOUR-SUBDOMAIN.workers.dev
```

## 6. Connect the frontend to the API

Open `frontend/config.js` and replace the placeholder with the Worker URL:

```js
window.POS_CONFIG = {
  API_BASE: 'https://pos-philippines-api.YOUR-SUBDOMAIN.workers.dev'
};
```

## 7. Upload the project to GitHub

Create a new GitHub repository and upload all files in this package.

The included GitHub Actions workflow deploys the `frontend` folder.

In the repository:

1. Open **Settings**
2. Open **Pages**
3. Under **Build and deployment**, select **GitHub Actions**
4. Push or upload the files to the `main` branch
5. Open the **Actions** tab and wait for the deployment to finish

The website URL will normally be:

```text
https://YOUR-GITHUB-USERNAME.github.io/REPOSITORY-NAME/
```

Admin page:

```text
https://YOUR-GITHUB-USERNAME.github.io/REPOSITORY-NAME/admin.html
```

## 8. Test before domain connection

Test the following:

- Customer website loads products and packages
- Inquiry creates a tracking number
- Admin login works
- First password change works
- Product/package image upload works
- Admin inquiry update appears in customer tracking
- Completed inquiry can submit a review
- Admin can approve the review

---

# Connecting the Squarespace Domain Later

Do not connect the domain until the GitHub Pages URL and Cloudflare API are working.

When approved:

1. Add the custom domain in GitHub Pages settings
2. Configure the required DNS records in Squarespace
3. Verify the custom domain in GitHub
4. Add both the root domain and `www` domain to `ALLOWED_ORIGINS` in `wrangler.jsonc`
5. Redeploy the Worker

The D1 database and R2 images will remain unchanged when the domain is connected.

---

# Important Security Notes

- Change the temporary admin password immediately.
- Do not publish Cloudflare API tokens or account credentials in GitHub.
- The Worker itself does not need a token stored in the repository because D1 and R2 use Cloudflare bindings.
- Keep the GitHub repository private during setup if you do not want the source publicly visible. GitHub Pages availability for private repositories depends on the account plan and repository settings.
