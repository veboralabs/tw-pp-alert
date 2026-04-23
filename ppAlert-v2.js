if (window.ppAlertLoaded) {
  console.log("ppAlert redan laddat");
} else {
  window.ppAlertLoaded = true;

  const ids = [
    "premium_exchange_stock_wood",
    "premium_exchange_stock_stone",
    "premium_exchange_stock_iron"
  ];

  const previousValues = {};
  let audioCtx = null;

  function initAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    return audioCtx;
  }

  function playBeep() {
    const ctx = initAudio();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.25);
  }

  // Försök låsa upp ljud direkt när scriptet körs
  initAudio();

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      previousValues[id] = parseInt(el.textContent.trim(), 10) || 0;
    }
  });

  function checkChange(id, el) {
    const newValue = parseInt(el.textContent.trim(), 10) || 0;
    const oldValue = previousValues[id] || 0;

    if (newValue > oldValue) {
      console.log(`${id} ökade: ${oldValue} → ${newValue}`);
      playBeep();
      document.title = "BUY RESOURCES";
    }

    previousValues[id] = newValue;
  }

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    const observer = new MutationObserver(() => {
      checkChange(id, el);
    });

    observer.observe(el, {
      childList: true,
      subtree: true,
      characterData: true
    });
  });

  console.log("Stock alert aktivt");
}
