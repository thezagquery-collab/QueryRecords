// QueryRecords catalog data.
// Static data source for the Zag Query music catalog. Edit here to add or
// update artists and their releases. Cover art is rendered as CSS gradients
// (see `gradient`) so the site stays fully static with no binary assets.

const RELEASE_TYPES = ["Album", "EP", "Single"];

const ARTISTS = [
  {
    id: "nova-reign",
    name: "Nova Reign",
    tagline: "Cinematic synth-pop from the Query mainframe.",
    gradient: ["#7f5af0", "#2cb67d"],
    releases: [
      {
        title: "Signal Bloom",
        type: "Album",
        year: 2025,
        gradient: ["#7f5af0", "#e45858"],
        tracks: ["Ignition", "Signal Bloom", "Afterglow", "Static Hymn", "Reentry"],
      },
      {
        title: "Orbit Sessions",
        type: "EP",
        year: 2024,
        gradient: ["#2cb67d", "#7f5af0"],
        tracks: ["Low Orbit", "Drift", "Gravity Well"],
      },
      {
        title: "Midnight Query",
        type: "Single",
        year: 2024,
        gradient: ["#e45858", "#f9c74f"],
        tracks: ["Midnight Query"],
      },
    ],
  },
  {
    id: "cassette-ghost",
    name: "Cassette Ghost",
    tagline: "Lo-fi hauntology and dusty drum machines.",
    gradient: ["#f25f4c", "#ff8906"],
    releases: [
      {
        title: "Tape Decay",
        type: "Album",
        year: 2023,
        gradient: ["#f25f4c", "#232946"],
        tracks: ["Rewind", "Tape Decay", "Warble", "Analog Dust", "Fade to Hiss"],
      },
      {
        title: "B-Sides & Static",
        type: "EP",
        year: 2022,
        gradient: ["#ff8906", "#f25f4c"],
        tracks: ["Static Interlude", "Ghost Track", "Reel to Reel"],
      },
    ],
  },
  {
    id: "prism-avenue",
    name: "Prism Avenue",
    tagline: "Neon funk built for late-night drives.",
    gradient: ["#00c2ff", "#ff61d2"],
    releases: [
      {
        title: "Chromatic",
        type: "Album",
        year: 2025,
        gradient: ["#00c2ff", "#7f5af0"],
        tracks: ["Refraction", "Chromatic", "Neon Avenue", "Spectrum", "Afterhours"],
      },
      {
        title: "Glow",
        type: "Single",
        year: 2025,
        gradient: ["#ff61d2", "#00c2ff"],
        tracks: ["Glow"],
      },
      {
        title: "Nightshift",
        type: "Single",
        year: 2024,
        gradient: ["#f9c74f", "#ff61d2"],
        tracks: ["Nightshift"],
      },
    ],
  },
  {
    id: "delta-choir",
    name: "Delta Choir",
    tagline: "Ambient post-rock washes and slow-burn crescendos.",
    gradient: ["#43e97b", "#38f9d7"],
    releases: [
      {
        title: "Tidewater",
        type: "Album",
        year: 2024,
        gradient: ["#38f9d7", "#4361ee"],
        tracks: ["Estuary", "Tidewater", "Slow Current", "Undertow", "Delta Light"],
      },
      {
        title: "Field Notes",
        type: "EP",
        year: 2023,
        gradient: ["#43e97b", "#38f9d7"],
        tracks: ["Marsh", "Field Notes", "Heron"],
      },
    ],
  },
];

// Expose to page scripts without a module bundler (GitHub Pages friendly).
window.QueryRecords = { ARTISTS, RELEASE_TYPES };
