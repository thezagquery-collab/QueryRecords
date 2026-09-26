"use strict";

(function () {
  const audio = document.getElementById("audio");
  const tracklist = document.getElementById("tracklist");
  const playBtn = document.getElementById("play");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const seek = document.getElementById("seek");
  const elapsed = document.getElementById("elapsed");
  const total = document.getElementById("total");
  const nowTitle = document.getElementById("now-title");
  const status = document.getElementById("status");
  const lyricsToggle = document.getElementById("lyrics-toggle");
  const lyrics = document.getElementById("lyrics");
  const lyricsHeading = document.getElementById("lyrics-heading");
  const lyricsBody = document.getElementById("lyrics-body");
  const playIcon = playBtn.querySelector(".icon-play");
  const pauseIcon = playBtn.querySelector(".icon-pause");

  const artworkUrl = new URL("cover.jpg", document.baseURI).href;

  let album = null;
  let current = -1;
  let scrubbing = false;
  let playToken = 0;

  audio.loop = false;
  audio.preload = "none";

  playBtn.addEventListener("click", onPlayClick);
  prevBtn.addEventListener("click", onPrevious);
  nextBtn.addEventListener("click", onNext);
  lyricsToggle.addEventListener("click", onLyricsToggle);
  bindSeek();
  bindKeys();
  bindAudio();
  bindMediaSession();
  loadAlbum();

  function loadAlbum() {
    fetch(new URL("album.json", document.baseURI))
      .then((response) => {
        if (!response.ok) throw new Error("album");
        return response.json();
      })
      .then((data) => {
        if (!data || !Array.isArray(data.tracks) || !data.tracks.length) {
          throw new Error("album");
        }
        album = data;
        document.getElementById("album-title").textContent = data.album;
        document.getElementById("artist-name").textContent = data.artist;
        document.getElementById("year").textContent = String(data.year);
        document.getElementById("track-count").textContent = String(data.tracks.length);
        document.title = data.album + " · " + data.artist;
        renderTracks();
        playBtn.disabled = false;
        paintLyrics();
      })
      .catch(() => {
        tracklist.replaceChildren();
        const item = document.createElement("li");
        item.className = "loading";
        item.textContent = "The album could not be loaded.";
        tracklist.append(item);
      });
  }

  function renderTracks() {
    tracklist.replaceChildren();
    album.tracks.forEach((track, index) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "track";
      button.dataset.index = String(index);

      const num = document.createElement("span");
      num.className = "num";
      num.textContent = String(track.n).padStart(2, "0");

      const title = document.createElement("span");
      title.className = "title";
      title.textContent = track.title;

      const dur = document.createElement("span");
      dur.className = "dur";
      dur.textContent = track.duration;

      button.append(num, title, dur);
      button.addEventListener("click", () => startTrack(index));
      item.append(button);
      tracklist.append(item);
    });
  }

  function startTrack(index) {
    if (!album || index < 0 || index >= album.tracks.length) return;
    const token = ++playToken;
    const track = album.tracks[index];
    current = index;
    assignSource(track.audio);
    paintTrack();
    paintLyrics();
    updateMediaMetadata();
    status.textContent = "Buffering…";
    const pending = audio.play();
    if (pending && typeof pending.then === "function") {
      pending.then(
        () => {
          if (token !== playToken) return;
          status.textContent = "";
          setPlaying(true);
        },
        () => {
          if (token !== playToken) return;
          status.textContent = "";
          setPlaying(false);
        }
      );
    }
  }

  function assignSource(url) {
    if (audio.dataset.src === url) {
      try {
        audio.currentTime = 0;
      } catch (error) {
        /* metadata may not be ready yet */
      }
      return;
    }
    audio.dataset.src = url;
    audio.preload = "metadata";
    audio.src = url;
  }

  function onPlayClick() {
    if (!album) return;
    if (current < 0) {
      startTrack(0);
      return;
    }
    if (audio.paused) {
      status.textContent = "Buffering…";
      const pending = audio.play();
      if (pending && typeof pending.catch === "function") {
        pending.catch(() => {
          status.textContent = "";
          setPlaying(false);
        });
      }
      return;
    }
    audio.pause();
  }

  function onPrevious() {
    if (!album || current < 0) return;
    if (audio.currentTime > 3 || current === 0) {
      try {
        audio.currentTime = 0;
      } catch (error) {
        /* ignore until metadata arrives */
      }
      if (audio.paused) onPlayClick();
      paintTimes();
      return;
    }
    startTrack(current - 1);
  }

  function onNext() {
    if (!album || current < 0 || current >= album.tracks.length - 1) return;
    startTrack(current + 1);
  }

  function onLyricsToggle() {
    const open = lyrics.hidden;
    lyrics.hidden = !open;
    lyricsToggle.setAttribute("aria-expanded", open ? "true" : "false");
    lyricsToggle.textContent = open ? "Hide lyrics" : "Lyrics";
    if (open) paintLyrics();
  }

  function bindSeek() {
    seek.addEventListener("pointerdown", () => {
      scrubbing = true;
    });
    seek.addEventListener("input", () => {
      scrubbing = true;
      previewSeek();
    });
    seek.addEventListener("change", commitSeek);
    seek.addEventListener("pointerup", commitSeek);
    seek.addEventListener("pointercancel", commitSeek);
    seek.addEventListener("keyup", (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight" || event.key === "Home" || event.key === "End") {
        commitSeek();
      }
    });
    window.addEventListener("pointerup", () => {
      if (scrubbing) commitSeek();
    });
    window.addEventListener("pointercancel", () => {
      if (scrubbing) commitSeek();
    });
  }

  function previewSeek() {
    const dur = shownDuration();
    const t = (Number(seek.value) / 1000) * dur;
    elapsed.textContent = formatTime(t);
    seek.setAttribute("aria-valuetext", formatTime(t) + " of " + formatTime(dur));
    seek.style.setProperty("--pos", (Number(seek.value) / 10) + "%");
  }

  function commitSeek() {
    if (!scrubbing) return;
    const dur = shownDuration();
    scrubbing = false;
    if (!dur || current < 0) return;
    const t = Math.min(dur, Math.max(0, (Number(seek.value) / 1000) * dur));
    try {
      audio.currentTime = t;
    } catch (error) {
      /* readyState may still be empty */
    }
    paintTimes();
  }

  function bindKeys() {
    document.addEventListener("keydown", (event) => {
      if (event.code === "MediaPlayPause") {
        event.preventDefault();
        onPlayClick();
        return;
      }
      if (event.code === "MediaTrackNext") {
        event.preventDefault();
        onNext();
        return;
      }
      if (event.code === "MediaTrackPrevious") {
        event.preventDefault();
        onPrevious();
        return;
      }
      if (event.target && event.target.closest && event.target.closest("input, textarea, button, a")) return;
      if (event.code === "Space") {
        event.preventDefault();
        onPlayClick();
      } else if (event.code === "ArrowRight") {
        onNext();
      } else if (event.code === "ArrowLeft") {
        onPrevious();
      }
    });
  }

  function bindAudio() {
    audio.addEventListener("play", () => setPlaying(true));
    audio.addEventListener("playing", () => {
      status.textContent = "";
      setPlaying(true);
    });
    audio.addEventListener("pause", () => {
      const token = playToken;
      queueMicrotask(() => {
        if (token !== playToken) return;
        if (!audio.paused) return;
        if (audio.ended && album && current >= 0 && current < album.tracks.length - 1) return;
        setPlaying(false);
      });
    });
    audio.addEventListener("ended", () => {
      if (!album || current < 0) return;
      if (audio.dataset.src !== album.tracks[current].audio) return;
      if (current >= album.tracks.length - 1) {
        setPlaying(false);
        status.textContent = "";
        return;
      }
      startTrack(current + 1);
    });
    audio.addEventListener("waiting", () => {
      if (!audio.paused) status.textContent = "Buffering…";
    });
    audio.addEventListener("error", () => {
      status.textContent = "This track could not be loaded.";
      setPlaying(false);
    });
    ["timeupdate", "durationchange", "loadedmetadata", "seeked", "emptied"].forEach((name) => {
      audio.addEventListener(name, paintTimes);
    });
  }

  function bindMediaSession() {
    if (!("mediaSession" in navigator)) return;
    const session = navigator.mediaSession;
    setHandler(session, "play", onPlayClick);
    setHandler(session, "pause", () => audio.pause());
    setHandler(session, "previoustrack", onPrevious);
    setHandler(session, "nexttrack", onNext);
    setHandler(session, "seekto", (details) => {
      if (!details || !Number.isFinite(details.seekTime)) return;
      const dur = shownDuration();
      const t = dur ? Math.min(dur, Math.max(0, details.seekTime)) : details.seekTime;
      try {
        audio.currentTime = t;
      } catch (error) {
        /* ignore until the element can seek */
      }
    });
    setHandler(session, "seekbackward", (details) => {
      const amount = details && Number.isFinite(details.seekOffset) ? details.seekOffset : 10;
      nudge(-Math.abs(amount) || -10);
    });
    setHandler(session, "seekforward", (details) => {
      const amount = details && Number.isFinite(details.seekOffset) ? details.seekOffset : 10;
      nudge(Math.abs(amount) || 10);
    });
  }

  function setHandler(session, name, fn) {
    try {
      session.setActionHandler(name, fn);
    } catch (error) {
      /* this action is not supported here */
    }
  }

  function nudge(offset) {
    if (!Number.isFinite(offset) || offset === 0) offset = offset < 0 ? -10 : 10;
    const dur = shownDuration();
    const next = audio.currentTime + offset;
    try {
      audio.currentTime = dur ? Math.min(dur, Math.max(0, next)) : Math.max(0, next);
    } catch (error) {
      /* ignore until the element can seek */
    }
  }

  function setPlaying(playing) {
    playIcon.hidden = playing;
    pauseIcon.hidden = !playing;
    playBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = playing ? "playing" : "paused";
    }
    paintClasses(playing);
  }

  function paintTrack() {
    const track = album.tracks[current];
    nowTitle.textContent = track.title;
    nowTitle.classList.remove("is-idle");
    document.title = track.title + " — " + album.album;
    elapsed.textContent = "0:00";
    total.textContent = track.duration;
    seek.disabled = false;
    seek.value = "0";
    seek.style.setProperty("--pos", "0%");
    seek.setAttribute("aria-valuetext", "0:00 of " + track.duration);
    prevBtn.disabled = false;
    nextBtn.disabled = current >= album.tracks.length - 1;
    paintClasses(!audio.paused);
    const button = tracklist.querySelector('.track[data-index="' + current + '"]');
    if (button) button.scrollIntoView({ block: "nearest" });
    syncSessionTransport();
  }

  function paintClasses(playing) {
    tracklist.querySelectorAll(".track").forEach((button) => {
      const on = Number(button.dataset.index) === current;
      button.classList.toggle("is-current", on);
      button.classList.toggle("is-playing", on && playing);
      if (on) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
  }

  function paintLyrics() {
    if (!album) return;
    if (current < 0) {
      lyricsHeading.textContent = "Lyrics";
      lyricsBody.textContent = "Play a track to read the lyrics.";
      return;
    }
    const track = album.tracks[current];
    lyricsHeading.textContent = track.title;
    lyricsBody.textContent = track.lyrics;
  }

  function paintTimes() {
    if (!album || current < 0 || scrubbing) return;
    const track = album.tracks[current];
    const srcMatches = audio.dataset.src === track.audio;
    const haveMedia =
      srcMatches && Number.isFinite(audio.duration) && audio.duration > 0 && audio.duration !== Infinity;
    const dur = haveMedia ? audio.duration : parseClock(track.duration);
    const t = haveMedia ? audio.currentTime || 0 : 0;
    elapsed.textContent = formatTime(t);
    total.textContent = formatTime(dur) || track.duration;
    const ratio = dur ? Math.min(1, Math.max(0, t / dur)) : 0;
    seek.value = String(Math.round(ratio * 1000));
    seek.style.setProperty("--pos", ratio * 100 + "%");
    seek.setAttribute("aria-valuetext", formatTime(t) + " of " + formatTime(dur));
    updatePosition(dur, t, haveMedia);
  }

  function shownDuration() {
    if (!album || current < 0) return 0;
    const track = album.tracks[current];
    const srcMatches = audio.dataset.src === track.audio;
    if (srcMatches && Number.isFinite(audio.duration) && audio.duration > 0 && audio.duration !== Infinity) {
      return audio.duration;
    }
    return parseClock(track.duration);
  }

  function updateMediaMetadata() {
    if (!("mediaSession" in navigator) || typeof MediaMetadata === "undefined") return;
    const track = album.tracks[current];
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: album.artist,
      album: album.album,
      artwork: [{ src: artworkUrl, sizes: "1200x1200", type: "image/jpeg" }],
    });
    syncSessionTransport();
  }

  function syncSessionTransport() {
    if (!("mediaSession" in navigator) || !album) return;
    const session = navigator.mediaSession;
    setHandler(session, "nexttrack", current >= 0 && current < album.tracks.length - 1 ? onNext : null);
    setHandler(session, "previoustrack", current >= 0 ? onPrevious : null);
  }

  function updatePosition(dur, t, haveMedia) {
    if (!haveMedia || !("mediaSession" in navigator) || typeof navigator.mediaSession.setPositionState !== "function") {
      return;
    }
    const position = Math.min(dur, Math.max(0, t));
    try {
      navigator.mediaSession.setPositionState({
        duration: dur,
        playbackRate: audio.playbackRate || 1,
        position: position,
      });
    } catch (error) {
      /* position state is best-effort */
    }
  }

  function parseClock(text) {
    const parts = String(text).split(":").map((part) => Number(part));
    if (parts.length === 2 && parts.every((n) => Number.isFinite(n))) return parts[0] * 60 + parts[1];
    return 0;
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const whole = Math.floor(seconds);
    const minutes = Math.floor(whole / 60);
    const remain = whole % 60;
    return minutes + ":" + String(remain).padStart(2, "0");
  }
})();
