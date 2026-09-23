// Homepage: render the grid of Zag Query artists with a release summary.
(function () {
  const { ARTISTS } = window.QueryRecords;

  function coverStyle(gradient) {
    return `background-image: linear-gradient(135deg, ${gradient[0]}, ${gradient[1]});`;
  }

  function releaseSummary(releases) {
    const counts = releases.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {});
    return ["Album", "EP", "Single"]
      .filter((type) => counts[type])
      .map((type) => {
        const n = counts[type];
        const label = n === 1 ? type : `${type}s`;
        return `${n} ${label}`;
      })
      .join(" · ");
  }

  function artistCard(artist) {
    const initials = artist.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const card = document.createElement("a");
    card.className = "card";
    card.href = `artist.html?id=${encodeURIComponent(artist.id)}`;
    card.innerHTML = `
      <div class="cover" style="${coverStyle(artist.gradient)}">
        <span class="cover-initials">${initials}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${artist.name}</h3>
        <p class="card-tagline">${artist.tagline}</p>
        <span class="card-meta">${releaseSummary(artist.releases)}</span>
      </div>
    `;
    return card;
  }

  function render() {
    const grid = document.getElementById("artist-grid");
    const count = document.getElementById("artist-count");
    grid.innerHTML = "";
    ARTISTS.forEach((artist) => grid.appendChild(artistCard(artist)));
    count.textContent = `${ARTISTS.length} artists`;
  }

  document.addEventListener("DOMContentLoaded", render);
})();
