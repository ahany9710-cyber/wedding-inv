# Israa & Ragaaey — Wedding Invitation

A vintage wedding invitation: one static page (`index.html`) plus two small Vercel functions for the wishes wall.

## Deploy on Vercel
1. Import this repo in Vercel. Pick Framework **Other** and leave the build settings empty.
2. **Wishes storage:** open the project's **Storage** tab, create a **Blob** store and connect it to the project. This adds `BLOB_READ_WRITE_TOKEN` automatically.
3. **Admin key:** under **Settings → Environment Variables**, add `ADMIN_KEY` set to any secret phrase.
4. Redeploy so the new variables take effect.

## Manage wishes
- `https://<your-domain>/api/admin?key=<ADMIN_KEY>` lists every wish, with a **Remove** button to take one off the page.
- Add `&format=csv` to download them all as a spreadsheet.

## Edit later
- Share preview image: change the `og:image` URL in `index.html` to your final domain.
- Music: `assets/music.m4a`. Photo: `assets/couple.webp`.
