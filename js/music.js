/* ═══════════════════════════════════════════════
   MUSIC PLAYER MODULE
   ═══════════════════════════════════════════════ */

(function () {
    'use strict';

    const playBtn = document.getElementById('music-play');
    const prevBtn = document.getElementById('music-prev');
    const nextBtn = document.getElementById('music-next');
    const progFill = document.getElementById('music-progress-fill');
    const currTimeEl = document.getElementById('music-current');
    const durTimeEl = document.getElementById('music-duration');
    const volSlider = document.getElementById('music-volume');
    const trackNameEl = document.getElementById('music-track-name');
    const playlistItems = document.querySelectorAll('.playlist-item');

    if (!playBtn) return;

    let isPlaying = false;
    let progress = 0;
    let currentTrack = 0;
    let progressInterval;
    let audioCtx;
    let nextNoteTime = 0;
    let currentNote = 0;
    let schedulerId;

    // Simple 8-bit melodies [midi_note, duration_in_16ths]
    const melodies = [
        // Retro Vibes
        [[60, 2], [63, 2], [67, 2], [72, 2], [67, 2], [63, 2], [60, 2], [55, 2]],
        // Neon Dreams
        [[55, 4], [58, 4], [62, 4], [67, 4], [62, 4], [58, 4]],
        // Cyber Drift
        [[48, 2], [48, 2], [60, 2], [48, 2], [63, 2], [60, 2], [65, 2], [63, 2]],
        // Pixel Sunset
        [[72, 4], [71, 4], [67, 4], [64, 4], [67, 8]],
        // Digital Rain
        [[84, 1], [83, 1], [79, 1], [76, 1], [72, 1], [67, 1], [64, 1], [60, 1]],
        // Synthwave Drive
        [[60, 2], [60, 2], [63, 2], [65, 2], [67, 4], [65, 2], [63, 2]],
        // Arcade Boss
        [[45, 1], [48, 1], [51, 1], [54, 1], [57, 1], [60, 1], [63, 1], [66, 4]],
        // Cosmic Journey
        [[72, 2], [79, 2], [76, 4], [74, 2], [72, 2], [71, 4]],
        // Midnight City
        [[55, 2], [62, 2], [67, 2], [74, 2], [79, 4], [74, 4]],
        // 8-Bit Hero
        [[60, 2], [64, 2], [67, 2], [72, 4], [72, 2], [76, 4]]
    ];

    const tracks = [
        { name: 'Retro Vibes', duration: '3:24', time: 204 },
        { name: 'Neon Dreams', duration: '4:12', time: 252 },
        { name: 'Cyber Drift', duration: '2:58', time: 178 },
        { name: 'Pixel Sunset', duration: '3:45', time: 225 },
        { name: 'Digital Rain', duration: '5:01', time: 301 },
        { name: 'Synthwave Drive', duration: '4:30', time: 270 },
        { name: 'Arcade Boss', duration: '2:45', time: 165 },
        { name: 'Cosmic Journey', duration: '5:15', time: 315 },
        { name: 'Midnight City', duration: '3:55', time: 235 },
        { name: '8-Bit Hero', duration: '2:30', time: 150 }
    ];

    function formatTime(secs) {
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    function midiToFreq(m) {
        return Math.pow(2, (m - 69) / 12) * 440;
    }

    function playNote(midi, time, duration) {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        // Retro waves
        osc.type = (currentTrack % 2 === 0) ? 'square' : 'sawtooth';
        osc.frequency.value = midiToFreq(midi);

        const baseVol = parseInt(volSlider.value) / 100;
        const vol = baseVol * 0.15; // Keep it quiet

        gainNode.gain.setValueAtTime(vol, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration - 0.02);

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.start(time);
        osc.stop(time + duration);
    }

    function scheduler() {
        if (!isPlaying) return;
        while (nextNoteTime < audioCtx.currentTime + 0.1) {
            const seq = melodies[currentTrack % melodies.length];
            const note = seq[currentNote % seq.length];
            const noteDuration = note[1] * 0.13; // tempo

            playNote(note[0], nextNoteTime, noteDuration);

            nextNoteTime += noteDuration;
            currentNote++;
        }
        schedulerId = requestAnimationFrame(scheduler);
    }

    function updateTrackUI() {
        trackNameEl.textContent = tracks[currentTrack].name;
        durTimeEl.textContent = tracks[currentTrack].duration;
        playlistItems.forEach(item => item.classList.remove('active'));
        if (playlistItems[currentTrack]) playlistItems[currentTrack].classList.add('active');
        progress = 0;
        progFill.style.width = '0%';
        currTimeEl.textContent = '0:00';
        currentNote = 0;
        if (isPlaying) {
            nextNoteTime = audioCtx.currentTime + 0.1;
        }
    }

    function startPlaying() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();

        isPlaying = true;
        playBtn.textContent = '⏸';
        nextNoteTime = audioCtx.currentTime + 0.1;
        scheduler();

        progressInterval = setInterval(() => {
            progress += 1;
            if (progress >= tracks[currentTrack].time) {
                nextTrack();
            } else {
                progFill.style.width = (progress / tracks[currentTrack].time * 100) + '%';
                currTimeEl.textContent = formatTime(progress);
            }
        }, 1000);

        document.getElementById('music-visualizer').style.animationPlayState = 'running';
    }

    function pausePlaying() {
        isPlaying = false;
        playBtn.textContent = '▶';
        clearInterval(progressInterval);
        cancelAnimationFrame(schedulerId);
        document.getElementById('music-visualizer').style.animationPlayState = 'paused';
    }

    // Seek functionality
    const progressBar = document.getElementById('music-progress-bar');
    if (progressBar) {
        progressBar.addEventListener('click', (e) => {
            const rect = progressBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            const percentage = Math.max(0, Math.min(1, clickX / width));

            progress = Math.floor(percentage * tracks[currentTrack].time);
            progFill.style.width = (percentage * 100) + '%';
            currTimeEl.textContent = formatTime(progress);

            // Recalculate roughly where we are in the sequence for note playback
            if (audioCtx) {
                const seq = melodies[currentTrack % melodies.length];
                const totalSeqDuration = seq.reduce((acc, note) => acc + (note[1] * 0.13), 0);
                const timeInSeq = progress % totalSeqDuration;

                let timeAccum = 0;
                currentNote = 0;
                while (timeAccum < timeInSeq && currentNote < seq.length) {
                    timeAccum += seq[currentNote][1] * 0.13;
                    currentNote++;
                }
                if (isPlaying) {
                    nextNoteTime = audioCtx.currentTime + 0.1;
                }
            }
        });
    }

    // Initially pause visualizer
    const viz = document.getElementById('music-visualizer');
    if (viz) viz.style.animationPlayState = 'paused';

    playBtn.addEventListener('click', () => {
        if (isPlaying) pausePlaying();
        else startPlaying();
    });

    function nextTrack() {
        currentTrack = (currentTrack + 1) % tracks.length;
        updateTrackUI();
    }

    function prevTrack() {
        currentTrack = (currentTrack - 1 + tracks.length) % tracks.length;
        updateTrackUI();
    }

    nextBtn.addEventListener('click', nextTrack);
    prevBtn.addEventListener('click', prevTrack);

    const allIcons = document.querySelectorAll('.playlist-item');

    allIcons.forEach(item => {
        item.addEventListener('click', () => {
            currentTrack = parseInt(item.dataset.track);
            updateTrackUI();
            if (!isPlaying) startPlaying();
        });
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                currentTrack = parseInt(item.dataset.track);
                updateTrackUI();
                if (!isPlaying) startPlaying();
            }
        });
    });

    // Stop playing when the music window is closed
    const musicWin = document.getElementById('window-music');
    if (musicWin) {
        const observer = new MutationObserver(() => {
            if (!musicWin.dataset.state && isPlaying) {
                pausePlaying();
            }
        });
        observer.observe(musicWin, { attributes: true, attributeFilter: ['data-state'] });
    }
})();
