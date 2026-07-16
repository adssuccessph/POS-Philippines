POS PHILIPPINES WEBSITE DEMO
============================

FILES
- index.html   : customer-facing website
- admin.html   : separate admin dashboard demo
- assets/      : included SVG demo images

ADMIN DEMO LOGIN
Password: POSAdmin2026!

HOW TO OPEN LOCALLY ON WINDOWS
1. Extract the ZIP file.
2. Double-click START-DEMO.bat.
3. The website should open at http://localhost:8080/index.html
4. Admin: http://localhost:8080/admin.html

If START-DEMO.bat cannot find Python, upload the folder to GitHub Pages instead.

GITHUB PAGES DEMO
1. Create a new GitHub repository.
2. Upload all files inside this folder to the repository root.
3. Open Settings > Pages.
4. Select Deploy from a branch, main branch, /root.
5. Wait for GitHub to publish the demo link.

DEMO FEATURES
- Responsive public website
- Editable logo, hero text, contact details, and images
- Categories and brands per category
- Products and prices
- POS packages
- Customer inquiry form
- Unique inquiry tracking number
- Customer-visible status timeline
- Admin inquiry status updates
- Verified customer review workflow with admin approval

IMPORTANT
This version stores demo data in the browser's localStorage. It is suitable for a client presentation but not yet for live multi-user production. The production version should connect the forms and admin dashboard to a real database such as Cloudflare D1 and use proper server-side authentication.
