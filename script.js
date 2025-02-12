let debounceTimer;
let hideTimeoutId = null;

async function processGrammar() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    let inputText = document.getElementById("textEditor").innerText;
    if (inputText.trim() === "") return;

    try {
      let response = await fetch("http://127.0.0.1:5000/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });
      let result = await response.json();

      const originalText = inputText;
      const correctedText = result.corrected_text;
      const originalWords = originalText.split(/\s+/);
      const correctedWords = correctedText.split(/\s+/);

      const corrections = {};
      originalWords.forEach((word, index) => {
        if (
          correctedWords[index] &&
          word.toLowerCase() !== correctedWords[index].toLowerCase()
        ) {
          corrections[word] = correctedWords[index];
        }
      });

      let highlightedText = originalText;
      Object.keys(corrections).forEach((word) => {
        const regex = new RegExp(`\\b${word}\\b`, "g");
        highlightedText = highlightedText.replace(
          regex,
          `<span class="error" data-suggestion="${corrections[word]}">${word}</span>`
        );
      });

      const textEditor = document.getElementById("textEditor");
      textEditor.innerHTML = highlightedText;

      const errorSpans = textEditor.querySelectorAll(".error");
      errorSpans.forEach((span) => {
        span.addEventListener("mouseenter", showTooltip);
        span.addEventListener("mouseleave", startHideTooltip);
      });
    } catch (error) {
      console.error("Error:", error);
    }
  }, 2000);
}

function showTooltip(event) {
  if (hideTimeoutId) {
    clearTimeout(hideTimeoutId);
    hideTimeoutId = null;
  }

  const errorWord = event.target;
  const suggestion = errorWord.getAttribute("data-suggestion");
  const tooltip = document.getElementById("tooltip");

  // Get position of the error word
  const rect = errorWord.getBoundingClientRect();
  const editorRect = document
    .getElementById("textEditor")
    .getBoundingClientRect();

  // Position tooltip above the word
  tooltip.style.position = "absolute";
  tooltip.style.left = `${rect.left - editorRect.left}px`;
  tooltip.style.top = `${rect.top - editorRect.top - 40}px`; // 40px above the word
  tooltip.style.display = "block";

  tooltip.setAttribute("data-current-error", errorWord.outerHTML);

  tooltip.innerHTML = `
    <div class="tooltiptext" onclick="applyCorrection(this)">
      ${suggestion}
    </div>
  `;
  tooltip.addEventListener("mouseenter", cancelHideTooltip);
  tooltip.addEventListener("mouseleave", hideTooltip);
}

function startHideTooltip() {
  hideTimeoutId = setTimeout(hideTooltip, 300); // 300ms delay
}

function cancelHideTooltip() {
  if (hideTimeoutId) {
    clearTimeout(hideTimeoutId);
    hideTimeoutId = null;
  }
}

function hideTooltip() {
  const tooltip = document.getElementById("tooltip");
  tooltip.style.display = "none";

  if (hideTimeoutId) {
    clearTimeout(hideTimeoutId);
    hideTimeoutId = null;
  }
}

function applyCorrection(tooltipElement) {
  const tooltip = document.getElementById("tooltip");
  const textEditor = document.getElementById("textEditor");

  // Get the current error span's HTML
  const errorSpanHTML = tooltip.getAttribute("data-current-error");

  // Create a temporary element to parse the HTML
  const temp = document.createElement("div");
  temp.innerHTML = errorSpanHTML;
  const errorSpan = temp.firstChild;

  // Get the suggestion text
  const suggestion = errorSpan.getAttribute("data-suggestion");

  textEditor.innerHTML = textEditor.innerHTML.replace(
    errorSpanHTML,
    suggestion
  );

  hideTooltip();

  processGrammar();
}

document.getElementById("textEditor").addEventListener("input", processGrammar);
