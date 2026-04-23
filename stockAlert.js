/* 
 * Premium Exchange Alert
 * 
 * Description:
 * Provides a local alert (sound + tab title) when stock values change
 * on the Premium Exchange page based on user-selected direction, threshold,
 * and alert mode.
 * 
 * This script does NOT perform any actions, requests, or automation.
 * It only observes visible DOM changes.
 */

(function () {
  if (window.ppAlertLoaded) {
    console.log("Premium Exchange Alert already loaded");
    return;
  }

  window.ppAlertLoaded = true;

  const ids = [
    "premium_exchange_stock_wood",
    "premium_exchange_stock_stone",
    "premium_exchange_stock_iron"
  ];

  const previousValues = {};
  const alertBaseValues = {};
  const originalTitle = document.title;

  let blinkInterval = null;
  let audioCtx = null;

  const directionMessage =
    'Premium Exchange Alert\n\n' +
    'Choose when the alert should trigger:\n\n' +
    'increase = alert when a resource value goes up\n' +
    'decrease = alert when a resource value goes down\n\n' +
    'Type: increase or decrease';

  const modeInput = prompt(directionMessage, "increase");

  if (!modeInput) {
    console.log("Premium Exchange Alert cancelled");
    window.ppAlertLoaded = false;
    return;
  }

  const alertDirection = modeInput.toLowerCase().trim();

  if (alertDirection !== "increase" && alertDirection !== "decrease") {
    alert(
      'Invalid choice.\n\n' +
      'Use:\n' +
      'increase = alert on increase\n' +
      'decrease = alert on decrease'
    );
    window.ppAlertLoaded = false;
    return;
  }

  const thresholdMessage =
    'Threshold setting\n\n' +
    'Choose the minimum change required before an alert is triggered.\n\n' +
    'Example:\n' +
    '500 = alert when the change reaches at least 500\n' +
    '1000 = alert when the change reaches at least 1000\n\n' +
    'Enter a number:';

  const thresholdInput = prompt(thresholdMessage, "500");
  const threshold = parseInt(thresholdInput, 10);

  if (isNaN(threshold) || threshold <= 0) {
    alert(
      'Invalid threshold.\n\n' +
      'Please enter a number greater than 0.\n' +
      'Example: 500'
    );
    window.ppAlertLoaded = false;
    return;
  }

  const alertTypeMessage =
    'Alert type\n\n' +
    'Choose how alerts should behave:\n\n' +
    'single = only 1 alert per update if the change is at least the threshold\n' +
    'Example: threshold 500, value goes from 1000 to 2200 = 1 alert\n\n' +
    'step = alert for every full threshold step passed\n' +
    'Example: threshold 500, value goes from 1000 to 2200 = 2 alerts\n\n' +
    'Type: single or step';

  const alertTypeInput = prompt(alertTypeMessage, "single");

  if (!alertTypeInput) {
    console.log("Premium Exchange Alert cancelled");
    window.ppAlertLoaded = false;
    return;
  }

  const alertType = alertTypeInput.toLowerCase().trim();

  if (alertType !== "step" && alertType !== "single") {
    alert(
      'Invalid alert type.\n\n' +
      'Use:\n' +
      'single = one alert per update\n' +
      'step = one alert for each threshold step reached'
    );
    window.ppAlertLoaded = false;
    return;
  }

  function getAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    return audioCtx;
  }

  function playBeep() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    } catch (err) {
      console.log("Audio error:", err);
    }
  }

  function playMultipleBeeps(count) {
    const safeCount = Math.min(count, 5);
    for (let i = 0; i < safeCount; i++) {
      setTimeout(() => {
        playBeep();
      }, i * 300);
    }
  }

  function startTitleBlink() {
    if (blinkInterval) return;

    const alertTitle = alertDirection === "increase" ? "BUY RESOURCES" : "SELL RESOURCES";

    let toggle = false;
    blinkInterval = setInterval(() => {
      document.title = toggle ? alertTitle : originalTitle;
      toggle = !toggle;
    }, 1000);
  }

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const value = parseInt(el.textContent.trim(), 10) || 0;
      previousValues[id] = value;
      alertBaseValues[id] = value;
    }
  });

  function checkChange(id, el) {
    const newValue = parseInt(el.textContent.trim(), 10) || 0;
    const oldValue = previousValues[id] || 0;
    const baseValue = alertBaseValues[id] || 0;

    if (alertDirection === "increase") {
      const diffFromPrevious = newValue - oldValue;
      const diffFromBase = newValue - baseValue;

      if (alertType === "single") {
        if (diffFromPrevious >= threshold) {
          console.log(id + " increased: " + oldValue + " → " + newValue);
          playBeep();
          startTitleBlink();
        }
      } else if (alertType === "step") {
        const stepsReached = Math.floor(diffFromBase / threshold);

        if (stepsReached > 0) {
          console.log(
            id + " increased: " + oldValue + " → " + newValue +
            " (" + stepsReached + " threshold step(s))"
          );
          playMultipleBeeps(stepsReached);
          startTitleBlink();
          alertBaseValues[id] = baseValue + (stepsReached * threshold);
        }
      }
    }

    if (alertDirection === "decrease") {
      const diffFromPrevious = oldValue - newValue;
      const diffFromBase = baseValue - newValue;

      if (alertType === "single") {
        if (diffFromPrevious >= threshold) {
          console.log(id + " decreased: " + oldValue + " → " + newValue);
          playBeep();
          startTitleBlink();
        }
      } else if (alertType === "step") {
        const stepsReached = Math.floor(diffFromBase / threshold);

        if (stepsReached > 0) {
          console.log(
            id + " decreased: " + oldValue + " → " + newValue +
            " (" + stepsReached + " threshold step(s))"
          );
          playMultipleBeeps(stepsReached);
          startTitleBlink();
          alertBaseValues[id] = baseValue - (stepsReached * threshold);
        }
      }
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

  console.log(
    "Premium Exchange Alert active | direction: " +
    alertDirection +
    " | threshold: " +
    threshold +
    " | type: " +
    alertType
  );
})();
