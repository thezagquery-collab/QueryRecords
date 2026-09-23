# QueryRecords

Static catalog for **QueryRecords**, a Zag Query imprint by Timur Azaklı. The home page lists the roster. Each artist page groups releases into **Albums**, **EPs**, and **Singles only**.

After GitHub Pages is enabled, the site is served at:

https://thezagquery-collab.github.io/QueryRecords/

Asset and page links are relative, so the same files resolve under the project base path `/QueryRecords/` and at the root of a local preview server.

## Preview locally

From the repository root:

```bash
python3 -m http.server 8080
```

Open http://localhost:8080/

`fetch` needs HTTP. Opening `index.html` as a file will not load `data/catalog.json`.

## Add a release

Edit [`data/catalog.json`](data/catalog.json). Find the artist and append an object to their `releases` array. Commit the change to `main`.

```json
{
  "slug": "example-single",
  "title": "Example Title",
  "type": "single",
  "year": 2026,
  "streetDate": null,
  "streetDateApproximate": false,
  "distributor": null,
  "cover": null,
  "links": {
    "spotify": null,
    "appleMusic": null,
    "youtube": null,
    "hyperfollow": null
  }
}
```

| Field | What to enter |
| --- | --- |
| `slug` | Optional lowercase id, such as `grid-off`. |
| `title` | Release title. |
| `type` | `album`, `ep`, or `single`. |
| `year` | Four-digit year, or `null` to show **Year TBD**. |
| `streetDate` | `YYYY-MM-DD`, or `null`. |
| `streetDateApproximate` | `true` when the date is approximate. The site prefixes `~`. |
| `distributor` | Name such as `DistroKid`, or `null`. |
| `cover` | `null` for the placeholder, or a path without a leading slash: `assets/covers/grid-off.jpg`. An `https://` image URL is also accepted. |
| `links.*` | A full `https://` store URL, or `null`. |

`null` store links render as **TBD**. Do not invent Spotify, Apple Music, or YouTube URLs, and do not add stream counts.

`type` chooses the group:

- `album` appears under **Albums**
- `ep` appears under **EPs**
- `single` appears under **Singles only**

Singles only are standalone singles. Do not also list those tracks on an album or EP, and do not list album or EP tracks again as singles.

Artist order on the home page is the order of `artists` in the JSON file. To add an artist, append an object with a unique `slug`, the exact `name`, `links` (`spotify`, `appleMusic`, `youtube`, each a URL or `null`), and a `releases` array.

[`data/catalog.schema.json`](data/catalog.schema.json) describes the same fields for editors that read JSON Schema.

## Enable GitHub Pages

Publish the **root** of the **main** branch. Do not point Pages at `/docs`; the site files live at the repository root. `.nojekyll` is included so Pages serves the files directly and does not run Jekyll.

1. Open the repository [thezagquery-collab/QueryRecords](https://github.com/thezagquery-collab/QueryRecords).
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Set **Branch** to `main` and **Folder** to `/ (root)`.
5. Save.

The first deploy can take a minute. The site will be at https://thezagquery-collab.github.io/QueryRecords/.

## Files

| Path | Role |
| --- | --- |
| `index.html` | Roster and latest confirmed release |
| `artist.html` | Artist page (`?artist=violet-volt`) |
| `data/catalog.json` | Catalog data |
| `css/styles.css` | Layout and visual design |
| `js/catalog.js` | Renders the catalog |
| `assets/` | Favicon and future cover images |
