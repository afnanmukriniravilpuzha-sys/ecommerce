(() => {
  const storageKey = "iphone18-store-cart-v1";
  const readCart = () => {
    try {
      const cart = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      return Array.isArray(cart) ? cart : [];
    } catch {
      return [];
    }
  };
  const writeCart = (cart) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(cart));
      return true;
    } catch {
      return false;
    }
  };
  const updateBagBadge = () => {
    const badge = [...document.querySelectorAll("header span")]
      .find((span) => /^\d+$/.test(span.textContent.trim()));
    if (badge) {
      const count = readCart().reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
      badge.textContent = String(count);
    }
  };
  const cards = [...document.querySelectorAll(".group.relative.flex.flex-col")];

  cards.forEach((card) => {
    const addButton = [...card.querySelectorAll("button")].find((button) =>
      [...button.querySelectorAll("span")].some((span) => span.textContent.trim() === "Add"),
    );
    const title = card.querySelector("h3")?.textContent.trim();
    const priceText = [...card.querySelectorAll("span")]
      .map((span) => span.textContent.trim())
      .find((text) => /^From\s+\$[\d,]+/.test(text));
    const image = card.querySelector("img");
    const description = card.querySelector("p.font-body-md")?.textContent.trim() ?? "";
    const finish = description.split(".")[0].replace(/\s*Finish$/i, "").trim();
    const price = Number(priceText?.match(/\$([\d,]+)/)?.[1].replaceAll(",", "") ?? 0);
    if (!addButton || !title || !finish || price <= 0) return;

    const label = [...addButton.querySelectorAll("span")]
      .find((span) => span.textContent.trim() === "Add");

    addButton.addEventListener("click", () => {
      const selectedFinish = card.querySelector("[id^='swatch-label-']")?.textContent.trim() || finish;
      const id = `${title}-${selectedFinish}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const cart = readCart();
      const existing = cart.find((item) => item.id === id);
      if (existing) existing.quantity = Math.max(1, Number(existing.quantity) || 0) + 1;
      else cart.push({
        id,
        name: title,
        finish: selectedFinish,
        unitPrice: price,
        quantity: 1,
        image: image?.src ?? "",
        imageAlt: image?.getAttribute("data-alt") ?? `${title} in ${finish}`,
      });

      if (!writeCart(cart)) return;
      updateBagBadge();
      if (label) {
        label.textContent = "Added";
        window.setTimeout(() => { label.textContent = "Add"; }, 1000);
      }
    });
  });

  updateBagBadge();
  window.addEventListener("storage", updateBagBadge);
})();
