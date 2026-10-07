(() => {
  const storageKey = "iphone18-store-cart-v1";
  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  const readCart = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      if (!Array.isArray(saved)) return [];
      return saved.filter((item) => item && typeof item.id === "string" && item.name && Number(item.unitPrice) > 0)
        .map((item) => ({
          ...item,
          name: String(item.name).replaceAll('iPhone 16 Pro Max', 'iPhone 16 Pro Max'),
          imageAlt: String(item.imageAlt || '').replaceAll('iPhone 16 Pro Max', 'iPhone 16 Pro Max'),
          quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
          unitPrice: Number(item.unitPrice),
        }));
    } catch {
      return [];
    }
  };
  const writeCart = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // Keep the current cart usable for this page view if browser storage is unavailable.
    }
  };
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);

  const initialTitles = [
    "iPhone 16 Pro Max 512GB",
    "MagSafe Titanium Carbon Case",
    "65W Dual USB-C Dynamic HyperCharger",
  ];
  const originalCards = initialTitles.map((title) => {
    const heading = [...document.querySelectorAll("h2, h3")].find((element) =>
      element.textContent.trim() === title,
    );
    return heading?.closest(".rounded-3xl.bg-surface-container");
  }).filter(Boolean);
  const cartColumn = originalCards[0]?.parentElement;
  if (!cartColumn) return;

  const rows = document.createElement("div");
  rows.className = "flex flex-col gap-4";
  rows.setAttribute("aria-live", "polite");
  cartColumn.insertBefore(rows, originalCards[0]);
  originalCards.forEach((card) => card.remove());

  const giftButton = [...cartColumn.querySelectorAll("button")]
    .find((button) => button.textContent.includes("Add Message"));
  const giftPanel = giftButton?.closest(".rounded-2xl.bg-surface-container-low");
  const summaryHeading = [...document.querySelectorAll("h2")]
    .find((heading) => heading.textContent.trim() === "Order Summary");
  const summary = summaryHeading?.closest(".rounded-3xl.bg-surface-container");
  const findRow = (label) => [...(summary?.querySelectorAll(".flex.items-center.justify-between") ?? [])]
    .find((row) => row.firstElementChild?.textContent.trim().startsWith(label));
  const subtotalValue = findRow("Hardware Subtotal")?.lastElementChild;
  const careRow = findRow("AppleCare+ Coverage");
  const taxValue = findRow("Estimated Sales Tax")?.lastElementChild;
  const totalLabel = [...(summary?.querySelectorAll("span") ?? [])]
    .find((span) => span.textContent.trim() === "Total Due Today");
  const totalValue = totalLabel?.nextElementSibling;
  const itemsBadge = [...(summary?.querySelectorAll("span") ?? [])]
    .find((span) => /^\d+ Items$/.test(span.textContent.trim()));
  const bagBadge = [...document.querySelectorAll("header span")]
    .find((span) => /^\d+$/.test(span.textContent.trim()));
  if (careRow) careRow.hidden = true;

  let items = readCart();
  const calculate = () => {
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    return {
      subtotal,
      tax,
      total: subtotal + tax,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  };

  const makeItemRow = (item) => {
    const card = document.createElement("article");
    card.className = "rounded-3xl bg-surface-container p-6 shadow-lg transition-all relative";
    card.dataset.cartId = item.id;
    const imageMarkup = item.image
      ? `<img class="h-full w-full object-contain p-3" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt || item.name)}"/>`
      : '<span class="material-symbols-outlined text-primary text-[32px]">smartphone</span>';
    card.innerHTML = `
      <div class="flex flex-col items-center gap-5 sm:flex-row">
        <div class="group flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface-container-lowest shadow-inner sm:w-28">${imageMarkup}</div>
        <div class="w-full flex-1">
          <div class="flex items-start justify-between gap-4">
            <div><span class="font-label-caps text-label-caps uppercase tracking-wider text-primary">iPhone 16 Family</span><h2 class="mt-0.5 font-headline-md text-headline-md font-semibold text-on-surface">${escapeHtml(item.name)}</h2><p class="mt-1 font-body-md text-body-md text-on-surface-variant">Finish: ${escapeHtml(item.finish || "Standard")}</p></div>
            <div class="shrink-0 text-right"><span data-line-total class="block font-headline-sm text-headline-sm font-bold text-on-surface"></span><span class="font-label-caps text-label-caps text-on-surface-variant">${money.format(item.unitPrice)} each</span></div>
          </div>
          <div class="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-surface-container-high/60 pt-4">
            <div class="flex items-center gap-4"><div data-quantity-controls class="flex items-center rounded-full bg-surface-container-lowest p-1 shadow-inner"><button type="button" data-decrease aria-label="Decrease quantity" class="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"><span class="material-symbols-outlined text-[16px]">remove</span></button><span data-quantity class="px-3 font-label-md text-label-md font-semibold text-on-surface"></span><button type="button" data-increase aria-label="Increase quantity" class="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"><span class="material-symbols-outlined text-[16px]">add</span></button></div><button type="button" data-remove class="font-label-md text-label-md text-on-surface-variant transition-colors hover:text-error">Remove</button></div>
            <span class="font-label-caps text-label-caps text-on-surface-variant">Ships with free express delivery</span>
          </div>
        </div>
      </div>`;
    return card;
  };

  const render = () => {
    rows.replaceChildren();
    if (items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "rounded-3xl bg-surface-container p-8 text-center shadow-lg sm:p-12";
      empty.innerHTML = '<span class="material-symbols-outlined text-primary text-[36px]">shopping_bag</span><h2 class="mt-3 font-headline-md text-headline-md font-semibold text-on-surface">Your bag is empty</h2><p class="mx-auto mt-2 max-w-md font-body-md text-body-md text-on-surface-variant">Explore the iPhone 16 Family and add a model to your bag.</p><a href="/stitch/iphone_18_pro_lineup_colors.html" class="mt-5 inline-flex rounded-full bg-primary-container px-5 py-3 font-label-md text-label-md font-semibold text-on-primary-container">Explore the iPhone 16 Family</a>';
      rows.append(empty);
      if (giftPanel) giftPanel.hidden = true;
    } else {
      items.forEach((item) => {
        const card = makeItemRow(item);
        card.querySelector("[data-quantity]").textContent = String(item.quantity);
        card.querySelector("[data-line-total]").textContent = money.format(item.unitPrice * item.quantity);
        card.querySelector("[data-decrease]").disabled = item.quantity <= 1;
        rows.append(card);
      });
      if (giftPanel) giftPanel.hidden = false;
    }

    const totals = calculate();
    if (subtotalValue) subtotalValue.textContent = money.format(totals.subtotal);
    if (taxValue) taxValue.textContent = money.format(totals.tax);
    if (totalValue) totalValue.textContent = money.format(totals.total);
    if (itemsBadge) itemsBadge.textContent = `${totals.count} ${totals.count === 1 ? "Item" : "Items"}`;
    if (bagBadge) bagBadge.textContent = String(totals.count);

    const orderButton = [...(summary?.querySelectorAll("button") ?? [])]
      .find((button) => button.textContent.includes("Order Now"));
    if (orderButton) orderButton.disabled = items.length === 0;
  };

  rows.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    const row = button?.closest("[data-cart-id]");
    if (!button || !row) return;
    const item = items.find((entry) => entry.id === row.dataset.cartId);
    if (!item) return;

    if (button.hasAttribute("data-increase")) item.quantity += 1;
    else if (button.hasAttribute("data-decrease") && item.quantity > 1) item.quantity -= 1;
    else if (button.hasAttribute("data-remove")) items = items.filter((entry) => entry.id !== item.id);
    else return;

    writeCart();
    render();
  });

  const orderButton = [...(summary?.querySelectorAll("button") ?? [])]
    .find((button) => button.textContent.includes("Order Now"));
  orderButton?.addEventListener("click", () => {
    if (items.length === 0) return;
    const totals = calculate();
    const message = [
      "Hi, I would like to order:",
      "",
      ...items.map((item) => `- ${item.name} (${item.finish}) | Qty ${item.quantity} x ${money.format(item.unitPrice)} = ${money.format(item.unitPrice * item.quantity)}`),
      "",
      `Subtotal: ${money.format(totals.subtotal)}`,
      `Estimated tax: ${money.format(totals.tax)}`,
      `Express delivery: Free`,
      `Total: ${money.format(totals.total)}`,
    ].join("\n");
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    const whatsappWindow = window.open(whatsappUrl, "_blank");
    if (whatsappWindow) whatsappWindow.opener = null;
    else window.location.assign(whatsappUrl);
  });

  window.addEventListener("storage", (event) => {
    if (event.key !== storageKey) return;
    items = readCart();
    render();
  });

  render();
})();
