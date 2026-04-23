if (window.ppAlertLoaded) {
  console.log("ppAlert redan laddat");
} else {
  window.ppAlertLoaded = true;

  const ids = [
    "premium_exchange_stock_wood",
    "premium_exchange_stock_stone",
    "premium_exchange_stock_iron"
  ];

  const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
  const previousValues = {};
  const originalTitle = document.title;
  let blinkInterval = null;

  function playBeep() {
    audio.currentTime = 0;
    audio.play().catch(err => {
      console.log("Audio error:", err);
    });
  }

  function startTitleBlink() {
    if (blinkInterval) return;

    let toggle = false;
    blinkInterval = setInterval(() => {
      document.title = toggle ? "BUY RESOURCES" : originalTitle;
      toggle = !toggle;
    }, 1000);
  }

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
      startTitleBlink();
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
