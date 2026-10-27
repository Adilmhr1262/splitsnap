(function () {
  "use strict";

  var CURRENCIES = ["PKR", "USD", "EUR", "GBP", "INR"];
  var HISTORY_KEY = "splitsnap:history";
  var THEME_KEY = "splitsnap:theme";
  var CURRENCY_KEY = "splitsnap:currency";

  var form = document.getElementById("billForm");
  var billNameInput = document.getElementById("billName");
  var billAmountInput = document.getElementById("billAmount");
  var currencySelect = document.getElementById("currency");
  var peopleCountInput = document.getElementById("peopleCount");
  var tipInput = document.getElementById("tipPct");
  var extraInput = document.getElementById("extraCharge");
  var peopleEditor = document.getElementById("peopleEditor");
  var modeHint = document.getElementById("modeHint");
  var customSumLine = document.getElementById("customSumLine");
  var formError = document.getElementById("formError");
  var emptyResults = document.getElementById("emptyResults");
  var resultsBox = document.getElementById("results");
  var resSubtotal = document.getElementById("resSubtotal");
  var resTip = document.getElementById("resTip");
  var resExtra = document.getElementById("resExtra");
  var resGrand = document.getElementById("resGrand");
  var shareList = document.getElementById("shareList");
  var sumCheck = document.getElementById("sumCheck");
  var copyBtn = document.getElementById("copyBtn");
  var saveBtn = document.getElementById("saveBtn");
  var actionMsg = document.getElementById("actionMsg");
  var historyList = document.getElementById("historyList");
  var emptyHistory = document.getElementById("emptyHistory");
  var historyMsg = document.getElementById("historyMsg");
  var clearAllBtn = document.getElementById("clearAllBtn");
  var themeToggle = document.getElementById("themeToggle");

  var peopleData = [{ name: "", amount: "" }, { name: "", amount: "" }, { name: "", amount: "" }];
  var currentResult = null;
  var storageOK = true;

  function storeGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { storageOK = false; return null; }
  }
  function storeSet(key, value) {
    try { window.localStorage.setItem(key, value); return true; }
    catch (e) { storageOK = false; return false; }
  }
  function storeRemove(key) {
    try { window.localStorage.removeItem(key); } catch (e) { storageOK = false; }
  }

  function formatMoney(cents, code) {
    var value = cents / 100;
    var num = value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return code + " " + num;
  }

  function parseMoneyToCents(text) {
    if (text === null || text === undefined) return null;
    var t = String(text).trim();
    if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
    var cents = Math.round(parseFloat(t) * 100);
    if (!isFinite(cents) || cents < 0) return null;
    return cents;
  }

  function showError(message, field) {
    formError.textContent = message;
    formError.hidden = false;
    if (field) {
      field.setAttribute("aria-invalid", "true");
      field.focus();
    }
  }
  function clearError() {
    formError.textContent = "";
    formError.hidden = true;
    [billAmountInput, peopleCountInput, tipInput, extraInput].forEach(function (el) {
      el.removeAttribute("aria-invalid");
    });
    peopleEditor.querySelectorAll("input").forEach(function (el) {
      el.removeAttribute("aria-invalid");
    });
  }

  function getMode() {
    var checked = form.querySelector('input[name="mode"]:checked');
    return checked ? checked.value : "equal";
  }

  function getCount() {
    var n = parseInt(peopleCountInput.value, 10);
    return isNaN(n) ? 0 : n;
  }

  function syncPeopleData() {
    var rows = peopleEditor.querySelectorAll(".person-row");
    rows.forEach(function (row, i) {
      var nameEl = row.querySelector(".person-name");
      var amtEl = row.querySelector(".custom-amount");
      if (peopleData[i]) {
        peopleData[i].name = nameEl ? nameEl.value : "";
        peopleData[i].amount = amtEl ? amtEl.value : "";
      }
    });
  }

  function renderPeople() {
    var count = getCount();
    if (count < 2 || count > 20) return;
    syncPeopleData();
    while (peopleData.length < count) peopleData.push({ name: "", amount: "" });
    peopleData.length = count;
    var mode = getMode();
    peopleEditor.innerHTML = "";
    peopleData.forEach(function (person, i) {
      var row = document.createElement("div");
      row.className = "person-row" + (mode === "custom" ? "" : " custom-off");
      var nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.className = "person-name";
      nameInput.maxLength = 40;
      nameInput.placeholder = "Person " + (i + 1);
      nameInput.setAttribute("aria-label", "Name for person " + (i + 1));
      nameInput.value = person.name || "";
      nameInput.autocomplete = "off";
      row.appendChild(nameInput);
      var amtInput = document.createElement("input");
      amtInput.type = "number";
      amtInput.className = "custom-amount";
      amtInput.inputMode = "decimal";
      amtInput.min = "0";
      amtInput.step = "0.01";
      amtInput.placeholder = "Base amount";
      amtInput.setAttribute("aria-label", "Base amount for person " + (i + 1));
      amtInput.value = person.amount || "";
      if (mode !== "custom") amtInput.style.display = "none";
      row.appendChild(amtInput);
      peopleEditor.appendChild(row);
    });
    updateCustomSumLine();
  }

  function updateCustomSumLine() {
    if (getMode() !== "custom") { customSumLine.hidden = true; return; }
    syncPeopleData();
    var sum = 0;
    var allValid = true;
    peopleData.forEach(function (p) {
      if (p.amount === "" || p.amount === null) { allValid = false; return; }
      var c = parseMoneyToCents(p.amount);
      if (c === null) { allValid = false; return; }
      sum += c;
    });
    var subtotal = parseMoneyToCents(billAmountInput.value);
    customSumLine.hidden = false;
    if (!allValid) {
      customSumLine.textContent = "Enter a base amount for every person. The base amounts must add up to the bill subtotal.";
    } else if (subtotal === null) {
      customSumLine.textContent = "Custom base amounts total " + formatMoney(sum, currencySelect.value) + ". Enter the bill subtotal to check the match.";
    } else if (sum === subtotal) {
      customSumLine.textContent = "Custom base amounts total " + formatMoney(sum, currencySelect.value) + ", matching the subtotal.";
    } else {
      customSumLine.textContent = "Custom base amounts total " + formatMoney(sum, currencySelect.value) + ", but the subtotal is " + formatMoney(subtotal, currencySelect.value) + ". Adjust the base amounts so they match.";
    }
  }

  function updateModeUI() {
    var mode = getMode();
    modeHint.textContent = mode === "custom"
      ? "Each person pays a share based on their base amount. Base amounts must add up to the bill subtotal."
      : "Everyone pays the same share of the bill, tip, and extra charges.";
    renderPeople();
  }

  function loadHistory() {
    var raw = storeGet(HISTORY_KEY);
    if (!raw) return [];
    try {
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(function (item) {
        return item && typeof item.id === "string" && item.grandCents !== undefined && Array.isArray(item.people);
      });
    } catch (e) { return []; }
  }

  function saveHistoryList(list) {
    return storeSet(HISTORY_KEY, JSON.stringify(list));
  }

  function renderHistory() {
    var list = loadHistory();
    historyList.innerHTML = "";
    emptyHistory.hidden = list.length !== 0;
    list.slice().reverse().forEach(function (item) {
      var li = document.createElement("li");
      var info = document.createElement("div");
      var title = document.createElement("strong");
      title.textContent = item.billName || "Untitled bill";
      var meta = document.createElement("div");
      meta.className = "meta";
      var dateText = "";
      try { dateText = new Date(item.savedAt).toLocaleString(); } catch (e) { dateText = ""; }
      meta.textContent = formatMoney(item.grandCents, item.currency) + " · " + item.people.length + " people · " + (item.mode === "custom" ? "Custom" : "Equal") + (dateText ? " · " + dateText : "");
      info.appendChild(title);
      info.appendChild(meta);
      var actions = document.createElement("div");
      actions.className = "item-actions";
      var reopenBtn = document.createElement("button");
      reopenBtn.type = "button";
      reopenBtn.className = "btn-secondary";
      reopenBtn.textContent = "Reopen";
      reopenBtn.addEventListener("click", function () { reopenBill(item); });
      var delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn-danger";
      delBtn.textContent = "Delete";
      var armed = false;
      var timer = null;
      delBtn.addEventListener("click", function () {
        if (!armed) {
          armed = true;
          delBtn.textContent = "Tap again to delete";
          timer = setTimeout(function () { armed = false; delBtn.textContent = "Delete"; }, 3000);
          return;
        }
        clearTimeout(timer);
        var next = loadHistory().filter(function (h) { return h.id !== item.id; });
        if (saveHistoryList(next)) { historyMsg.textContent = "Bill deleted."; }
        else { historyMsg.textContent = "Could not save the change. This browser blocked storage."; }
        renderHistory();
      });
      actions.appendChild(reopenBtn);
      actions.appendChild(delBtn);
      li.appendChild(info);
      li.appendChild(actions);
      historyList.appendChild(li);
    });
  }

  function doCalculate() {
    clearError();
    actionMsg.textContent = "";
    var billName = billNameInput.value.trim();
    var subtotal = parseMoneyToCents(billAmountInput.value);
    if (subtotal === null || subtotal <= 0) {
      showError("Enter a bill amount above zero, with at most two decimal places.", billAmountInput);
      return null;
    }
    var count = getCount();
    if (count < 2 || count > 20 || String(peopleCountInput.value).trim() === "" || parseInt(peopleCountInput.value, 10) !== parseFloat(peopleCountInput.value)) {
      showError("Number of people must be a whole number from 2 to 20.", peopleCountInput);
      return null;
    }
    var tipText = tipInput.value.trim();
    var tipPct = tipText === "" ? 0 : parseFloat(tipText);
    if (isNaN(tipPct) || tipPct < 0 || tipPct > 100) {
      showError("Tip must be a percentage from 0 to 100.", tipInput);
      return null;
    }
    var extra = parseMoneyToCents(extraInput.value === "" ? "0" : extraInput.value);
    if (extra === null) {
      showError("Extra charges must be zero or more, with at most two decimal places.", extraInput);
      return null;
    }
    var mode = getMode();
    syncPeopleData();
    while (peopleData.length < count) peopleData.push({ name: "", amount: "" });
    peopleData.length = count;

    var bases = [];
    var names = [];
    for (var i = 0; i < count; i++) {
      names.push((peopleData[i].name || "").trim() || ("Person " + (i + 1)));
      if (mode === "custom") {
        var c = parseMoneyToCents(peopleData[i].amount);
        if (c === null) {
          showError("Enter a base amount of zero or more for every person, with at most two decimal places.", null);
          var bad = peopleEditor.querySelectorAll(".custom-amount")[i];
          if (bad) bad.setAttribute("aria-invalid", "true");
          return null;
        }
        bases.push(c);
      } else {
        bases.push(0);
      }
    }
    if (mode === "custom") {
      var sumBases = bases.reduce(function (a, b) { return a + b; }, 0);
      if (sumBases !== subtotal) {
        showError("Custom base amounts total " + formatMoney(sumBases, currencySelect.value) + ", but the subtotal is " + formatMoney(subtotal, currencySelect.value) + ". Adjust the base amounts so they match.", null);
        return null;
      }
    }

    var tipCents = Math.round(subtotal * tipPct / 100);
    var grand = subtotal + tipCents + extra;
    var totalWeight = mode === "custom"
      ? bases.reduce(function (a, b) { return a + b; }, 0)
      : count;

    var floors = [];
    var remainders = [];
    var floorSum = 0;
    for (var j = 0; j < count; j++) {
      var weight = mode === "custom" ? bases[j] : 1;
      var raw = grand * weight / totalWeight;
      var fl = Math.floor(raw);
      floors.push(fl);
      remainders.push(raw - fl);
      floorSum += fl;
    }
    var leftover = grand - floorSum;
    var order = [];
    for (var k = 0; k < count; k++) order.push(k);
    order.sort(function (a, b) {
      if (remainders[b] !== remainders[a]) return remainders[b] - remainders[a];
      return a - b;
    });
    var shares = floors.slice();
    for (var m = 0; m < leftover; m++) shares[order[m % count]] += 1;

    var people = names.map(function (name, idx) {
      return { name: name, baseCents: mode === "custom" ? bases[idx] : null, shareCents: shares[idx] };
    });

    var result = {
      billName: billName || "Untitled bill",
      currency: currencySelect.value,
      subtotalCents: subtotal,
      tipCents: tipCents,
      tipPct: tipPct,
      extraCents: extra,
      grandCents: grand,
      mode: mode,
      people: people
    };
    currentResult = result;
    renderResults(result);
    return result;
  }

  function renderResults(result) {
    resSubtotal.textContent = formatMoney(result.subtotalCents, result.currency);
    resTip.textContent = formatMoney(result.tipCents, result.currency) + (result.tipPct ? " (" + result.tipPct + "%)" : "");
    resExtra.textContent = formatMoney(result.extraCents, result.currency);
    resGrand.textContent = formatMoney(result.grandCents, result.currency);
    shareList.innerHTML = "";
    result.people.forEach(function (p) {
      var li = document.createElement("li");
      var nameSpan = document.createElement("span");
      nameSpan.textContent = p.name;
      var amtSpan = document.createElement("span");
      amtSpan.textContent = formatMoney(p.shareCents, result.currency);
      li.appendChild(nameSpan);
      li.appendChild(amtSpan);
      shareList.appendChild(li);
    });
    var sum = result.people.reduce(function (a, p) { return a + p.shareCents; }, 0);
    sumCheck.textContent = "Shares add up to " + formatMoney(sum, result.currency) + ", matching the grand total.";
    emptyResults.hidden = true;
    resultsBox.hidden = false;
  }

  function buildSummary(result) {
    var lines = [];
    lines.push("SplitSnap: " + result.billName);
    lines.push("Grand total: " + formatMoney(result.grandCents, result.currency));
    lines.push("Subtotal: " + formatMoney(result.subtotalCents, result.currency) + " | Tip: " + formatMoney(result.tipCents, result.currency) + " | Extra: " + formatMoney(result.extraCents, result.currency));
    result.people.forEach(function (p) {
      lines.push(p.name + ": " + formatMoney(p.shareCents, result.currency));
    });
    return lines.join("\n");
  }

  function copySummary() {
    if (!currentResult) { actionMsg.textContent = "Calculate a bill first, then copy the summary."; return; }
    var text = buildSummary(currentResult);
    function done(ok) {
      actionMsg.textContent = ok ? "Summary copied. Paste it into WhatsApp or any chat app." : "Copy failed in this browser. Select the results above and copy them by hand.";
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { fallbackCopy(text, done); });
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, done) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      done(ok);
    } catch (e) { done(false); }
  }

  function saveCurrent() {
    if (!currentResult) { actionMsg.textContent = "Calculate a bill first, then save it."; return; }
    if (!storageOK) { actionMsg.textContent = "Could not save: this browser blocked storage."; return; }
    var list = loadHistory();
    var entry = JSON.parse(JSON.stringify(currentResult));
    entry.id = Date.now().toString(36) + "-" + Math.floor(Math.random() * 1000000).toString(36);
    entry.savedAt = new Date().toISOString();
    list.push(entry);
    if (saveHistoryList(list)) {
      actionMsg.textContent = "Saved to history.";
      historyMsg.textContent = "";
      renderHistory();
    } else {
      actionMsg.textContent = "Could not save: storage is full or blocked in this browser.";
    }
  }

  function reopenBill(item) {
    billNameInput.value = item.billName === "Untitled bill" ? "" : item.billName;
    billAmountInput.value = (item.subtotalCents / 100).toFixed(2);
    currencySelect.value = CURRENCIES.indexOf(item.currency) >= 0 ? item.currency : "PKR";
    peopleCountInput.value = item.people.length;
    tipInput.value = item.tipPct || 0;
    extraInput.value = (item.extraCents / 100).toFixed(2);
    var radio = form.querySelector('input[name="mode"][value="' + item.mode + '"]');
    if (radio) radio.checked = true;
    peopleData = item.people.map(function (p) {
      return {
        name: /^Person \d+$/.test(p.name) ? "" : p.name,
        amount: p.baseCents === null || p.baseCents === undefined ? "" : (p.baseCents / 100).toFixed(2)
      };
    });
    updateModeUI();
    var result = doCalculate();
    if (result) {
      switchTab("split");
      actionMsg.textContent = "Reopened saved bill. Results recalculated.";
      document.getElementById("panel-split").scrollIntoView();
    }
  }

  function switchTab(name) {
    document.querySelectorAll('[role="tab"]').forEach(function (btn) {
      var active = btn.getAttribute("data-tab") === name;
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    document.querySelectorAll('[role="tabpanel"]').forEach(function (panel) {
      panel.hidden = panel.id !== "panel-" + name;
    });
  }

  function initTheme() {
    var saved = storeGet(THEME_KEY);
    var theme = saved === "dark" || saved === "light" ? saved : "light";
    document.documentElement.setAttribute("data-theme", theme);
    themeToggle.textContent = theme === "dark" ? "Light mode" : "Dark mode";
    themeToggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
  }

  document.querySelectorAll('[role="tab"]').forEach(function (btn) {
    btn.addEventListener("click", function () { switchTab(btn.getAttribute("data-tab")); });
  });
  form.addEventListener("submit", function (e) { e.preventDefault(); doCalculate(); });
  peopleCountInput.addEventListener("change", renderPeople);
  peopleCountInput.addEventListener("input", renderPeople);
  billAmountInput.addEventListener("input", updateCustomSumLine);
  peopleEditor.addEventListener("input", updateCustomSumLine);
  form.querySelectorAll('input[name="mode"]').forEach(function (r) {
    r.addEventListener("change", updateModeUI);
  });
  currencySelect.addEventListener("change", function () {
    storeSet(CURRENCY_KEY, currencySelect.value);
    updateCustomSumLine();
  });
  copyBtn.addEventListener("click", copySummary);
  saveBtn.addEventListener("click", saveCurrent);

  var clearArmed = false;
  var clearTimer = null;
  clearAllBtn.addEventListener("click", function () {
    if (!clearArmed) {
      clearArmed = true;
      clearAllBtn.textContent = "Tap again to clear all";
      clearTimer = setTimeout(function () { clearArmed = false; clearAllBtn.textContent = "Clear all"; }, 3000);
      return;
    }
    clearTimeout(clearTimer);
    clearArmed = false;
    clearAllBtn.textContent = "Clear all";
    storeRemove(HISTORY_KEY);
    historyMsg.textContent = "All saved bills cleared.";
    renderHistory();
  });

  themeToggle.addEventListener("click", function () {
    var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    storeSet(THEME_KEY, next);
    initTheme();
  });

  try {
    window.localStorage.setItem("splitsnap:probe", "1");
    window.localStorage.removeItem("splitsnap:probe");
  } catch (e) { storageOK = false; }

  var savedCurrency = storeGet(CURRENCY_KEY);
  if (savedCurrency && CURRENCIES.indexOf(savedCurrency) >= 0) currencySelect.value = savedCurrency;
  initTheme();
  renderPeople();
  renderHistory();
})();
