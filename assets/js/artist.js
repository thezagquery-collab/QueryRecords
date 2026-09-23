// Artist page: render one artist's discography grouped by release type.
(function () {
  const { ARTISTS, RELEASE_TYPES } = window.QueryRecords;

  function getArtistId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
  }

  function coverStyle(gradient) {
    return `background-image: linear-gradient(135deg, ${gradient[0]}, ${gradient[1]});`;
  }

  function trackList(tracks) {
    return tracks
      .map(
        (t, i) =>
          `<li class="track"><span class="track-num">${i + 1}</span><span class="track-name">${t}</span></li>`,
      )
      .join("");
  }

  function releaseCard(release) {
    return `
      <article class="release">
        <div class="release-cover" style="${coverStyle(release.gradient)}"></div>
        <div class="release-info">
          <h4 class="release-title">${release.title}</h4>
          <span class="release-meta">${release.type} · ${release.year} · ${release.tracks.length} track${release.tracks.length === 1 ? "" : "s"}</span>
          <ol class="tracklist">${trackList(release.tracks)}</ol>
        </div>
      </article>
    `;
  }

  function renderNotFound(container) {
    container.innerHTML = `
      <div class="empty">
        <h1>Artist not found</h1>
        <p>We couldn't find that artist in the QueryRecords catalog.</p>
      </div>
    `;
  }

  function render() {
    const container = document.getElementById("artist-content");
    const artist = ARTISTS.find((a) => a.id === getArtistId());

    if (!artist) {
      renderNotFound(container);
      return;
    }

    document.title = `${artist.name} — QueryRecords`;

    const sections = RELEASE_TYPES.map((type) => {
      const releases = artist.releases.filter((r) => r.type === type);
      if (releases.length === 0) return "";
      const heading = releases.length === 1 ? type : `${type}s`;
      return `
        <section class="release-section">
          <h2 class="release-section-title">${heading}</h2>
          <div class="release-grid">${releases.map(releaseCard).join("")}</div>
        </section>
      `;
    }).join("");

    container.innerHTML = `
      <header class="artist-header">
        <div class="artist-avatar" style="${coverStyle(artist.gradient)}"></div>
        <div>
          <h1 class="artist-name">${artist.name}</h1>
          <p class="artist-tagline">${artist.tagline}</p>
        </div>
      </header>
      ${sections}
    `;
  }

  document.addEventListener("DOMContentLoaded", render);
})();
