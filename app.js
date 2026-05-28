/* 
   HEARTSTOPPER CLAYART - ZERO-G PRESENTATION
   Premium Interactive Controller & Web Audio Synth Engine
*/

document.addEventListener('DOMContentLoaded', () => {
  
  // --- STATE VARIABLES ---
  const state = {
    currentScreen: 'grid', // 'grid', 'intro', 'music', 'gallery', 'steps'
    isPlayingMusic: false,
    isMuted: false,
    activeTool: 'pin', // 'pin', 'knife', 'brush'
    sculptStep: 0,
    sculptedAnimal: null, // 'frog', 'avocado', 'cat', 'mug'
    activeClayItem: 'avocado',
    isVinylLoaded: false
  };

  // --- AUDIO SYNTH COZY ENGINE ---
  let audioCtx = null;
  let synthInterval = null;
  let vinylCrackleNode = null;
  let masterGain = null;
  let isSynthRunning = false;

  // Dynamic cozy lo-fi song database covers with real MP3 track files!
  const synthesizedTracks = {
    still_with_you: {
      name: "Still with you",
      artist: "Jungkook cover (Rain lo-fi ☕)",
      audioFile: "still_with_you_lofi.mp3",
      centerColor: "#9B59B6",
      themeClass: "bg-still_with_you"
    },
    rumbling: {
      name: "Rumbling",
      artist: "Attack on Titan cover (Music Box 🌙)",
      audioFile: "rumbling_music_box.mp3",
      centerColor: "#C0392B",
      themeClass: "bg-rumbling"
    },
    shinunoga_e_wa: {
      name: "Shinunoga E-Wa",
      artist: "Fujii Kaze cover (Cozy lofi 🦊)",
      audioFile: "shinunoga_e_wa_lofi.mp3",
      centerColor: "#2C2C2C",
      themeClass: "bg-shinunoga_e_wa"
    }
  };

  let currentTrackKey = 'still_with_you';

  function initAudio() {
    if (audioCtx) return;
    
    // Create Audio Context with cross-browser support
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
    
    // Master Lowpass filter for muffled cozy lo-fi sound
    const lofiFilter = audioCtx.createBiquadFilter();
    lofiFilter.type = 'lowpass';
    lofiFilter.frequency.setValueAtTime(850, audioCtx.currentTime); // Cozy dampening
    lofiFilter.Q.setValueAtTime(1, audioCtx.currentTime);

    // Master Volume Gain
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(state.isMuted ? 0 : 0.22, audioCtx.currentTime);

    // Connect nodes
    lofiFilter.connect(masterGain);
    masterGain.connect(audioCtx.destination);

    // Synthesize cozy background vinyl crackle noise
    createVinylCrackle(lofiFilter);
  }

  function createVinylCrackle(destination) {
    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    // White noise fill
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter the white noise to sound like low-frequency crackle/hiss
    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1000, audioCtx.currentTime);
    noiseFilter.Q.setValueAtTime(1.5, audioCtx.currentTime);

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.007, audioCtx.currentTime); // Extremely soft background hiss

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(destination);
    
    whiteNoise.start();
    vinylCrackleNode = whiteNoise; // Save reference
  }

  // Soft note synthesis
  function playSynthNote(freq, type = 'triangle', duration = 0.8, volume = 0.05, delay = 0) {
    if (!audioCtx || state.isMuted) return;

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);

    // Smooth ADSR (Attack, Decay, Sustain, Release) envelope
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime + delay);
    gainNode.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + delay + 0.08); // soft attack
    gainNode.gain.exponentialRampToValueAtTime(volume * 0.4, audioCtx.currentTime + delay + duration * 0.4);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + delay + duration); // smooth release

    osc.connect(gainNode);
    gainNode.connect(masterGain);

    osc.start(audioCtx.currentTime + delay);
    osc.stop(audioCtx.currentTime + delay + duration + 0.1);
  }

  // Convert MIDI note number to frequency
  function mtof(midiNote) {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }

  // Sequencer loop - Controls HTML5 Audio player and spawns visual cozy notes!
  function startLoFiSequencer() {
    if (isSynthRunning) return;
    isSynthRunning = true;

    const audioPlayer = document.getElementById('lofi-audio-player');
    if (audioPlayer) {
      const track = synthesizedTracks[currentTrackKey] || synthesizedTracks['still_with_you'];
      if (track) {
        // Swap src only if different
        const currentSrc = audioPlayer.src;
        if (!currentSrc || currentSrc.indexOf(encodeURI(track.audioFile)) === -1) {
          audioPlayer.src = track.audioFile;
        }
        audioPlayer.muted = state.isMuted;
        audioPlayer.play().catch(err => {
          console.log("Audio autoplay / playback blocked by browser user permission bounds:", err);
        });
      }
    }
    
    // Periodically spawn cozy music note bubbles!
    synthInterval = setInterval(() => {
      if (!state.isPlayingMusic) return;
      spawnMusicNoteEffect();
    }, 750); // a cozy note every 750ms
  }

  function stopLoFiSequencer() {
    if (synthInterval) {
      clearInterval(synthInterval);
      synthInterval = null;
    }
    const audioPlayer = document.getElementById('lofi-audio-player');
    if (audioPlayer) {
      audioPlayer.pause();
    }
    isSynthRunning = false;
  }

  // Quick UI feedback chime
  function playClickChime() {
    initAudio();
    if (state.isMuted) return;
    playSynthNote(mtof(76), 'sine', 0.15, 0.06);
    playSynthNote(mtof(79), 'sine', 0.2, 0.04, 0.04);
  }

  // Pop sound chime
  function playPopChime() {
    initAudio();
    if (state.isMuted) return;
    
    // Pitch glide up to simulate a cute bubble popping
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.12);
    
    gainNode.gain.setValueAtTime(0.06, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    
    osc.connect(gainNode);
    gainNode.connect(masterGain);
    
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Sculpting hammer feedback sound
  function playSculptChime(stage) {
    initAudio();
    if (state.isMuted) return;
    
    const scale = [60, 64, 67, 72, 76]; // beautiful ascending pentatonic
    const note = scale[stage % scale.length];
    
    playSynthNote(mtof(note), 'triangle', 0.3, 0.06);
    playSynthNote(mtof(note + 12), 'sine', 0.25, 0.03, 0.02);
  }


  // --- AMBIENT FLOATING DUST PARTICLES ---
  function initBackgroundParticles() {
    const container = document.getElementById('bg-particles');
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
      const dot = document.createElement('div');
      dot.classList.add('bg-dot');
      
      const size = Math.random() * 8 + 4;
      const left = Math.random() * 100;
      const bottom = -20;
      const delay = Math.random() * 20;
      const duration = Math.random() * 15 + 15;
      const yDrift = -(Math.random() * 400 + 400);

      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      dot.style.left = `${left}%`;
      dot.style.bottom = `${bottom}px`;
      dot.style.setProperty('--duration', `${duration}s`);
      dot.style.setProperty('--y-drift', `${yDrift}px`);
      dot.style.animationDelay = `${delay}s`;
      
      // Random pastel colors for ambient dots
      const colors = ['#D5E5D5', '#FADBD8', '#F7F4EB', '#E5B2A9'];
      dot.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

      container.appendChild(dot);
    }
  }


  // --- PRESENTATION ROUTER ENGINE ---
  const phonesContainer = document.getElementById('phones-container');
  const controlButtons = document.querySelectorAll('.control-btn');
  const viewGridBtn = document.getElementById('view-grid-btn');

  function updateRouterView(targetScreen, updateURL = true) {
    // Immersion Locked: Showcase Grid is an admin hack, force intro!
    if (targetScreen === 'grid' || !targetScreen) {
      targetScreen = 'intro';
    }

    state.currentScreen = targetScreen;

    // Immersive screen view is ALWAYS active (zero margins, notches, bezel)
    document.body.classList.add('focused-screen-active');

    // Update Control Deck active states (if any button exists)
    controlButtons.forEach(btn => btn.classList.remove('active'));
    
    const activeBtn = document.getElementById(`view-${targetScreen}-btn`) || viewGridBtn;
    if (activeBtn) activeBtn.classList.add('active');

    // Update showcase CSS classes (only active mockup is rendered, others are display: none)
    phonesContainer.className = 'phones-showcase focused-mode';
    
    document.querySelectorAll('.phone-mockup').forEach(phone => {
      if (phone.id === `phone-${targetScreen}`) {
        phone.classList.add('active-focus');
      } else {
        phone.classList.remove('active-focus');
      }
    });

    // Sync state with URL Query params for sharing screens
    if (updateURL) {
      const url = new URL(window.location);
      url.searchParams.set('screen', targetScreen);
      window.history.pushState({}, '', url);
    }
    
    // Reset Screen 1 story details if entering intro screen
    if (targetScreen === 'intro') {
      currentStoryStep = 0;
      if (storyTextDisplay) {
        storyTextDisplay.textContent = storyDialogues[0];
        storyTextDisplay.style.opacity = '1';
      }
      if (storyNextBtn) storyNextBtn.classList.remove('hidden-btn');
      if (introStartBtn) introStartBtn.classList.add('hidden-btn');
      if (introHintText) introHintText.textContent = "Tap Continue to read on...";
      
      // Hide Polaroid popup and restore background illustration and avatar on reset
      const storyImageContainer = document.getElementById('story-image-container');
      const introIllustration = document.getElementById('intro-illustration');
      const storyAvatar = document.getElementById('story-avatar-container');
      if (storyImageContainer) storyImageContainer.classList.remove('visible');
      if (introIllustration) introIllustration.classList.remove('dimmed');
      if (storyAvatar) storyAvatar.classList.remove('hidden-avatar');
    }
  }

  // Attach event listeners to mockups for zooming in grid view
  document.querySelectorAll('.phone-mockup').forEach(phone => {
    phone.addEventListener('click', (e) => {
      // Only trigger if in showcase mode
      if (state.currentScreen === 'grid') {
        const screenName = phone.id.replace('phone-', '');
        playClickChime();
        updateRouterView(screenName);
      }
    });
  });

  // Attach navigation triggers inside screens (e.g. Next Screen action buttons)
  document.querySelectorAll('.next-screen-trigger').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation(); // Stop event bubbling to phone frame
      const target = trigger.getAttribute('data-target');
      playClickChime();
      updateRouterView(target);
    });
  });

  // Attach header control deck buttons
  controlButtons.forEach(button => {
    button.addEventListener('click', () => {
      const target = button.id.replace('view-', '').replace('-btn', '');
      playClickChime();
      updateRouterView(target);
    });
  });

  // Popstate event to support browser Back/Forward navigation
  window.addEventListener('popstate', () => {
    readUrlParams();
  });

  function readUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const screenParam = params.get('screen');
    const validScreens = ['intro', 'music', 'gallery', 'steps', 'message'];

    if (screenParam && validScreens.includes(screenParam)) {
      updateRouterView(screenParam, false);
    } else {
      updateRouterView('grid', false);
    }
  }


  // ==========================================================================
  // SCREEN 1: INTRO INTERACTIONS & COZY NARRATIVE STEPPER
  // ==========================================================================
  const introHeart = document.getElementById('intro-heart');
  const introIllustration = document.getElementById('intro-illustration');
  const storyNextBtn = document.getElementById('story-next-btn');
  const storyDialog = document.getElementById('story-dialog');
  const storyTextDisplay = document.getElementById('story-text-display');
  const introStartBtn = document.getElementById('intro-start-btn');
  const introHintText = document.getElementById('intro-hint-text');
  const storyImageContainer = document.getElementById('story-image-container');
  const storyAvatar = document.getElementById('story-avatar-container');

  const storyDialogues = [
    "Welcome Pranjal (goldfish)....",
    "You're probably wondering what on earth this is, aren't you?",
    "But first, let me ask... WHAT IS THIS?? 😂",
    "You see, since you and a certain squishy substance got beef... I wanted to do something about it.",
    "So here we are.... welcome to HEARTSTOPPER.....",
    "Nooo, not the BL but Heartstopper ClayArt class! Shall we begin?"
  ];
  let currentStoryStep = 0;

  function advanceStoryStep() {
    if (currentStoryStep >= storyDialogues.length - 1) return;
    
    currentStoryStep++;
    playClickChime();

    // Trigger wobbly bounce on the girl avatar representation
    const girlBody = document.querySelector('.girl-body');
    if (girlBody) {
      girlBody.style.animation = 'none';
      void girlBody.offsetWidth; // Force layout recalculation
      girlBody.style.animation = 'floatGirl 2s ease-in-out';
      setTimeout(() => {
        girlBody.style.animation = 'floatGirl 7s ease-in-out infinite';
      }, 2000);
    }

    // Toggle Polaroid popup and dim illustration on Step 3 ("WHAT IS THIS??")
    if (storyImageContainer && introIllustration) {
      if (currentStoryStep === 2) {
        storyImageContainer.classList.add('visible');
        introIllustration.classList.add('dimmed');
        if (storyAvatar) storyAvatar.classList.add('hidden-avatar');
      } else {
        storyImageContainer.classList.remove('visible');
        introIllustration.classList.remove('dimmed');
        if (storyAvatar) storyAvatar.classList.remove('hidden-avatar');
      }
    }

    // Fade text transition
    if (storyTextDisplay) {
      storyTextDisplay.style.opacity = '0';
      setTimeout(() => {
        storyTextDisplay.textContent = storyDialogues[currentStoryStep];
        storyTextDisplay.style.opacity = '1';
        
        // At the last step, reveal the START button
        if (currentStoryStep === storyDialogues.length - 1) {
          if (storyNextBtn) storyNextBtn.classList.add('hidden-btn');
          if (introStartBtn) introStartBtn.classList.remove('hidden-btn');
          if (introHintText) introHintText.textContent = "Click START to enter the lab!";
        }
      }, 250);
    }
  }

  // Tapping either the dialogue bubble or the Continue button advances the story
  if (storyNextBtn) {
    storyNextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      advanceStoryStep();
    });
  }
  
  if (storyDialog) {
    storyDialog.addEventListener('click', (e) => {
      e.stopPropagation();
      advanceStoryStep();
    });
  }

  if (introHeart) {
    introHeart.addEventListener('click', (e) => {
      e.stopPropagation();
      playClickChime();
      
      // Add wobbly animation trigger to girl body
      const girlBody = document.querySelector('.girl-body');
      if (girlBody) {
        girlBody.style.animation = 'none';
        void girlBody.offsetWidth; // Trigger reflow
        girlBody.style.animation = 'floatGirl 3s ease-in-out';
        
        // Restore standard slow float after 3s
        setTimeout(() => {
          girlBody.style.animation = 'floatGirl 7s ease-in-out infinite';
        }, 3000);
      }

      // Spark floating pastel hearts
      spawnPastelHearts(e);
    });
  }

  function spawnPastelHearts(event) {
    // Generate lovely flying heart particles
    const container = document.querySelector('#intro-illustration');
    if (!container) return;
    
    // Get mouse position relative to illustration viewport
    const rect = container.getBoundingClientRect();
    const x = rect.width * 0.75; // Approx where the heart SVG sits
    const y = rect.height * 0.2;

    for (let i = 0; i < 6; i++) {
      const heart = document.createElement('div');
      heart.style.position = 'absolute';
      heart.style.left = `${x}px`;
      heart.style.top = `${y}px`;
      heart.style.fontSize = `${Math.random() * 12 + 12}px`;
      heart.style.color = Math.random() > 0.5 ? '#E5B2A9' : '#FADBD8';
      heart.style.pointerEvents = 'none';
      heart.innerHTML = '❤️';
      heart.style.transition = 'all 1.2s cubic-bezier(0.25, 1, 0.5, 1)';
      
      container.appendChild(heart);

      // Force micro-task layout trigger
      setTimeout(() => {
        const driftX = (Math.random() * 160 - 80);
        const driftY = -(Math.random() * 100 + 40);
        heart.style.transform = `translate(${driftX}px, ${driftY}px) scale(0)`;
        heart.style.opacity = '0';
      }, 20);

      // Cleanup
      setTimeout(() => {
        heart.remove();
      }, 1500);
    }
  }


  // ==========================================================================
  // SCREEN 2: MUSIC CONTROLLER & NOTE PARTICLES
  // ==========================================================================
  const playPauseBtn = document.getElementById('play-pause-btn');
  const volumeToggleBtn = document.getElementById('volume-toggle-btn');
  const playText = document.getElementById('play-text');
  const playSvg = document.getElementById('play-svg');
  const pauseSvg = document.getElementById('pause-svg');
  const vinylDisc = document.getElementById('vinyl-disc');
  const toneArm = document.getElementById('tone-arm');
  const wavesContainer = document.getElementById('waves-container');
  const notesSpawner = document.getElementById('notes-spawner');

  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      initAudio();
      
      // If no vinyl is loaded, block playback and prompt the user!
      if (!state.isVinylLoaded) {
        if (!state.isMuted && audioCtx) {
          playSynthNote(150, 'sawtooth', 0.15, 0.05); // Error buzz frequency
        }
        const hintEl = document.querySelector('.headphones-hint');
        if (hintEl) {
          hintEl.textContent = "💿 Please tap a playlist cover below to load a vinyl first!";
          hintEl.style.color = "var(--color-pink-deep)";
          hintEl.style.fontWeight = "700";
          setTimeout(() => {
            hintEl.textContent = "🎧 Best enjoyed with headphones active";
            hintEl.style.color = "";
            hintEl.style.fontWeight = "";
          }, 3000);
        }
        return;
      }

      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      state.isPlayingMusic = !state.isPlayingMusic;
      
      const viewport = document.querySelector('#phone-music .screen-viewport');
      
      if (state.isPlayingMusic) {
        // Play state active
        playText.textContent = "Mute Cozy Beats";
        playSvg.classList.add('hidden-icon');
        pauseSvg.classList.remove('hidden-icon');
        vinylDisc.classList.add('playing');
        toneArm.classList.add('playing');
        wavesContainer.classList.add('playing');
        
        startLoFiSequencer();
      } else {
        // Pause state active
        playText.textContent = "Start Lo-Fi Loop";
        playSvg.classList.remove('hidden-icon');
        pauseSvg.classList.add('hidden-icon');
        vinylDisc.classList.remove('playing');
        toneArm.classList.remove('playing');
        wavesContainer.classList.remove('playing');
        
        stopLoFiSequencer();
      }
    });
  }

  if (volumeToggleBtn) {
    volumeToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      initAudio();
      
      state.isMuted = !state.isMuted;
      
      const audioPlayer = document.getElementById('lofi-audio-player');
      if (audioPlayer) {
        audioPlayer.muted = state.isMuted;
      }
      
      if (state.isMuted) {
        masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
        volumeToggleBtn.style.opacity = '0.5';
      } else {
        masterGain.gain.setValueAtTime(0.22, audioCtx.currentTime);
        volumeToggleBtn.style.opacity = '1';
      }
    });
  }

  function spawnMusicNoteEffect() {
    if (!notesSpawner || !state.isPlayingMusic) return;

    const noteSymbols = ['🎵', '🎶', '✨', '🎶'];
    const symbol = noteSymbols[Math.floor(Math.random() * noteSymbols.length)];
    
    const note = document.createElement('div');
    note.classList.add('floating-note');
    note.innerHTML = symbol;
    
    // Spawn from record center coords (x: 125, y: 140 of SVG)
    // Coords relative to spawner frame
    note.style.left = '45%';
    note.style.top = '50%';
    
    const xDrift = (Math.random() * 120 - 60);
    const yDrift = -(Math.random() * 100 + 100);
    note.style.setProperty('--x-drift', `${xDrift}px`);
    note.style.setProperty('--y-drift', `${yDrift}px`);
    
    notesSpawner.appendChild(note);
    
    // Remove note after animation completes
    setTimeout(() => {
      note.remove();
    }, 4000);
  }

  // Playlist Item Selection Event Handlers
  const playlistStickers = document.querySelectorAll('.playlist-item');
  
  playlistStickers.forEach(sticker => {
    sticker.addEventListener('click', (e) => {
      e.stopPropagation();
      const trackKey = sticker.getAttribute('data-track');
      changeTrack(trackKey);
    });
  });

  function changeTrack(trackKey) {
    if (!synthesizedTracks[trackKey]) return;
    
    const isFirstLoad = !state.isVinylLoaded;
    state.isVinylLoaded = true;

    currentTrackKey = trackKey;
    playClickChime();

    // Synthesize physical record load sounds (satisfying dual clicks)
    if (!state.isMuted && audioCtx) {
      playSynthNote(220, 'triangle', 0.05, 0.04);
      playSynthNote(440, 'sine', 0.12, 0.03, 0.02);
    }

    // Toggle Platter Guide visibility
    const platterGuide = document.getElementById('platter-placeholder');
    if (platterGuide) platterGuide.classList.add('hidden-guide');

    // Toggle Vinyl loaded class and update SVG Image href cover
    const vinylDisc = document.getElementById('vinyl-disc');
    const albumCover = document.getElementById('vinyl-album-cover');
    if (albumCover) {
      albumCover.setAttribute('href', `assets/cover_${trackKey}.png`);
    }
    if (vinylDisc) {
      vinylDisc.classList.add('loaded');
    }

    // Dynamic scrapbook Polaroid update
    const polaroidContainer = document.getElementById('music-polaroid-container');
    const polaroidImg = document.getElementById('music-polaroid-img');
    const polaroidCaption = document.getElementById('music-polaroid-caption');
    if (polaroidImg) {
      polaroidImg.src = `assets/cover_${trackKey}.png`;
    }
    if (polaroidCaption) {
      polaroidCaption.textContent = synthesizedTracks[trackKey].name;
    }
    if (polaroidContainer) {
      polaroidContainer.classList.add('visible');
    }

    // Dynamic viewport background theme changes (apply immediately on track select!)
    const viewport = document.querySelector('#phone-music .screen-viewport');
    if (viewport) {
      // Remove any old theme classes
      viewport.classList.remove('bg-still_with_you', 'bg-rumbling', 'bg-shinunoga_e_wa');
      // Apply the new theme right away — no need to wait for play
      const themeClass = synthesizedTracks[trackKey].themeClass;
      if (themeClass) {
        viewport.classList.add(themeClass);
      }
    }

    // Update track names in UI
    const trackNameEl = document.getElementById('track-name');
    const trackArtistEl = document.querySelector('.track-artist');
    
    if (trackNameEl) trackNameEl.textContent = synthesizedTracks[trackKey].name;
    if (trackArtistEl) trackArtistEl.textContent = synthesizedTracks[trackKey].artist;

    // Toggle active classes on stickers
    playlistStickers.forEach(sticker => {
      if (sticker.getAttribute('data-track') === trackKey) {
        sticker.classList.add('active');
      } else {
        sticker.classList.remove('active');
      }
    });

    // Update Play/Pause button text when a new vinyl is loaded
    if (playText && !state.isPlayingMusic) {
      playText.textContent = "Start Lo-Fi Loop";
    }

    // Color theme change on record player vinyl center label background to match selected song!
    const vinylLabel = document.querySelector('.vinyl-disc circle[r="22"]');
    if (vinylLabel && synthesizedTracks[trackKey].centerColor) {
      vinylLabel.setAttribute('fill', synthesizedTracks[trackKey].centerColor);
    }

    // If music is playing, restart the sequencer to apply the new audio file instantly!
    if (state.isPlayingMusic) {
      stopLoFiSequencer();
      startLoFiSequencer();
    }
  }

  // ==========================================================================
  // SCREEN 3: CREATION PICKER — choose what to sculpt
  // ==========================================================================
  const creationCards = document.querySelectorAll('.creation-card');

  // Step-by-step sculpting data per object aligned to standard gamified flow
  const sculptStepsData = {
    cat: {
      name: 'Cozy Cat', emoji: '🐱',
      caption: 'Momo the sleepy kitty! 🐱💤',
      parts: [
        {
          id: 'break', name: 'Pull off Cream Clay',
          instruction: 'Drag the cream clay chunk to pull it wobbily out from the block! 🤲',
          action: 'pull', actionLabel: 'Drag right to pull clay'
        },
        {
          id: 'knead', name: 'Knead & Soften',
          instruction: 'Warm the chunk and rub it back and forth to knead it into a smooth ball! 🤲',
          action: 'knead', actionLabel: 'Rub back & forth to knead'
        },
        {
          id: 'body', name: 'Plump Body',
          instruction: 'Drag the rolling pin up and down to roll the ball into a cozy oval! 🪵',
          action: 'roll', actionLabel: 'Drag up/down to roll body',
          partSvg: `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="67" rx="34" ry="24" fill="#F0E5D7" stroke="#DBC8B5" stroke-width="2"/></svg>`,
          assembleAt: { x: 50, y: 67 }
        },
        {
          id: 'head_tail', name: 'Head & Tail details',
          instruction: 'Swipe your carving tool to carve wobbly triangle ears, face details, and a cute wobbly tail! 🔪',
          action: 'slice', actionLabel: 'Swipe to carve head & tail',
          subParts: [
            {
              id: 'head', name: 'Head & Face',
              partSvg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="43" r="21" fill="#F0E5D7" stroke="#DBC8B5" stroke-width="2"/><path d="M 33,35 L 30,18 L 42,28 Z" fill="#F0E5D7" stroke="#DBC8B5" stroke-width="2" stroke-linejoin="round"/><path d="M 67,35 L 70,18 L 58,28 Z" fill="#F0E5D7" stroke="#DBC8B5" stroke-width="2" stroke-linejoin="round"/><path d="M 35,30 L 32,21 L 41,26 Z" fill="#E5B2A9"/><path d="M 65,30 L 68,21 L 59,26 Z" fill="#E5B2A9"/><path d="M 40,44 Q 44,48 44,44" stroke="#3D4A41" stroke-width="1.8" stroke-linecap="round" fill="none"/><path d="M 60,44 Q 56,48 56,44" stroke="#3D4A41" stroke-width="1.8" stroke-linecap="round" fill="none"/><circle cx="50" cy="49" r="2" fill="#E5B2A9"/><path d="M 46,52 Q 50,55 54,52" stroke="#3D4A41" stroke-width="1.2" stroke-linecap="round" fill="none"/><ellipse cx="38" cy="48" rx="3" ry="2" fill="#FADBD8" opacity="0.9"/><ellipse cx="62" cy="48" rx="3" ry="2" fill="#FADBD8" opacity="0.9"/></svg>`,
              assembleAt: { x: 50, y: 43 }
            },
            {
              id: 'tail', name: 'Wobbly Tail',
              partSvg: `<svg viewBox="0 0 100 100"><path d="M 72,70 Q 82,62 80,75 Q 78,82 68,78" stroke="#DBC8B5" stroke-width="4.5" stroke-linecap="round" fill="none"/></svg>`,
              assembleAt: { x: 50, y: 50 }
            }
          ]
        },
        {
          id: 'assemble', name: 'Assembly Studio',
          instruction: 'Drag your wobbly body, head, and tail onto the silhouette guide to assemble your Cozy Cat! ✨',
          action: 'assemble', actionLabel: 'Drag parts to silhouette'
        }
      ],
      finalSvg: `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="67" rx="34" ry="24" fill="#F0E5D7" stroke="#DBC8B5" stroke-width="2"/><circle cx="50" cy="43" r="21" fill="#F0E5D7" stroke="#DBC8B5" stroke-width="2"/><path d="M 33,35 L 30,18 L 42,28 Z" fill="#F0E5D7" stroke="#DBC8B5" stroke-width="2" stroke-linejoin="round"/><path d="M 67,35 L 70,18 L 58,28 Z" fill="#F0E5D7" stroke="#DBC8B5" stroke-width="2" stroke-linejoin="round"/><path d="M 35,30 L 32,21 L 41,26 Z" fill="#E5B2A9"/><path d="M 65,30 L 68,21 L 59,26 Z" fill="#E5B2A9"/><path d="M 40,44 Q 44,48 44,44" stroke="#3D4A41" stroke-width="1.8" stroke-linecap="round" fill="none"/><path d="M 60,44 Q 56,48 56,44" stroke="#3D4A41" stroke-width="1.8" stroke-linecap="round" fill="none"/><circle cx="50" cy="49" r="2" fill="#E5B2A9"/><path d="M 46,52 Q 50,55 54,52" stroke="#3D4A41" stroke-width="1.2" stroke-linecap="round" fill="none"/><ellipse cx="38" cy="48" rx="3" ry="2" fill="#FADBD8" opacity="0.9"/><ellipse cx="62" cy="48" rx="3" ry="2" fill="#FADBD8" opacity="0.9"/><path d="M 72,70 Q 82,62 80,75 Q 78,82 68,78" stroke="#DBC8B5" stroke-width="4" stroke-linecap="round" fill="none"/></svg>`
    },
    gojo: {
      name: 'Gojo Chibi', emoji: '⚡',
      caption: 'Gojo-sensei at 100% clay power! ⚡',
      parts: [
        {
          id: 'break', name: 'Pull off Chibi Clay',
          instruction: 'Drag and pull to separate chunks of off-white and dark navy clay wobbily! 🤲',
          action: 'pull', actionLabel: 'Drag right to pull clay'
        },
        {
          id: 'knead', name: 'Knead Chunks',
          instruction: 'Rub both pieces back and forth to knead them into smooth wobbly balls! 🤲',
          action: 'knead', actionLabel: 'Rub back & forth to knead'
        },
        {
          id: 'body', name: 'Robe & Feet',
          instruction: 'Drag the rolling pin to roll navy clay into his uniform block and cute little feet! 🪵',
          action: 'roll', actionLabel: 'Drag up/down to roll robe',
          partSvg: `<svg viewBox="0 0 100 100"><rect x="34" y="64" width="32" height="26" rx="8" fill="#1a2744" stroke="#111d38" stroke-width="1.8"/><path d="M 44,64 L 50,72 L 56,64" fill="#FAF8F4" stroke="#DDD" stroke-width="1"/><ellipse cx="27" cy="72" rx="7" ry="5" fill="#1a2744" stroke="#111d38" stroke-width="1.8" transform="rotate(-20 27 72)"/><ellipse cx="73" cy="72" rx="7" ry="5" fill="#1a2744" stroke="#111d38" stroke-width="1.8" transform="rotate(20 73 72)"/><ellipse cx="40" cy="91" rx="7" ry="4" fill="#1a2744"/><ellipse cx="60" cy="91" rx="7" ry="4" fill="#1a2744"/></svg>`,
          assembleAt: { x: 50, y: 50 }
        },
        {
          id: 'head_details', name: 'Head & Spiky Hair',
          instruction: 'Swipe to carve Gojo\'s spiky white hair, charming smirk, and iconic blindfold! 🔪',
          action: 'slice', actionLabel: 'Swipe to carve head details',
          subParts: [
            {
              id: 'head', name: 'Chibi Head',
              partSvg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="40" r="28" fill="#FAF8F4" stroke="#E0D5C5" stroke-width="1.8"/><path d="M 44,52 Q 50,57 56,52" stroke="#3D4A41" stroke-width="1.8" stroke-linecap="round" fill="none"/><ellipse cx="36" cy="50" rx="4" ry="2.5" fill="#FADBD8" opacity="0.7"/><ellipse cx="64" cy="50" rx="4" ry="2.5" fill="#FADBD8" opacity="0.7"/></svg>`,
              assembleAt: { x: 50, y: 40 }
            },
            {
              id: 'hair', name: 'Hair & Blindfold',
              partSvg: `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="26" rx="26" ry="14" fill="#E8E8F0"/><path d="M 30,28 L 26,10 L 36,22 Z" fill="#E8E8F0" stroke="#CCC" stroke-width="1"/><path d="M 38,22 L 38,6 L 46,20 Z" fill="#E8E8F0" stroke="#CCC" stroke-width="1"/><path d="M 48,20 L 50,4 L 56,18 Z" fill="#E8E8F0" stroke="#CCC" stroke-width="1"/><path d="M 58,22 L 64,8 L 66,24 Z" fill="#E8E8F0" stroke="#CCC" stroke-width="1"/><path d="M 66,28 L 74,14 L 72,30 Z" fill="#E8E8F0" stroke="#CCC" stroke-width="1"/><rect x="24" y="35" width="52" height="11" rx="5.5" fill="#1a1a2e"/><rect x="27" y="37" width="18" height="3" rx="1.5" fill="white" opacity="0.15"/></svg>`,
              assembleAt: { x: 50, y: 50 }
            }
          ]
        },
        {
          id: 'assemble', name: 'Assembly Studio',
          instruction: 'Drag Gojo\'s spiky hair, blindfolded head, and navy uniform to snap them together! ⚡',
          action: 'assemble', actionLabel: 'Drag parts to silhouette'
        }
      ],
      finalSvg: `<svg viewBox="0 0 100 100"><rect x="34" y="64" width="32" height="26" rx="8" fill="#1a2744" stroke="#111d38" stroke-width="1.5"/><path d="M 44,64 L 50,72 L 56,64" fill="#FAF8F4" stroke="#DDD" stroke-width="1"/><ellipse cx="27" cy="72" rx="7" ry="5" fill="#1a2744" stroke="#111d38" stroke-width="1.5" transform="rotate(-20 27 72)"/><ellipse cx="73" cy="72" rx="7" ry="5" fill="#1a2744" stroke="#111d38" stroke-width="1.5" transform="rotate(20 73 72)"/><circle cx="50" cy="40" r="28" fill="#FAF8F4" stroke="#E0D5C5" stroke-width="1.5"/><ellipse cx="50" cy="26" rx="26" ry="14" fill="#E8E8F0"/><path d="M 30,28 L 26,10 L 36,22 Z" fill="#E8E8F0" stroke="#CCC" stroke-width="1"/><path d="M 38,22 L 38,6 L 46,20 Z" fill="#E8E8F0" stroke="#CCC" stroke-width="1"/><path d="M 48,20 L 50,4 L 56,18 Z" fill="#E8E8F0" stroke="#CCC" stroke-width="1"/><path d="M 58,22 L 64,8 L 66,24 Z" fill="#E8E8F0" stroke="#CCC" stroke-width="1"/><path d="M 66,28 L 74,14 L 72,30 Z" fill="#E8E8F0" stroke="#CCC" stroke-width="1"/><rect x="24" y="35" width="52" height="11" rx="5.5" fill="#1a1a2e"/><rect x="27" y="37" width="18" height="3" rx="1.5" fill="white" opacity="0.15"/><path d="M 44,52 Q 50,57 56,52" stroke="#3D4A41" stroke-width="1.5" stroke-linecap="round" fill="none"/><ellipse cx="36" cy="50" rx="4" ry="2.5" fill="#FADBD8" opacity="0.7"/><ellipse cx="64" cy="50" rx="4" ry="2.5" fill="#FADBD8" opacity="0.7"/><ellipse cx="40" cy="91" rx="7" ry="4" fill="#1a2744"/><ellipse cx="60" cy="91" rx="7" ry="4" fill="#1a2744"/></svg>`
    },
    penguin: {
      name: 'Cute Penguin', emoji: '🐧',
      caption: 'Pippin the waddling penguin! 🐧❄️',
      parts: [
        {
          id: 'break', name: 'Pull off Penguin Clay',
          instruction: 'Drag and pull to stretch a navy chunk wobbily off the clay block! 🤲',
          action: 'pull', actionLabel: 'Drag right to pull clay'
        },
        {
          id: 'knead', name: 'Knead Chunks',
          instruction: 'Rub chunks back and forth to knead them into wobbly soft round balls! 🤲',
          action: 'knead', actionLabel: 'Rub back & forth to knead'
        },
        {
          id: 'body', name: 'Chubby Body & Feet',
          instruction: 'Drag rolling pin up/down to shape navy clay into a waddly egg body and little feet! 🪵',
          action: 'roll', actionLabel: 'Drag up/down to roll body',
          partSvg: `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="66" rx="26" ry="28" fill="#1e2235" stroke="#141627" stroke-width="1.8"/><ellipse cx="24" cy="65" rx="8" ry="14" fill="#1e2235" stroke="#141627" stroke-width="1.8" transform="rotate(-15 24 65)"/><ellipse cx="76" cy="65" rx="8" ry="14" fill="#1e2235" stroke="#141627" stroke-width="1.8" transform="rotate(15 76 65)"/><ellipse cx="40" cy="93" rx="9" ry="4" fill="#FF8C42" transform="rotate(-10 40 93)"/><ellipse cx="60" cy="93" rx="9" ry="4" fill="#FF8C42" transform="rotate(10 60 93)"/></svg>`,
          assembleAt: { x: 50, y: 66 }
        },
        {
          id: 'head_details', name: 'Head & Belly',
          instruction: 'Swipe to carve a cute penguin head, flatten a white belly, and shape orange beak! 🔪',
          action: 'slice', actionLabel: 'Swipe to carve belly & face',
          subParts: [
            {
              id: 'belly', name: 'White Belly',
              partSvg: `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="70" rx="16" ry="20" fill="#F7F4EB"/><path d="M 46,40 L 50,47 L 54,40 Z" fill="#FF8C42" stroke="#E07030" stroke-width="1"/></svg>`,
              assembleAt: { x: 50, y: 70 }
            },
            {
              id: 'head', name: 'Penguin Head',
              partSvg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="36" r="20" fill="#1e2235" stroke="#141627" stroke-width="1.8"/><circle cx="43" cy="32" r="6" fill="white"/><circle cx="57" cy="32" r="6" fill="white"/><circle cx="44" cy="33" r="3.5" fill="#1e1e2e"/><circle cx="58" cy="33" r="3.5" fill="#1e1e2e"/><circle cx="45" cy="31" r="1.2" fill="white"/><circle cx="59" cy="31" r="1.2" fill="white"/><ellipse cx="36" cy="38" rx="4" ry="2.5" fill="#FADBD8" opacity="0.8"/><ellipse cx="64" cy="38" rx="4" ry="2.5" fill="#FADBD8" opacity="0.8"/></svg>`,
              assembleAt: { x: 50, y: 36 }
            }
          ]
        },
        {
          id: 'assemble', name: 'Assembly Studio',
          instruction: 'Drag wings, waddling body, white belly, and head onto the silhouette guide! 🐧',
          action: 'assemble', actionLabel: 'Drag parts to silhouette'
        }
      ],
      finalSvg: `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="66" rx="26" ry="28" fill="#1e2235" stroke="#141627" stroke-width="1.5"/><ellipse cx="50" cy="70" rx="16" ry="20" fill="#F7F4EB"/><circle cx="50" cy="36" r="20" fill="#1e2235" stroke="#141627" stroke-width="1.5"/><circle cx="43" cy="32" r="6" fill="white"/><circle cx="57" cy="32" r="6" fill="white"/><circle cx="44" cy="33" r="3.5" fill="#1e1e2e"/><circle cx="58" cy="33" r="3.5" fill="#1e1e2e"/><circle cx="45" cy="31" r="1.2" fill="white"/><circle cx="59" cy="31" r="1.2" fill="white"/><path d="M 46,40 L 50,47 L 54,40 Z" fill="#FF8C42" stroke="#E07030" stroke-width="1"/><ellipse cx="36" cy="38" rx="4" ry="2.5" fill="#FADBD8" opacity="0.8"/><ellipse cx="64" cy="38" rx="4" ry="2.5" fill="#FADBD8" opacity="0.8"/><ellipse cx="24" cy="65" rx="8" ry="14" fill="#1e2235" stroke="#141627" stroke-width="1.5" transform="rotate(-15 24 65)"/><ellipse cx="76" cy="65" rx="8" ry="14" fill="#1e2235" stroke="#141627" stroke-width="1.5" transform="rotate(15 76 65)"/><ellipse cx="40" cy="93" rx="9" ry="4" fill="#FF8C42" transform="rotate(-10 40 93)"/><ellipse cx="60" cy="93" rx="9" ry="4" fill="#FF8C42" transform="rotate(10 60 93)"/></svg>`
    }
  };

  let currentSculptObject = 'cat';
  let currentStepIndex = 0;
  let stepsChecked = [];
  let preparedPartsShelf = []; // Storage for made parts flying to shelf
  let assembledPartsSnaps = {}; // Record of snapped pieces

  // ==========================================================================
  // GAME CANVAS: Interactive Clay Sculpting
  // ==========================================================================
  const gameArea = document.getElementById('game-area');
  const gameActionLabel = document.getElementById('game-action-label');
  const gameCompleteBadge = document.getElementById('game-complete-badge');
  const gameProgressFill = document.getElementById('game-progress-fill');
  const assemblyContainer = document.getElementById('assembly-container');
  const assemblySilhouette = document.getElementById('assembly-silhouette');
  const assemblyPlacedParts = document.getElementById('assembly-placed-parts');
  const shutterFlash = document.getElementById('shutter-flash');
  const polaroidModal = document.getElementById('polaroid-modal');
  let gameListenersSetup = false;

  // Clay SVG interaction state
  let clayState = {
    action: 'break',
    interactions: 0,
    requiredInteractions: 4,
    completed: false,
    isDragging: false,
    lastPointer: null,
    progress: 0,
    transitioning: false,
    tapCount: 0, // Specifically for Break action
    draggedPart: null
  };

  // Creation card click handlers
  creationCards.forEach(card => {
    card.addEventListener('click', () => {
      const obj = card.getAttribute('data-object');
      currentSculptObject = obj;
      currentStepIndex = 0;
      preparedPartsShelf = [];
      assembledPartsSnaps = {};
      stepsChecked = new Array(sculptStepsData[obj].parts.length).fill(false);
      
      // Close polaroid on selection
      if (polaroidModal) polaroidModal.classList.remove('visible');
      if (assemblyContainer) {
        assemblyContainer.style.display = 'none';
        assemblyPlacedParts.innerHTML = '';
      }
      
      playClickChime();
      initStepsScreen(obj);
      updateRouterView('steps');
      
      setTimeout(() => {
        initGameCanvas();
        resetClayState();
      }, 50);
    });
  });

  function initStepsScreen(objKey) {
    const data = sculptStepsData[objKey];
    if (!data) return;

    // Update header
    const emojiEl = document.getElementById('steps-object-emoji');
    const nameEl = document.getElementById('steps-object-name');
    if (emojiEl) emojiEl.textContent = data.emoji;
    if (nameEl) nameEl.textContent = data.name;

    // Clear shelf slots visually
    const shelfSlots = document.getElementById('game-shelf-slots');
    if (shelfSlots) shelfSlots.innerHTML = '';

    // Build progress dots
    const dotsRow = document.getElementById('steps-dots-row');
    if (dotsRow) {
      dotsRow.innerHTML = '';
      data.parts.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = 'step-dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', () => goToStep(i));
        dotsRow.appendChild(dot);
      });
    }

    renderStep(objKey, 0, 'in');
  }

  function renderStep(objKey, stepIdx, direction) {
    const data = sculptStepsData[objKey];
    const part = data.parts[stepIdx];
    if (!part) return;

    const card = document.getElementById('step-card');
    const badge = document.getElementById('step-number-badge');
    const toolTag = document.getElementById('step-tool-tag');
    const instruction = document.getElementById('step-instruction');
    const counter = document.getElementById('step-counter');
    const prevBtn = document.getElementById('step-prev-btn');
    const nextBtn = document.getElementById('step-next-btn');

    // Animate card out first
    if (card) {
      card.classList.add('animating-out');
      setTimeout(() => {
        card.classList.remove('animating-out');
        card.classList.add('animating-in');

        // Update content
        if (badge) badge.textContent = part.name;
        if (toolTag) {
          const toolsList = ["🤲 Raw Hands", "🤲 Warm Palms", "🪵 Rolling Pin", "🔪 Clay Carver", "✨ Silhouette Snap"];
          toolTag.textContent = toolsList[stepIdx] || "✨ Sculpting Studio";
        }
        if (instruction) instruction.textContent = part.instruction;
        if (counter) counter.textContent = `${stepIdx + 1} / ${data.parts.length}`;

        // Reset state for new step
        currentStepIndex = stepIdx;
        resetClayState();

        // Update nav buttons
        if (prevBtn) prevBtn.disabled = stepIdx === 0;
        if (nextBtn) {
          const isLast = stepIdx === data.parts.length - 1;
          nextBtn.classList.toggle('finish', isLast);
          nextBtn.disabled = !stepsChecked[stepIdx];
          
          nextBtn.innerHTML = isLast
            ? `Assemble! <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
            : `Next <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
        }

        // Update progress dots
        updateStepDots(stepIdx, data.parts.length);

        setTimeout(() => card.classList.remove('animating-in'), 20);
      }, 220);
    }
  }

  function updateStepDots(activeIdx, total) {
    const dots = document.querySelectorAll('.step-dot');
    dots.forEach((dot, i) => {
      dot.classList.remove('active', 'done');
      if (i === activeIdx) dot.classList.add('active');
      else if (stepsChecked[i] || i < activeIdx) dot.classList.add('done');
    });
  }

  function goToStep(idx) {
    const total = sculptStepsData[currentSculptObject].parts.length;
    if (idx < 0 || idx >= total) return;
    renderStep(currentSculptObject, idx, idx > currentStepIndex ? 'forward' : 'back');
    playClickChime();
  }

  // Step navigation buttons
  const stepPrevBtn = document.getElementById('step-prev-btn');
  const stepNextBtn = document.getElementById('step-next-btn');
  const stepsBackBtn = document.getElementById('steps-back-btn');
  
  if (stepNextBtn) {
    stepNextBtn.addEventListener('click', () => {
      const total = sculptStepsData[currentSculptObject].parts.length;
      if (currentStepIndex < total - 1) {
        goToStep(currentStepIndex + 1);
      } else {
        // Last step completed -> Snap polarization photo!
        triggerCameraShutterSnap();
      }
    });
  }

  if (stepPrevBtn) {
    stepPrevBtn.addEventListener('click', () => {
      if (currentStepIndex > 0) {
        goToStep(currentStepIndex - 1);
      }
    });
  }

  if (stepsBackBtn) {
    stepsBackBtn.addEventListener('click', () => {
      playClickChime();
      updateRouterView('gallery');
    });
  }

  function initGameCanvas() {
    if (!gameArea) return;
    setupGameListeners();
  }

  function getClayGradientDef() {
    if (currentSculptObject === 'cat') {
      return `
        <linearGradient id="clay-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FAF8F4" />
          <stop offset="50%" stop-color="#FAF0DD" />
          <stop offset="100%" stop-color="#F4DCD6" />
        </linearGradient>
      `;
    } else if (currentSculptObject === 'gojo') {
      return `
        <linearGradient id="clay-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FAF8F4" />
          <stop offset="60%" stop-color="#3E517A" />
          <stop offset="100%" stop-color="#1a2744" />
        </linearGradient>
      `;
    } else { // penguin
      return `
        <linearGradient id="clay-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e2235" />
          <stop offset="50%" stop-color="#FFBD59" />
          <stop offset="100%" stop-color="#FF8C42" />
        </linearGradient>
      `;
    }
  }

  function resetClayState() {
    if (!gameArea || clayState.transitioning) return;
    const part = sculptStepsData[currentSculptObject]?.parts[currentStepIndex];
    clayState.action = part?.action || 'pull';
    clayState.interactions = 0;
    clayState.requiredInteractions = (clayState.action === 'pull') ? 60 : 65;
    clayState.completed = stepsChecked[currentStepIndex] || false;
    clayState.isDragging = false;
    clayState.progress = clayState.completed ? 1 : 0;
    clayState.tapCount = 0;

    if (gameActionLabel) gameActionLabel.textContent = part?.actionLabel || '';
    if (gameCompleteBadge) {
      if (clayState.completed) gameCompleteBadge.classList.add('visible');
      else gameCompleteBadge.classList.remove('visible');
    }
    if (gameProgressFill) gameProgressFill.style.width = (clayState.progress * 100) + '%';

    // Hide active tools initially
    const pin = document.getElementById('game-rolling-pin');
    const knife = document.getElementById('game-clay-knife');
    const hand = document.getElementById('knead-hand');
    if (pin) pin.classList.remove('active');
    if (knife) knife.classList.remove('active');
    if (hand) hand.classList.remove('active');

    // Handle Assembly screen toggle
    if (clayState.action === 'assemble') {
      if (assemblyContainer) {
        assemblyContainer.style.display = 'flex';
        // Inject grey dashed silhouette
        if (assemblySilhouette) {
          assemblySilhouette.innerHTML = sculptStepsData[currentSculptObject].finalSvg;
        }
      }
      // Remove any hovering main clay SVGs
      const existingSvg = gameArea.querySelector('.game-clay-svg');
      if (existingSvg) existingSvg.remove();
      
      // Hide progress bar for assembly
      const prog = gameArea.querySelector('.game-progress-bar');
      if (prog) prog.style.display = 'none';

      // Repopulate shelf slots with wobbly prepared parts
      repopulatePartsOnShelf();
      return;
    } else {
      if (assemblyContainer) assemblyContainer.style.display = 'none';
      const prog = gameArea.querySelector('.game-progress-bar');
      if (prog) prog.style.display = 'block';
      
      // Repopulate shelf slots with prepared parts during active steps too!
      repopulatePartsOnShelf();
    }

    // Transition out old SVG, then bring in new game-canvas representation
    const existingSvg = gameArea.querySelector('.game-clay-svg');
    if (existingSvg) {
      clayState.transitioning = true;
      existingSvg.classList.add('transitioning');
      setTimeout(() => {
        existingSvg.remove();
        injectInteractiveClayGraphic();
        clayState.transitioning = false;
      }, 400);
    } else {
      injectInteractiveClayGraphic();
    }
  }

  function injectInteractiveClayGraphic() {
    const wrapper = document.createElement('div');
    wrapper.className = 'game-clay-svg floating-bob';
    
    // Choose wobbly game graphic depending on step action type
    const colors = { cat: '#F0E5D7', gojo: '#FAF8F4', penguin: '#1e2235' };
    const borderColors = { cat: '#DBC8B5', gojo: '#E0D5C5', penguin: '#141627' };
    const border = borderColors[currentSculptObject] || '#DBC8B5';

    let graphicMarkup = '';

    if (clayState.action === 'pull') {
      // Left block, right chunk, connecting wobbly sticky neck
      graphicMarkup = `
        <svg viewBox="0 0 120 100">
          <defs>
            ${getClayGradientDef()}
          </defs>
          <!-- Left Main Block -->
          <path id="pull-left-block" d="M 12,24 Q 25,18 36,24 Q 45,40 38,76 Q 20,84 14,72 Z" fill="url(#clay-grad)" stroke="${border}" stroke-width="2.5" />
          <!-- Wobbly connecting sticky neck -->
          <path id="pull-connecting-neck" d="M 30,35 Q 40,40 45,45 Q 40,55 30,60" fill="url(#clay-grad)" stroke="none" />
          <!-- Right chunk being pulled off -->
          <circle id="pull-right-chunk" cx="45" cy="48" r="14" fill="url(#clay-grad)" stroke="${border}" stroke-width="2.5" />
        </svg>
      `;
    } else if (clayState.action === 'knead') {
      // Rough cracked raw chunk
      graphicMarkup = `<svg viewBox="0 0 100 100"><defs>${getClayGradientDef()}</defs><path d="M 28,34 Q 45,22 66,30 Q 82,46 68,66 Q 44,78 28,62 Q 18,44 28,34 Z" fill="url(#clay-grad)" stroke="${border}" stroke-width="4.5"/></svg>`;
    } else if (clayState.action === 'roll') {
      // Smooth round ball before rolling
      graphicMarkup = `<svg viewBox="0 0 100 100"><defs>${getClayGradientDef()}</defs><circle cx="50" cy="50" r="28" fill="url(#clay-grad)" stroke="${border}" stroke-width="4.5"/></svg>`;
    } else if (clayState.action === 'slice') {
      // Shaped rolled block waiting for carvings
      if (currentSculptObject === 'cat') {
        graphicMarkup = `<svg viewBox="0 0 100 100"><defs>${getClayGradientDef()}</defs><ellipse cx="50" cy="58" rx="32" ry="24" fill="url(#clay-grad)" stroke="${border}" stroke-width="4.5"/></svg>`;
      } else if (currentSculptObject === 'gojo') {
        graphicMarkup = `<svg viewBox="0 0 100 100"><defs>${getClayGradientDef()}</defs><circle cx="50" cy="46" r="26" fill="url(#clay-grad)" stroke="${border}" stroke-width="4.5"/></svg>`;
      } else {
        graphicMarkup = `<svg viewBox="0 0 100 100"><defs>${getClayGradientDef()}</defs><ellipse cx="50" cy="58" rx="24" ry="28" fill="url(#clay-grad)" stroke="${border}" stroke-width="4.5"/></svg>`;
      }
    }

    wrapper.innerHTML = graphicMarkup;
    wrapper.style.width = '150px';
    wrapper.style.height = '150px';
    wrapper.style.position = 'absolute';

    const svgEls = wrapper.querySelectorAll('svg');
    svgEls.forEach(svgEl => {
      svgEl.style.width = '100%';
      svgEl.style.height = '100%';
      svgEl.style.position = 'absolute';
      svgEl.style.top = '0';
      svgEl.style.left = '0';
      svgEl.style.filter = 'drop-shadow(0 6px 16px rgba(61,74,65,0.18))';
    });

    // Insert wrapper cleanly
    gameArea.insertBefore(wrapper, gameArea.querySelector('.game-progress-bar').nextSibling);
    
    // Auto-reveal if step was already completed in past
    if (clayState.completed) {
      if (gameProgressFill) gameProgressFill.style.width = '100%';
      transformClayToFinishedStepGraphic();
    }
  }

  function transformClayToFinishedStepGraphic() {
    const svgWrapper = gameArea.querySelector('.game-clay-svg');
    if (!svgWrapper) return;

    const part = sculptStepsData[currentSculptObject].parts[currentStepIndex];
    const colors = { cat: '#F0E5D7', gojo: '#FAF8F4', penguin: '#1e2235' };
    const borderColors = { cat: '#DBC8B5', gojo: '#E0D5C5', penguin: '#141627' };
    const border = borderColors[currentSculptObject] || '#DBC8B5';

    if (clayState.action === 'pull') {
      svgWrapper.innerHTML = `
        <svg viewBox="0 0 120 100">
          <defs>
            ${getClayGradientDef()}
          </defs>
          <path d="M 12,24 Q 25,18 36,24 Q 45,40 38,76 Q 20,84 14,72 Z" fill="url(#clay-grad)" stroke="${border}" stroke-width="2.5" />
          <circle cx="88" cy="48" r="14" fill="url(#clay-grad)" stroke="${border}" stroke-width="2.5" />
        </svg>
      `;
    } else if (clayState.action === 'knead') {
      // Smooth ball
      svgWrapper.innerHTML = `<svg viewBox="0 0 100 100"><defs>${getClayGradientDef()}</defs><circle cx="50" cy="50" r="28" fill="url(#clay-grad)" stroke="${border}" stroke-width="4.5"/></svg>`;
    } else if (clayState.action === 'roll') {
      // Body part
      svgWrapper.innerHTML = part.partSvg;
    } else if (clayState.action === 'slice') {
      // Detailed head & parts
      svgWrapper.innerHTML = part.subParts ? part.subParts.map(p => p.partSvg).join('') : '';
    }
    
    // Set fixed dimensions on the wrapper to allow perfect absolute overlay of SVGs!
    svgWrapper.style.width = '150px';
    svgWrapper.style.height = '150px';
    svgWrapper.style.position = 'absolute';

    const svgEls = svgWrapper.querySelectorAll('svg');
    svgEls.forEach(svgEl => {
      svgEl.style.width = '100%';
      svgEl.style.height = '100%';
      svgEl.style.position = 'absolute';
      svgEl.style.top = '0';
      svgEl.style.left = '0';
      svgEl.style.filter = 'drop-shadow(0 6px 16px rgba(61,74,65,0.18))';
    });
  }

  function updatePullStretchSVG(progress) {
    const rightChunk = document.getElementById('pull-right-chunk');
    const neck = document.getElementById('pull-connecting-neck');
    if (!rightChunk || !neck) return;
    
    const cx = 45 + progress * 43;
    rightChunk.setAttribute('cx', cx);
    
    const halfHeight = Math.max(1.5, 12.5 * (1 - progress));
    const neckTop = 48 - halfHeight;
    const neckBottom = 48 + halfHeight;
    
    const pathD = `M 30,35 Q 40,${neckTop} ${cx - 4},${neckTop + 2} Q ${cx - 4},${neckBottom - 2} 30,60 Z`;
    neck.setAttribute('d', pathD);
    
    const svgWrapper = gameArea.querySelector('.game-clay-svg');
    if (svgWrapper) {
      svgWrapper.style.transform = `translate(-50%, -50%) rotate(${progress * 6}deg)`;
    }
  }

    function setupGameListeners() {
    if (!gameArea || gameListenersSetup) return;
    gameListenersSetup = true;

    // Track active drag targets for custom pointer drag-drop assembly
    let isDraggingShelfPart = false;
    let activeDragClone = null;
    let activeDragData = null;

    gameArea.addEventListener('pointerdown', (e) => {
      // Check if clicking a shelf part during assembly stage
      const shelfPart = e.target.closest('.game-shelf-part');
      if (clayState.action === 'assemble' && shelfPart) {
        e.preventDefault();
        const pId = shelfPart.getAttribute('data-part-id');
        const list = sculptStepsData[currentSculptObject].parts;
        // Find part data inside sculptStepsData
        let pData = null;
        for (let p of list) {
          if (p.id === pId) pData = p;
          if (p.subParts) {
            const sub = p.subParts.find(sp => sp.id === pId);
            if (sub) pData = sub;
          }
        }

        if (!pData) return;

        isDraggingShelfPart = true;
        activeDragData = pData;
        
        // Grab and pop sound
        playClickChime();

        // Create a dragging clone
        activeDragClone = document.createElement('div');
        activeDragClone.className = 'dragging-clone';
        activeDragClone.innerHTML = pData.partSvg;
        
        const rect = gameArea.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        activeDragClone.style.left = x + 'px';
        activeDragClone.style.top = y + 'px';

        gameArea.appendChild(activeDragClone);
        gameArea.setPointerCapture(e.pointerId);
        
        shelfPart.style.opacity = '0.01'; // Fully hide in shelf, replaced by clone!
        clayState.draggedPart = shelfPart;
        return;
      }

      if (clayState.completed || clayState.transitioning || clayState.action === 'assemble') return;
      e.preventDefault();
      gameArea.setPointerCapture(e.pointerId);
      clayState.isDragging = true;

      const rect = gameArea.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      clayState.lastPointer = { x: clickX, y: clickY };

      if (clayState.action === 'pull') {
        clayState.startX = clickX;
        playClickChime();
      }

      const pin = document.getElementById('game-rolling-pin');
      const knife = document.getElementById('game-clay-knife');
      const hand = document.getElementById('knead-hand');

      if (clayState.action === 'knead') {
        if (hand) {
          hand.classList.add('active');
          hand.style.left = clickX + 'px';
          hand.style.top = clickY + 'px';
        }
      } else if (clayState.action === 'roll') {
        if (pin) {
          pin.classList.add('active');
          pin.style.left = clickX + 'px';
          pin.style.top = clickY + 'px';
        }
      } else if (clayState.action === 'slice') {
        if (knife) {
          knife.classList.add('active');
          knife.style.left = clickX + 'px';
          knife.style.top = clickY + 'px';
        }
      }
    });

    gameArea.addEventListener('pointermove', (e) => {
      // Drag Clone following pointer
      if (isDraggingShelfPart && activeDragClone) {
        e.preventDefault();
        const rect = gameArea.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        activeDragClone.style.left = x + 'px';
        activeDragClone.style.top = y + 'px';
        return;
      }

      if (!clayState.isDragging || clayState.completed || clayState.transitioning || clayState.action === 'assemble') return;
      e.preventDefault();

      const rect = gameArea.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      const pin = document.getElementById('game-rolling-pin');
      const knife = document.getElementById('game-clay-knife');
      const hand = document.getElementById('knead-hand');
      
      if (clayState.action === 'pull') {
        const deltaX = Math.max(0, currentX - clayState.startX);
        const progress = Math.min(deltaX / 90, 1);
        clayState.progress = progress;
        clayState.interactions = Math.floor(progress * clayState.requiredInteractions);
        
        if (gameProgressFill) gameProgressFill.style.width = (progress * 100) + '%';
        
        updatePullStretchSVG(progress);
        
        if (progress >= 1 && !clayState.completed) {
          completeActiveClayStep();
        }
        return;
      }
      
      const dx = currentX - clayState.lastPointer.x;
      const dy = currentY - clayState.lastPointer.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Track carving tool visuals
      if (clayState.action === 'knead' && hand) {
        hand.style.left = currentX + 'px';
        hand.style.top = currentY + 'px';
      } else if (clayState.action === 'roll' && pin) {
        pin.style.left = currentX + 'px';
        pin.style.top = currentY + 'px';
      } else if (clayState.action === 'slice' && knife) {
        knife.style.left = currentX + 'px';
        knife.style.top = currentY + 'px';
      }

      if (dist > 15) {
        clayState.interactions++;
        playSculptChime(clayState.interactions);
        addInteractionRipple(currentX, currentY);
        addSparkles(currentX, currentY, 2);
        pulseSvg();

        // Morph clay SVG scales dynamically for game vibe!
        const svgWrapper = gameArea.querySelector('.game-clay-svg');
        if (svgWrapper) {
          if (clayState.action === 'knead') {
            const scaleX = 1 + Math.sin(clayState.interactions * 0.5) * 0.08;
            const scaleY = 1 + Math.cos(clayState.interactions * 0.5) * 0.08;
            svgWrapper.style.transform = `translate(-50%, -50%) scale(${scaleX}, ${scaleY})`;
          } else if (clayState.action === 'roll') {
            // Elongate oval matching rolling pin direction
            const rollFactor = Math.min(clayState.interactions / 50, 0.45);
            svgWrapper.style.transform = `translate(-50%, -50%) scale(${1 + rollFactor}, ${1 - rollFactor * 0.4})`;
          } else if (clayState.action === 'slice') {
            // Skew wobbily during knife slicing
            svgWrapper.style.transform = `translate(-50%, -50%) rotate(${Math.sin(clayState.interactions) * 6}deg)`;
          }
        }

        const progress = Math.min(clayState.interactions / clayState.requiredInteractions, 1);
        if (gameProgressFill) gameProgressFill.style.width = (progress * 100) + '%';

        if (clayState.interactions >= clayState.requiredInteractions) {
          completeActiveClayStep();
        }
        clayState.lastPointer = { x: currentX, y: currentY };
      }
    });

    gameArea.addEventListener('pointerup', (e) => {
      // Snapping coordinate check on pointerup
      if (isDraggingShelfPart && activeDragClone) {
        isDraggingShelfPart = false;
        gameArea.releasePointerCapture(e.pointerId);
        
        const rect = gameArea.getBoundingClientRect();
        const dropX = e.clientX - rect.left;
        const dropY = e.clientY - rect.top;

        // Silhouette bounds check
        const silhouette = document.getElementById('assembly-silhouette');
        const silRect = silhouette.getBoundingClientRect();
        const silLeft = silRect.left - rect.left;
        const silTop = silRect.top - rect.top;

        // Scale factors: calculated relative to actual silhouette client size (100% of game area)
        const targetX = silLeft + (silRect.width * activeDragData.assembleAt.x / 100);
        const targetY = silTop + (silRect.height * activeDragData.assembleAt.y / 100);

        const distance = Math.sqrt((dropX - targetX) ** 2 + (dropY - targetY) ** 2);

        if (distance < 28) {
          // satisfy drop collision snapping!
          snapShelfPartIntoSilhouette(activeDragData);
          if (clayState.draggedPart) clayState.draggedPart.remove();
          
          activeDragClone.remove();
          activeDragClone = null;
          activeDragData = null;
          clayState.draggedPart = null;
        } else {
          // Smooth bounce/slide back to its original shelf slot!
          const shelfPart = clayState.draggedPart;
          const clone = activeDragClone;
          
          if (shelfPart && clone) {
            clone.classList.add('slide-back');
            
            // Get shelf slot center coords relative to gameArea bounds
            const shelfRect = shelfPart.getBoundingClientRect();
            const areaRect = gameArea.getBoundingClientRect();
            const slotX = shelfRect.left - areaRect.left + shelfRect.width / 2;
            const slotY = shelfRect.top - areaRect.top + shelfRect.height / 2;
            
            clone.style.left = slotX + 'px';
            clone.style.top = slotY + 'px';
            
            setTimeout(() => {
              clone.remove();
              shelfPart.style.opacity = '1';
            }, 450);
          } else {
            if (clone) clone.remove();
          }
          
          activeDragClone = null;
          activeDragData = null;
          clayState.draggedPart = null;
        }
        return;
      }

      if (!clayState.isDragging) return;
      clayState.isDragging = false;
      clayState.lastPointer = null;

      // Hide tools
      const pin = document.getElementById('game-rolling-pin');
      const knife = document.getElementById('game-clay-knife');
      const hand = document.getElementById('knead-hand');
      if (pin) pin.classList.remove('active');
      if (knife) knife.classList.remove('active');
      if (hand) hand.classList.remove('active');

      // Return clay to standard floating bob on let-go
      const svgWrapper = gameArea.querySelector('.game-clay-svg');
      if (svgWrapper && !clayState.completed) {
        svgWrapper.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        svgWrapper.style.transform = 'translate(-50%, -50%) scale(1)';
      }
    });

    gameArea.addEventListener('pointercancel', () => {
      if (activeDragClone) {
        activeDragClone.remove();
        activeDragClone = null;
        if (clayState.draggedPart) clayState.draggedPart.style.opacity = '1';
      }
      isDraggingShelfPart = false;
      clayState.isDragging = false;
    });
  }

    function snapShelfPartIntoSilhouette(partData) {
    playPopChime();
    assembledPartsSnaps[partData.id] = true;

    // Inject piece into snap area
    const snapPiece = document.createElement('div');
    snapPiece.className = 'assembly-placed-part';
    snapPiece.innerHTML = partData.partSvg;
    
    if (assemblyPlacedParts) {
      assemblyPlacedParts.appendChild(snapPiece);
      
      // Satisfying pop sparkles on target coords
      const rect = assemblySilhouette.getBoundingClientRect();
      const areaRect = gameArea.getBoundingClientRect();
      const px = rect.left - areaRect.left + (rect.width * partData.assembleAt.x / 100);
      const py = rect.top - areaRect.top + (rect.height * partData.assembleAt.y / 100);
      addSparkles(px, py, 6);
      addInteractionRipple(px, py);
    }

    // Verify if all required pieces have snapped
    const data = sculptStepsData[currentSculptObject];
    const totalRequired = countTotalAssembleParts(data);
    const currentlySnapped = Object.keys(assembledPartsSnaps).length;

    if (currentlySnapped >= totalRequired) {
      // Assembly completed successfully!
      stepsChecked[currentStepIndex] = true;
      updateStepDots(currentStepIndex, data.parts.length);
      
      const nextBtn = document.getElementById('step-next-btn');
      if (nextBtn) nextBtn.disabled = false;

      if (gameCompleteBadge) gameCompleteBadge.classList.add('visible');
      if (gameActionLabel) gameActionLabel.textContent = "Masterpiece Assembled! Tap Assemble to snap Polaroid! 📸";
      
      // Auto-trigger snap celebration immediately for wow effect!
      setTimeout(() => {
        triggerCameraShutterSnap();
      }, 1000);
    }
  }

  function countTotalAssembleParts(creationData) {
    let count = 0;
    creationData.parts.forEach(p => {
      if (p.partSvg) count++;
      if (p.subParts) count += p.subParts.length;
    });
    return count;
  }

  function repopulatePartsOnShelf() {
    const slots = document.getElementById('game-shelf-slots');
    if (!slots) return;
    slots.innerHTML = '';

    preparedPartsShelf.forEach(part => {
      const slot = document.createElement('div');
      slot.className = 'game-shelf-part';
      slot.setAttribute('data-part-id', part.id);
      slot.title = part.name;
      slot.innerHTML = part.partSvg;
      slots.appendChild(slot);
    });
  }

  function completeActiveClayStep() {
    clayState.completed = true;
    stepsChecked[currentStepIndex] = true;
    
    // Save parts flying up to storage shelf
    const part = sculptStepsData[currentSculptObject].parts[currentStepIndex];
    if (part.partSvg) {
      preparedPartsShelf.push({ id: part.id, name: part.name, partSvg: part.partSvg });
    }
    if (part.subParts) {
      part.subParts.forEach(sp => {
        preparedPartsShelf.push({ id: sp.id, name: sp.name, partSvg: sp.partSvg });
      });
    }

    updateStepDots(currentStepIndex, sculptStepsData[currentSculptObject].parts.length);
    if (gameProgressFill) gameProgressFill.style.width = '100%';
    if (gameCompleteBadge) gameCompleteBadge.classList.add('visible');

    // Trigger wobbly scale and chime on completion
    playPopChime();
    const rect = gameArea.getBoundingClientRect();
    addSparkles(rect.width / 2, rect.height * 0.55, 8);

    // Swap graphics to clean wobbly shapes
    transformClayToFinishedStepGraphic();

    // Enable next button immediately so they can skip if they want
    const nextBtn = document.getElementById('step-next-btn');
    if (nextBtn) nextBtn.disabled = false;

    // Fly animation to shelf (triggered after a satisfying 950ms delay so user can admire their work!)
    const svgWrapper = gameArea.querySelector('.game-clay-svg');
    if (svgWrapper && (part.partSvg || part.subParts)) {
      setTimeout(() => {
        // Start zero-G flight takeoff!
        svgWrapper.classList.remove('floating-bob');
        svgWrapper.classList.add('fly-to-shelf');
        svgWrapper.style.animation = 'none';
        svgWrapper.offsetHeight; // trigger reflow
        svgWrapper.style.animation = 'flyToShelf 0.65s cubic-bezier(0.25, 1, 0.35, 1) forwards';
        
        // Update shelf and trigger landing sparkles exactly when it lands (650ms flight duration)!
        setTimeout(() => {
          repopulatePartsOnShelf();
          svgWrapper.remove();
          
          // Spawn beautiful landing sparkles and chime on the shelf slot!
          const shelfSlots = document.getElementById('game-shelf-slots');
          if (shelfSlots) {
            // Find all matching part elements we just added (supports subparts!)
            const pIds = part.subParts ? part.subParts.map(sp => sp.id) : [part.id];
            pIds.forEach(pId => {
              const slotEl = shelfSlots.querySelector(`.game-shelf-part[data-part-id="${pId}"]`);
              if (slotEl) {
                const slotRect = slotEl.getBoundingClientRect();
                const areaRect = gameArea.getBoundingClientRect();
                const sx = slotRect.left - areaRect.left + slotRect.width / 2;
                const sy = slotRect.top - areaRect.top + slotRect.height / 2;
                addSparkles(sx, sy, 6);
                if (!state.isMuted && audioCtx) {
                  playSynthNote(980 + Math.random() * 200, 'sine', 0.04, 0.05); // Play a cute high landing pop chime!
                }
              }
            });
          }
        }, 650);
      }, 950);
    } else {
      repopulatePartsOnShelf();
    }
  }

  function triggerCameraShutterSnap() {
    if (!shutterFlash || !polaroidModal) return;

    // Synthesize shutter click sequence
    initAudio();
    if (!state.isMuted && audioCtx) {
      const now = audioCtx.currentTime;
      // High click sound
      playSynthNote(1200, 'sine', 0.05, 0.08);
      // Wind-down lo-fi gear slide
      playSynthNote(180, 'triangle', 0.25, 0.05, 0.04);
    }

    // Shutter camera flash overlay
    shutterFlash.classList.add('flash-active');
    setTimeout(() => {
      shutterFlash.classList.remove('flash-active');
    }, 550);

    // Pop final SVG into wobbly Polaroid modal
    const finalPhoto = document.getElementById('polaroid-modal-photo');
    const finalCaption = document.getElementById('polaroid-modal-caption');
    const finalData = sculptStepsData[currentSculptObject];
    
    if (finalPhoto) finalPhoto.innerHTML = finalData.finalSvg;
    if (finalCaption) finalCaption.textContent = finalData.caption;

    // Display overlay wobbily
    polaroidModal.classList.add('visible');

    // Trigger gorgeous, weightless pastel confetti shower!
    triggerConfettiCelebration();
  }

  function triggerConfettiCelebration() {
    const container = document.getElementById('steps-viewport') || document.body;
    if (!container) return;

    const colors = ['#E5B2A9', '#FADBD8', '#D5E5D5', '#EAE5DA', '#FFD1D1', '#FFF5E4'];
    const shapes = ['circle', 'square', 'triangle'];

    for (let i = 0; i < 48; i++) {
      const p = document.createElement('div');
      p.className = 'confetti-particle';
      
      const size = Math.random() * 8 + 6; // Cozy small sizes
      const color = colors[Math.floor(Math.random() * colors.length)];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      
      p.style.position = 'absolute';
      p.style.width = size + 'px';
      p.style.height = (shape === 'circle' ? size : size * 1.5) + 'px';
      p.style.background = color;
      p.style.left = (Math.random() * 100) + '%';
      p.style.top = '-20px';
      p.style.zIndex = '150';
      p.style.pointerEvents = 'none';
      
      if (shape === 'circle') {
        p.style.borderRadius = '50%';
      } else if (shape === 'triangle') {
        p.style.background = 'none';
        p.style.width = '0';
        p.style.height = '0';
        p.style.borderLeft = (size / 2) + 'px solid transparent';
        p.style.borderRight = (size / 2) + 'px solid transparent';
        p.style.borderBottom = size + 'px solid ' + color;
      } else {
        p.style.borderRadius = '2px';
      }

      // Physics random variables
      const delay = Math.random() * 1.2;
      const duration = Math.random() * 2.5 + 2.5; // Fall duration between 2.5s and 5s
      const drift = (Math.random() * 120 - 60) + 'px';
      const rotation = (Math.random() * 360 + 360) + 'deg';

      p.style.setProperty('--drift-x', drift);
      p.style.setProperty('--rotate-z', rotation);
      p.style.animation = `confettiFall ${duration}s cubic-bezier(0.25, 1, 0.5, 1) ${delay}s forwards`;

      container.appendChild(p);

      // Clean up DOM after animation completes
      setTimeout(() => {
        p.remove();
      }, (duration + delay) * 1000 + 100);
    }
  }

  // Polaroid Modal Action buttons
  const polaroidShareBtn = document.getElementById('polaroid-share-btn');
  const polaroidRestartBtn = document.getElementById('polaroid-restart-btn');

  if (polaroidShareBtn) {
    polaroidShareBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      playClickChime();
      
      // Generate lovely click feedback toast
      const shareToast = document.createElement('div');
      shareToast.style.position = 'absolute';
      shareToast.style.bottom = '12%';
      shareToast.style.left = '50%';
      shareToast.style.transform = 'translateX(-50%) scale(0.9)';
      shareToast.style.background = 'rgba(61, 74, 65, 0.85)';
      shareToast.style.color = '#FAF8F4';
      shareToast.style.padding = '8px 16px';
      shareToast.style.borderRadius = '20px';
      shareToast.style.fontSize = '0.72rem';
      shareToast.style.fontFamily = 'var(--font-display)';
      shareToast.style.zIndex = '200';
      shareToast.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
      shareToast.innerHTML = '✨ Copied Polaroid for Pranjal! 📋';
      
      polaroidModal.appendChild(shareToast);
      
      setTimeout(() => {
        shareToast.style.transform = 'translateX(-50%) scale(1)';
      }, 10);

      setTimeout(() => {
        shareToast.style.opacity = '0';
        setTimeout(() => shareToast.remove(), 300);
      }, 2000);
    });
  }

  if (polaroidRestartBtn) {
    polaroidRestartBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      playClickChime();
      
      // Clean up modal overlay, clear assembly placements, go back to picker gallery!
      polaroidModal.classList.remove('visible');
      if (assemblyContainer) {
        assemblyContainer.style.display = 'none';
        assemblyPlacedParts.innerHTML = '';
      }
      preparedPartsShelf = [];
      assembledPartsSnaps = {};
      
      updateRouterView('gallery');
    });
  }

  function addInteractionRipple(x, y) {
    const ripple = document.createElement('div');
    ripple.className = 'game-ripple';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.style.width = '30px';
    ripple.style.height = '30px';
    gameArea.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  }

  function addSparkles(x, y, count) {
    const colors = ['#E5B2A9', '#8FA499', '#DBC8B5', '#FADBD8'];
    for (let i = 0; i < count; i++) {
      const spark = document.createElement('div');
      spark.className = 'game-sparkle';
      spark.style.left = (x + (Math.random() - 0.5) * 30) + 'px';
      spark.style.top = (y + (Math.random() - 0.5) * 30) + 'px';
      spark.style.background = colors[Math.floor(Math.random() * colors.length)];
      spark.style.width = (3 + Math.random() * 4) + 'px';
      spark.style.height = spark.style.width;
      gameArea.appendChild(spark);
      setTimeout(() => spark.remove(), 750);
    }
  }

  function pulseSvg() {
    const svgWrapper = gameArea.querySelector('.game-clay-svg');
    if (!svgWrapper) return;
    svgWrapper.style.transition = 'transform 0.08s ease';
    svgWrapper.style.transform = 'translate(-50%, -50%) scale(1.06)';
    setTimeout(() => {
      svgWrapper.style.transition = 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)';
      if (!clayState.isDragging) svgWrapper.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 90);
  }

  // Floating Return Button handler
  const returnGridBtn = document.getElementById('return-grid-btn');
  if (returnGridBtn) {
    returnGridBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      playClickChime();
      updateRouterView('grid');
    });
  }

  // --- AUTHOR MESSAGE SCREEN EVENT HANDLERS ---
  const polaroidMessageBtn = document.getElementById('polaroid-message-btn');
  const messageYesBtn = document.getElementById('message-yes-btn');
  const messageTimeBtn = document.getElementById('message-time-btn');

  if (polaroidMessageBtn) {
    polaroidMessageBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      playClickChime();
      polaroidModal.classList.remove('visible'); // Close modal
      updateRouterView('message'); // Navigate to message screen!
    });
  }

  if (messageYesBtn) {
    messageYesBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      playPopChime();
      
      // Warm happy synthesized chord progression!
      if (!state.isMuted && audioCtx) {
        playSynthNote(523.25, 'sine', 0.15, 0.15); // C5
        setTimeout(() => playSynthNote(659.25, 'sine', 0.15, 0.15), 120); // E5
        setTimeout(() => playSynthNote(783.99, 'sine', 0.15, 0.15), 240); // G5
        setTimeout(() => playSynthNote(1046.50, 'sine', 0.35, 0.25), 360); // C6
      }

      // Spawn massive burst of wobbly floating pastel hearts!
      const area = document.getElementById('message-viewport');
      if (area) {
        for (let i = 0; i < 18; i++) {
          const heart = document.createElement('div');
          heart.style.position = 'absolute';
          heart.style.left = (Math.random() * 80 + 10) + '%';
          heart.style.bottom = '15%';
          heart.style.fontSize = (Math.random() * 16 + 18) + 'px';
          heart.style.color = '#E5B2A9';
          heart.style.pointerEvents = 'none';
          heart.style.zIndex = '200';
          heart.innerHTML = '💖';
          heart.style.transition = 'all 2.2s cubic-bezier(0.25, 1, 0.5, 1)';
          area.appendChild(heart);
          setTimeout(() => {
            const dx = (Math.random() * 200 - 100) + 'px';
            const dy = -(Math.random() * 250 + 150) + 'px';
            heart.style.transform = `translate(${dx}, ${dy}) scale(0)`;
            heart.style.opacity = '0';
          }, 20);
          setTimeout(() => heart.remove(), 2500);
        }
      }

      // Update card letter content to success Polaroid!
      const card = document.querySelector('.message-card-wrapper');
      if (card) {
        card.innerHTML = `
          <div class="washi-tape tape-top-center" style="background: rgba(143,164,153,0.6) !important; transform: rotate(1deg); top: -14px;"></div>
          <div style="text-align: center; font-family: var(--font-body); display: flex; flex-direction: column; gap: 10px;">
            <span style="font-size: 2.2rem; animation: floatLogo 3s ease-in-out infinite;">🐧❤️🐧</span>
            <h4 style="font-family: var(--font-display); font-size: 0.95rem; font-weight: 800; color: var(--color-pink-deep);">Yay! We waddle again!</h4>
            <p style="font-size: 0.72rem; color: var(--color-sage-deep); line-height: 1.4; padding: 0 4px;">
              Thank you, Pranjal! You've made my year! Let's talk, waddle, and make amazing memories together again. No more busy driftings. I'm right here! 💖
            </p>
            <button class="action-btn next" id="celebrate-return-btn" style="background: var(--color-pink-dark) !important; border-color: var(--color-pink-dark) !important; color: #3D4A41 !important; margin-top: 6px; padding: 8px 12px; font-size: 0.72rem; border-radius: 12px;">
              🔄 Craft Again
            </button>
          </div>
        `;
        
        const retBtn = document.getElementById('celebrate-return-btn');
        if (retBtn) {
          retBtn.addEventListener('click', () => {
            playClickChime();
            updateRouterView('gallery');
          });
        }
      }
    });
  }

  if (messageTimeBtn) {
    messageTimeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      playClickChime();
      
      // Muted soft lofi hum chime!
      if (!state.isMuted && audioCtx) {
        playSynthNote(330, 'triangle', 0.2, 0.15); // Cozy warm note
      }

      const card = document.querySelector('.message-card-wrapper');
      if (card) {
        card.innerHTML = `
          <div class="washi-tape tape-top-center" style="background: rgba(234,229,218,0.8) !important; transform: rotate(-1deg); top: -14px;"></div>
          <div style="text-align: center; font-family: var(--font-body); display: flex; flex-direction: column; gap: 10px;">
            <span style="font-size: 2.2rem; animation: floatLogo 4s ease-in-out infinite;">☕⏳</span>
            <h4 style="font-family: var(--font-display); font-size: 0.95rem; font-weight: 800; color: var(--color-sage-deep);">Take all your time...</h4>
            <p style="font-size: 0.72rem; color: var(--color-sage-deep); line-height: 1.4; padding: 0 4px;">
              I completely understand, Pranjal. Take all the time you need. I'm just incredibly grateful that you took the time to read this. I'll always be here waiting for our next waddle! 💖
            </p>
            <button class="action-btn secondary" id="celebrate-return-btn" style="background: rgba(255,255,255,0.7) !important; border: 1.5px solid rgba(143,164,153,0.3) !important; margin-top: 6px; padding: 8px 12px; font-size: 0.72rem; border-radius: 12px;">
              🔄 Craft Again
            </button>
          </div>
        `;
        
        const retBtn = document.getElementById('celebrate-return-btn');
        if (retBtn) {
          retBtn.addEventListener('click', () => {
            playClickChime();
            updateRouterView('gallery');
          });
        }
      }
    });
  }

  // --- INITIALIZATION ---
  initBackgroundParticles();
  readUrlParams();

});
