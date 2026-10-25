
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const state = {
    section: "announcements",
    items: [],
    loading: false,
    editingId: null,
    impact: {
      events: [],
      eventTranslations: [],
      stats: [],
      statTranslations: [],
      mapPoints: [],
      mapTranslations: [],
      media: []
    },
    impactTab: "events",
    impactEditing: null
  };

  const languages = [
    { id: "tr", label: "Türkçe" },
    { id: "en", label: "English" },
    { id: "de", label: "Deutsch" },
    { id: "fr", label: "Français" }
  ];

  const sections = {
    announcements: {
      title: "Duyurular",
      listTitle: "Duyuru listesi",
      type: "announcement",
      newLabel: "Yeni duyuru"
    },
    impactAdmin: {
      title: "Impact",
      listTitle: "Sosyal etki içerikleri",
      type: null,
      newLabel: "Yeni etkinlik"
    },
    gallery: {
      title: "Galeri",
      listTitle: "Galeri listesi",
      type: "gallery",
      newLabel: "Yeni galeri içeriği"
    },
    posts: {
      title: "Haberler ve Yazılar",
      listTitle: "Haber ve yazı listesi",
      type: "news",
      newLabel: "Yeni haber"
    },
    members: {
      title: "Takımdaki Kişiler",
      listTitle: "Takım üyeleri",
      type: null,
      newLabel: "Yeni üye"
    }
  };

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function showNotice(message, isError = false) {
    const notice = $("notice");
    if (!notice) return;
    notice.textContent = message;
    notice.classList.toggle("error", isError);
    notice.hidden = false;
  }

  function clearNotice() {
    const notice = $("notice");
    if (notice) notice.hidden = true;
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("tr-TR", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(date);
  }

  function statusLabel(status) {
    return status === "published"
      ? "Yayında"
      : status === "archived"
        ? "Arşivlendi"
        : "Taslak";
  }

  async function api(url, options = {}) {
    const headers = {
      Accept: "application/json",
      ...(options.body && !(options.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers
    };

    const response = await fetch(url, {
      credentials: "same-origin",
      ...options,
      headers
    });

    const raw = await response.text();
    let data = {};

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      throw new Error(
        `Sunucudan beklenmeyen yanıt geldi (HTTP ${response.status}).`
      );
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Yetkili oturumu doğrulanamadı. Girişini kontrol et.");
      }
      throw new Error(
        data.error || `İstek başarısız oldu (HTTP ${response.status}).`
      );
    }

    return data;
  }

  function renderStats() {
    $("totalCount").textContent = state.items.length;
    $("publishedCount").textContent =
      state.items.filter((item) => item.status === "published").length;
    $("draftCount").textContent =
      state.items.filter((item) => item.status === "draft").length;
  }

  function renderItems() {
    const body = $("itemsBody");

    if (!state.items.length) {
      body.innerHTML = `
        <tr><td colspan="4" class="empty">
          Bu bölümde henüz içerik yok.
        </td></tr>`;
      renderStats();
      return;
    }

    body.innerHTML = state.items.map((item) => `
      <tr>
        <td>
          <div class="item-name">
            ${escapeHTML(item.title_tr || item.title || "Başlıksız içerik")}
          </div>
          <div class="item-summary">
            ${escapeHTML((item.body_tr || item.summary || "").slice(0, 140))}
          </div>
        </td>
        <td>
          <span class="status ${item.status === "published" ? "published" : "draft"}">
            ${escapeHTML(statusLabel(item.status))}
          </span>
        </td>
        <td>${escapeHTML(formatDate(item.updated_at || item.created_at))}</td>
        <td>
          <div class="actions">
            <button class="small-btn" data-action="edit"
                    data-id="${escapeHTML(item.id)}">Düzenle</button>
            <button class="small-btn delete" data-action="delete"
                    data-id="${escapeHTML(item.id)}">Sil</button>
          </div>
        </td>
      </tr>
    `).join("");

    renderStats();
  }

  async function loadItems() {
    clearNotice();

    const section = sections[state.section];
    if (!section) return;

    $("pageTitle").textContent = section.title;
    $("listTitle").textContent = section.listTitle;
    $("newBtn").hidden = state.section === "impactAdmin" ||
      state.section === "members";

    $("newBtn").innerHTML =
      `<span aria-hidden="true">＋</span> ${escapeHTML(section.newLabel)}`;

    $("welcomeDescription").textContent = {
      announcements: "Duyurularını yönet ve ana sitedeki bildirim alanına hazırla.",
      impactAdmin: "Etkinlikleri, istatistikleri, harita noktalarını ve fotoğrafları yönet.",
      gallery: "Takım galerisi içeriklerini yönet.",
      posts: "Haberleri ve yazıları oluştur, düzenle ve yayımla.",
      members: "Hypium takım üyelerini yönet."
    }[state.section];

    document.querySelectorAll(".nav-item").forEach((button) => {
      const active = button.dataset.type === state.section;
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });

    if (state.section === "impactAdmin") {
      $("sectionTools").hidden = false;
      await loadImpact();
      return;
    }

    $("sectionTools").hidden = true;
    $("tableHead").innerHTML = `
      <tr>
        <th scope="col">İÇERİK</th>
        <th scope="col">DURUM</th>
        <th scope="col">SON GÜNCELLEME</th>
        <th scope="col">İŞLEM</th>
      </tr>`;

    if (state.section === "members") {
      state.items = [];
      renderStats();
      $("itemsBody").innerHTML = `
        <tr><td colspan="4" class="empty">
          Takım üyeleri için sunucu tarafında kayıt API'si kurulmalı.
          Bu bölüm henüz kalıcı kayıt yapmıyor.
        </td></tr>`;
      showNotice("Üye yönetimi API'si henüz yapılandırılmadı.");
      return;
    }

    state.loading = true;
    $("itemsBody").innerHTML = `
      <tr><td colspan="4" class="empty">İçerikler yükleniyor…</td></tr>`;

    try {
      const result = await api(
        `/api/admin/items?type=${encodeURIComponent(section.type)}`
      );

      if (!Array.isArray(result.items)) {
        throw new Error("API yanıtında içerik listesi bulunamadı.");
      }

      state.items = result.items;
      renderItems();
    } catch (error) {
      state.items = [];
      renderStats();
      $("itemsBody").innerHTML = `
        <tr><td colspan="4" class="empty">İçerikler yüklenemedi.</td></tr>`;
      showNotice(error.message, true);
    } finally {
      state.loading = false;
    }
  }

  /* GENEL İÇERİK EDİTÖRÜ */

  function openEditor(item = null) {
    const section = sections[state.section];

    if (!section?.type) {
      showNotice("Bu bölüm için genel içerik düzenleyicisi kullanılamaz.", true);
      return;
    }

    state.editingId = item?.id ?? null;
    $("editorTitle").textContent = item
      ? "İçeriği düzenle"
      : section.newLabel;

    $("itemId").value = item?.id ?? "";
    $("itemTitle").value = item?.title_tr ?? item?.title ?? "";
    $("itemSummary").value = item?.summary_tr ?? item?.summary ?? "";
    $("itemBody").value = item?.body_tr ?? item?.body ?? "";
    $("itemImage").value = item?.image_url ?? "";
    $("itemStatus").value = item?.status ?? "draft";
    $("itemOrder").value = item?.sort_order ?? 0;
    $("imageFile").value = "";

    renderImagePreview(item?.image_url ?? "");
    clearNotice();

    if (typeof $("editorDialog").showModal === "function") {
      $("editorDialog").showModal();
    } else {
      showNotice("Tarayıcın bu düzenleme penceresini desteklemiyor.", true);
    }
  }

  function closeEditor() {
    if ($("editorDialog").open) $("editorDialog").close();
    state.editingId = null;
  }

  function renderImagePreview(url) {
    const preview = $("imagePreview");
    preview.replaceChildren();

    if (!url) {
      preview.hidden = true;
      return;
    }

    try {
      const parsed = new URL(url, location.origin);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        preview.hidden = true;
        return;
      }

      const image = document.createElement("img");
      image.src = parsed.href;
      image.alt = "İçerik görseli önizlemesi";
      image.referrerPolicy = "no-referrer";
      image.addEventListener("error", () => {
        preview.hidden = true;
      });

      preview.appendChild(image);
      preview.hidden = false;
    } catch {
      preview.hidden = true;
    }
  }

  async function saveItem(event) {
    event.preventDefault();
    clearNotice();

    const section = sections[state.section];
    if (!section?.type) return;

    const title = $("itemTitle").value.trim();
    const summary = $("itemSummary").value.trim();
    const body = $("itemBody").value.trim();
    const image = $("itemImage").value.trim();
    const status = $("itemStatus").value;
    const sortOrder = Number($("itemOrder").value || 0);

    if (!title) {
      showNotice("Lütfen bir başlık gir.", true);
      return;
    }

    if (!["draft", "published"].includes(status)) {
      showNotice("Geçersiz yayın durumu.", true);
      return;
    }

    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      showNotice("Sıralama sıfır veya daha büyük bir tam sayı olmalı.", true);
      return;
    }

    if (image) {
      try {
        const parsed = new URL(image, location.origin);
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
      } catch {
        showNotice("Görsel adresi geçerli bir HTTP veya HTTPS adresi olmalı.", true);
        return;
      }
    }

    const payload = {
      type: section.type,
      title_tr: title,
      summary_tr: summary,
      body_tr: body,
      image_url: image || null,
      status,
      sort_order: sortOrder
    };

    const saveButton = $("saveBtn");
    saveButton.disabled = true;
    saveButton.textContent = "Kaydediliyor…";

    try {
      const editing = Boolean(state.editingId);
      const endpoint = editing
        ? `/api/admin/items/${encodeURIComponent(state.editingId)}`
        : "/api/admin/items";

      await api(endpoint, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });

      closeEditor();
      await loadItems();
      showNotice("İçerik başarıyla kaydedildi.");
    } catch (error) {
      showNotice(`${error.message} İçeriğin kaydedildiğini varsayma.`, true);
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = "Kaydet";
    }
  }

  async function deleteItem(id) {
    const item = state.items.find((entry) => String(entry.id) === String(id));
    if (!item) return;

    const title = item.title_tr || item.title || "Başlıksız içerik";
    if (!window.confirm(`"${title}" silinsin mi?`)) return;

    try {
      await api(`/api/admin/items/${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
      await loadItems();
      showNotice("İçerik silindi.");
    } catch (error) {
      showNotice(error.message, true);
    }
  }

  async function uploadImage() {
    const file = $("imageFile").files?.[0];

    if (!file) {
      showNotice("Önce bir görsel dosyası seç.", true);
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      showNotice("Yalnızca JPG, PNG, WEBP veya GIF dosyası yükleyebilirsin.", true);
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showNotice("Görsel en fazla 8 MB olabilir.", true);
      return;
    }

    const button = $("uploadBtn");
    button.disabled = true;
    button.textContent = "Yükleniyor…";

    try {
      const form = new FormData();
      form.append("file", file);

      const result = await api("/api/admin/upload", {
        method: "POST",
        body: form
      });

      if (typeof result.url !== "string" || !result.url.trim()) {
        throw new Error("Sunucu görsel adresini döndürmedi.");
      }

      $("itemImage").value = result.url;
      renderImagePreview(result.url);
      showNotice("Görsel yüklendi. İçeriğe bağlamak için Kaydet'e bas.");
    } catch (error) {
      showNotice(error.message, true);
    } finally {
      button.disabled = false;
      button.textContent = "Görsel yükle";
    }
  }

  /* IMPACT */

  async function loadImpact() {
    $("itemsBody").innerHTML = `
      <tr><td colspan="4" class="empty">Impact kayıtları yükleniyor…</td></tr>`;

    try {
      const result = await api("/api/admin/impact");

      for (const key of Object.keys(state.impact)) {
        if (Array.isArray(result[key])) state.impact[key] = result[key];
      }

      renderImpact();
    } catch (error) {
      $("itemsBody").innerHTML = `
        <tr><td colspan="4" class="empty">Impact kayıtları yüklenemedi.</td></tr>`;
      showNotice(`${error.message} Impact API'sini kontrol et.`, true);
    }
  }

  function translationFor(collection, id, language) {
    return collection.find((row) =>
      String(row.event_id ?? row.stat_id ?? row.point_id) === String(id) &&
      row.language === language
    ) || {};
  }

  function translatedTitle(collection, id, fallback = "Başlıksız") {
    return translationFor(collection, id, "tr").title || fallback;
  }

  function impactTabs() {
    const tabs = [
      ["events", "Etkinlikler"],
      ["stats", "İstatistikler"],
      ["map", "Harita noktaları"],
      ["media", "Fotoğraflar"]
    ];

    return `
      <div class="impact-tabs" role="tablist" aria-label="Impact içerik türü">
        ${tabs.map(([id, label]) => `
          <button type="button"
            class="small-btn ${state.impactTab === id ? "active" : ""}"
            data-impact-tab="${id}"
            role="tab"
            aria-selected="${state.impactTab === id}">
            ${label}
          </button>
        `).join("")}
      </div>
      <p class="field-help">
        Değişiklikler sunucuya gönderilir. Yayın durumu, ziyaretçilere
        gösterilip gösterilmeyeceğini belirler.
      </p>`;
  }

  function impactStatus(value) {
    return Number(value) === 1
      ? '<span class="status published">Yayında</span>'
      : '<span class="status draft">Taslak</span>';
  }

  function emptyRow(message) {
    return `<tr><td colspan="4" class="empty">${escapeHTML(message)}</td></tr>`;
  }

  function renderImpact() {
    $("sectionTools").innerHTML = impactTabs();

    const { events, stats, mapPoints, media } = state.impact;
    const total = {
      events: events.length,
      stats: stats.length,
      map: mapPoints.length,
      media: media.length
    };

    $("totalCount").textContent = total[state.impactTab] ?? 0;

    if (state.impactTab === "events") {
      $("listTitle").textContent = "Sosyal etki etkinlikleri";
      $("listDescription").textContent = "Etkinlikleri ve çevirilerini yönet.";
      $("newBtn").hidden = false;
      $("newBtn").textContent = "＋ Yeni etkinlik";
      $("tableHead").innerHTML =
        "<tr><th>ETKİNLİK</th><th>DURUM</th><th>KATILIM</th><th>İŞLEM</th></tr>";

      $("itemsBody").innerHTML = events.length ? events.map((item) => `
        <tr>
          <td>
            <div class="item-name">
              ${escapeHTML(translatedTitle(state.impact.eventTranslations, item.id))}
            </div>
            <div class="item-summary">${escapeHTML(item.event_date || "Tarih belirtilmedi")}</div>
          </td>
          <td>${impactStatus(item.is_published)}</td>
          <td>${escapeHTML(item.people_reached ?? 0)} kişi</td>
          <td><div class="actions">
            <button class="small-btn" data-impact-edit="event" data-id="${escapeHTML(item.id)}">Düzenle</button>
            <button class="small-btn delete" data-impact-delete="event" data-id="${escapeHTML(item.id)}">Sil</button>
          </div></td>
        </tr>
      `).join("") : emptyRow("Henüz etkinlik yok.");
    } else if (state.impactTab === "stats") {
      $("listTitle").textContent = "Impact istatistikleri";
      $("listDescription").textContent = "Web sitesindeki etki sayılarını yönet.";
      $("newBtn").hidden = false;
      $("newBtn").textContent = "＋ Yeni istatistik";
      $("tableHead").innerHTML =
        "<tr><th>İSTATİSTİK</th><th>DEĞER</th><th>DURUM</th><th>İŞLEM</th></tr>";

      $("itemsBody").innerHTML = stats.length ? stats.map((item) => `
        <tr>
          <td>
            <div class="item-name">
              ${escapeHTML(translatedTitle(state.impact.statTranslations, item.id))}
            </div>
            <div class="item-summary">${escapeHTML(item.stat_key)}</div>
          </td>
          <td>${escapeHTML(item.value)} ${escapeHTML(item.unit || "")}</td>
          <td>${impactStatus(item.is_published)}</td>
          <td><div class="actions">
            <button class="small-btn" data-impact-edit="stat" data-id="${escapeHTML(item.id)}">Düzenle</button>
            <button class="small-btn delete" data-impact-delete="stat" data-id="${escapeHTML(item.id)}">Sil</button>
          </div></td>
        </tr>
      `).join("") : emptyRow("Henüz istatistik yok.");
    } else if (state.impactTab === "map") {
      $("listTitle").textContent = "Harita noktaları";
      $("listDescription").textContent = "Impact haritasındaki konumları yönet.";
      $("newBtn").hidden = false;
      $("newBtn").textContent = "＋ Harita noktası";
      $("tableHead").innerHTML =
        "<tr><th>KONUM</th><th>KOORDİNATLAR</th><th>DURUM</th><th>İŞLEM</th></tr>";

      $("itemsBody").innerHTML = mapPoints.length ? mapPoints.map((item) => `
        <tr>
          <td>${escapeHTML(translatedTitle(state.impact.mapTranslations, item.id))}</td>
          <td>${escapeHTML(item.latitude)}, ${escapeHTML(item.longitude)}</td>
          <td>${impactStatus(item.is_published)}</td>
          <td><div class="actions">
            <button class="small-btn" data-impact-edit="map" data-id="${escapeHTML(item.id)}">Düzenle</button>
            <button class="small-btn delete" data-impact-delete="map" data-id="${escapeHTML(item.id)}">Sil</button>
          </div></td>
        </tr>
      `).join("") : emptyRow("Henüz harita noktası yok.");
    } else {
      $("listTitle").textContent = "Etkinlik fotoğrafları";
      $("listDescription").textContent = "Etkinlik fotoğraflarını yükle ve yönet.";
      $("newBtn").hidden = true;
      $("tableHead").innerHTML =
        "<tr><th>FOTOĞRAF</th><th>ETKİNLİK</th><th>AÇIKLAMA</th><th>İŞLEM</th></tr>";

      const rows = media.map((photo) => {
        const event = events.find((entry) =>
          String(entry.id) === String(photo.event_id)
        );

        return `
          <tr>
            <td>
              <img src="/api/impact-media/${encodeURIComponent(photo.object_key)}"
                   alt="${escapeHTML(photo.alt_text || "Etkinlik fotoğrafı")}"
                   loading="lazy"
                   style="width:84px;height:58px;object-fit:cover;border-radius:5px">
            </td>
            <td>${escapeHTML(event
              ? translatedTitle(state.impact.eventTranslations, event.id)
              : "Etkinliğe bağlı değil")}</td>
            <td>${escapeHTML(photo.alt_text || "—")}</td>
            <td>
              <button class="small-btn delete"
                data-impact-delete="media" data-id="${escapeHTML(photo.id)}">Sil</button>
            </td>
          </tr>`;
      }).join("");

      $("itemsBody").innerHTML = `
        <tr><td colspan="4">
          <form id="impactMediaForm" class="impact-media-form">
            <label for="impactMediaEvent">Etkinlik</label>
            <select id="impactMediaEvent" name="event_id">
              <option value="">Etkinlik seç (isteğe bağlı)</option>
              ${events.map((item) => `
                <option value="${escapeHTML(item.id)}">
                  ${escapeHTML(translatedTitle(state.impact.eventTranslations, item.id))}
                </option>`).join("")}
            </select>

            <label for="impactMediaAlt">Fotoğraf açıklaması</label>
            <input id="impactMediaAlt" name="alt_text" maxlength="300">

            <label for="impactMediaFile">Fotoğraf dosyası</label>
            <input id="impactMediaFile" name="file" type="file"
                   accept="image/jpeg,image/png,image/webp" required>

            <button class="btn btn-primary" type="submit">Fotoğraf yükle</button>
          </form>
        </td></tr>
        ${rows || emptyRow("Henüz fotoğraf yok.")}`;
    }

    const collection = state.impactTab === "events" ? events
      : state.impactTab === "stats" ? stats
      : state.impactTab === "map" ? mapPoints : media;

    const published = collection.filter((item) =>
      state.impactTab === "media" || Number(item.is_published) === 1
    ).length;

    $("publishedCount").textContent = published;
    $("draftCount").textContent = Math.max(0, collection.length - published);
  }

  function languageFields(translations, id, kind) {
    return languages.map((language) => {
      const translation = translationFor(translations, id, language.id);

      return `
        <fieldset class="impact-language">
          <legend>${language.label}</legend>
          <label>Başlık (${language.id})</label>
          <input name="title_${language.id}" maxlength="180"
                 value="${escapeHTML(translation.title || "")}"
                 ${language.id === "tr" ? "required" : ""}>
          <label>Açıklama (${language.id})</label>
          <textarea name="description_${language.id}" rows="3"
                    maxlength="5000">${escapeHTML(translation.description || "")}</textarea>
          ${kind === "event" ? `
            <label>Konum adı (${language.id})</label>
            <input name="location_${language.id}" maxlength="240"
                   value="${escapeHTML(translation.location_name || "")}">
          ` : ""}
        </fieldset>`;
    }).join("");
  }

  function openImpactDialog(kind, item = null) {
    state.impactEditing = { kind, id: item?.id || null };

    const id = item?.id || "";
    let title;
    let fields;

    if (kind === "event") {
      title = item ? "Etkinliği düzenle" : "Yeni etkinlik";
      fields = `
        <label>Etkinlik tarihi</label>
        <input name="event_date" type="date" value="${escapeHTML(item?.event_date || "")}">
        <div class="form-grid">
          <div><label>Enlem</label><input name="latitude" type="number" step="any" value="${escapeHTML(item?.latitude ?? "")}"></div>
          <div><label>Boylam</label><input name="longitude" type="number" step="any" value="${escapeHTML(item?.longitude ?? "")}"></div>
        </div>
        <label>Ulaşılan kişi sayısı</label>
        <input name="people_reached" type="number" min="0" value="${escapeHTML(item?.people_reached ?? 0)}" required>
        <label>Sıralama</label>
        <input name="sort_order" type="number" min="0" value="${escapeHTML(item?.sort_order ?? 0)}">
        <label>Yayın durumu</label>
        <select name="is_published">
          <option value="0" ${Number(item?.is_published) !== 1 ? "selected" : ""}>Taslak</option>
          <option value="1" ${Number(item?.is_published) === 1 ? "selected" : ""}>Yayında</option>
        </select>
        <h3>Dil seçenekleri</h3>
        ${languageFields(state.impact.eventTranslations, id, "event")}`;
    } else if (kind === "stat") {
      title = item ? "İstatistiği düzenle" : "Yeni istatistik";
      fields = `
        <label>İstatistik anahtarı</label>
        <input name="stat_key" maxlength="100" value="${escapeHTML(item?.stat_key || "")}" required>
        <div class="form-grid">
          <div><label>Değer</label><input name="value" type="number" step="any" value="${escapeHTML(item?.value ?? 0)}" required></div>
          <div><label>Hedef</label><input name="target" type="number" step="any" value="${escapeHTML(item?.target ?? "")}"></div>
        </div>
        <label>Birim</label>
        <input name="unit" maxlength="40" value="${escapeHTML(item?.unit || "")}">
        <label>Sıralama</label>
        <input name="sort_order" type="number" min="0" value="${escapeHTML(item?.sort_order ?? 0)}">
        <label>Yayın durumu</label>
        <select name="is_published">
          <option value="0" ${Number(item?.is_published) !== 1 ? "selected" : ""}>Taslak</option>
          <option value="1" ${Number(item?.is_published) === 1 ? "selected" : ""}>Yayında</option>
        </select>
        <h3>Dil seçenekleri</h3>
        ${languageFields(state.impact.statTranslations, id, "stat")}`;
    } else {
      title = item ? "Harita noktasını düzenle" : "Yeni harita noktası";
      fields = `
        <div class="form-grid">
          <div><label>Enlem</label><input name="latitude" type="number" step="any" value="${escapeHTML(item?.latitude ?? "")}" required></div>
          <div><label>Boylam</label><input name="longitude" type="number" step="any" value="${escapeHTML(item?.longitude ?? "")}" required></div>
        </div>
        <label>İlişkili etkinlik</label>
        <select name="event_id">
          <option value="">Etkinliğe bağlama</option>
          ${state.impact.events.map((event) => `
            <option value="${escapeHTML(event.id)}"
              ${String(item?.event_id || "") === String(event.id) ? "selected" : ""}>
              ${escapeHTML(translatedTitle(state.impact.eventTranslations, event.id))}
            </option>`).join("")}
        </select>
        <label>Sıralama</label>
        <input name="sort_order" type="number" min="0" value="${escapeHTML(item?.sort_order ?? 0)}">
        <label>Yayın durumu</label>
        <select name="is_published">
          <option value="0" ${Number(item?.is_published) !== 1 ? "selected" : ""}>Taslak</option>
          <option value="1" ${Number(item?.is_published) === 1 ? "selected" : ""}>Yayında</option>
        </select>
        <h3>Dil seçenekleri</h3>
        ${languageFields(state.impact.mapTranslations, id, "map")}`;
    }

    let dialog = $("impactEditorDialog");

    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.id = "impactEditorDialog";
      dialog.className = "editor-dialog";
      document.body.appendChild(dialog);
    }

    dialog.innerHTML = `
      <form id="impactEditorForm">
        <div class="dialog-head">
          <div>
            <div class="eyebrow">HYPIUM / IMPACT</div>
            <h2>${escapeHTML(title)}</h2>
          </div>
          <button type="button" class="close-btn" data-impact-close aria-label="Kapat">×</button>
        </div>
        ${fields}
        <div class="dialog-actions">
          <button type="button" class="btn btn-quiet" data-impact-close>Vazgeç</button>
          <button type="submit" class="btn btn-primary" id="impactSaveBtn">Kaydet</button>
        </div>
      </form>`;

    dialog.querySelectorAll("[data-impact-close]").forEach((button) => {
      button.addEventListener("click", () => dialog.close());
    });

    dialog.querySelector("form").addEventListener("submit", saveImpactRecord);

    if (!dialog.open) dialog.showModal();
  }

  function readTranslations(form, kind) {
    return languages.map((language) => ({
      language: language.id,
      title: form.elements[`title_${language.id}`]?.value.trim() || "",
      description: form.elements[`description_${language.id}`]?.value.trim() || "",
      ...(kind === "event" ? {
        location_name: form.elements[`location_${language.id}`]?.value.trim() || ""
      } : {})
    }));
  }

  async function saveImpactRecord(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const saveButton = $("impactSaveBtn");
    const current = state.impactEditing;
    if (!current || !saveButton) return;

    const { kind } = current;
    let id = current.id || null;

    try {
      const translations = readTranslations(form, kind);
      const validTranslations = translations.filter((item) => item.title);
      if (!validTranslations.some((item) => item.language === "tr")) {
        throw new Error("Türkçe başlık zorunludur.");
      }

      let action;
      let record;

      if (kind === "event") {
        action = "save_event";
        record = {
          event_date: form.elements.event_date.value || null,
          latitude: optionalNumber(form.elements.latitude.value),
          longitude: optionalNumber(form.elements.longitude.value),
          people_reached: requiredNumber(form.elements.people_reached.value, "Ulaşılan kişi"),
          sort_order: requiredNumber(form.elements.sort_order.value || "0", "Sıralama"),
          is_published: Number(form.elements.is_published.value)
        };
      } else if (kind === "stat") {
        action = "save_stat";
        record = {
          stat_key: form.elements.stat_key.value.trim(),
          value: requiredNumber(form.elements.value.value, "Değer"),
          target: optionalNumber(form.elements.target.value),
          unit: form.elements.unit.value.trim(),
          sort_order: requiredNumber(form.elements.sort_order.value || "0", "Sıralama"),
          is_published: Number(form.elements.is_published.value)
        };
      } else {
        action = "save_map_point";
        record = {
          latitude: requiredNumber(form.elements.latitude.value, "Enlem"),
          longitude: requiredNumber(form.elements.longitude.value, "Boylam"),
          event_id: form.elements.event_id.value || null,
          sort_order: requiredNumber(form.elements.sort_order.value || "0", "Sıralama"),
          is_published: Number(form.elements.is_published.value)
        };
      }

      saveButton.disabled = true;
      saveButton.textContent = "Kaydediliyor…";

      const ordered = [
        ...validTranslations.filter((item) => item.language === "tr"),
        ...validTranslations.filter((item) => item.language !== "tr")
      ];

      for (const translation of ordered) {
        const result = await api("/api/admin/impact", {
          method: "POST",
          body: JSON.stringify({
            action,
            ...record,
            ...(id ? { id } : {}),
            language: translation.language,
            title: translation.title,
            description: translation.description,
            ...(kind === "event" ? { location_name: translation.location_name } : {})
          })
        });

        if (!result.success || !result.id) {
          throw new Error(`${translation.language.toUpperCase()} kaydı onaylanmadı.`);
        }

        id = result.id;
      }

      const dialog = $("impactEditorDialog");
      if (dialog?.open) dialog.close();
      state.impactEditing = null;
      await loadImpact();
      showNotice("Impact kaydı kaydedildi.");
    } catch (error) {
      showNotice(
        `${error.message} Kısmi kayıt oluşmuş olabilir; listeyi yenileyip kontrol et.`,
        true
      );
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = "Kaydet";
    }
  }

  function requiredNumber(value, label) {
    if (value === "" || !Number.isFinite(Number(value))) {
      throw new Error(`${label} alanına geçerli bir sayı gir.`);
    }
    return Number(value);
  }

  function optionalNumber(value) {
    if (value === "") return null;
    const number = Number(value);
    if (!Number.isFinite(number)) {
      throw new Error("Sayısal alanlardan birinde geçersiz değer var.");
    }
    return number;
  }

  async function deleteImpactRecord(kind, id) {
    const config = {
      event: { action: "delete_event", label: "etkinlik" },
      stat: { action: "delete_stat", label: "istatistik" },
      map: { action: "delete_map_point", label: "harita noktası" },
      media: { action: "delete", label: "fotoğraf" }
    }[kind];

    if (!config) return;
    if (!window.confirm(`Bu ${config.label} silinsin mi?`)) return;

    try {
      if (kind === "media") {
        const form = new FormData();
        form.append("action", "delete");
        form.append("id", id);

        await api("/api/admin/impact-media", {
          method: "POST",
          body: form
        });
      } else {
        await api("/api/admin/impact", {
          method: "POST",
          body: JSON.stringify({ action: config.action, id })
        });
      }

      await loadImpact();
      showNotice(`${config.label} silindi.`);
    } catch (error) {
      showNotice(error.message, true);
    }
  }

  async function uploadImpactMedia(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const file = form.elements.file.files?.[0];

    if (!file) {
      showNotice("Önce bir fotoğraf seç.", true);
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      showNotice("Yalnızca JPG, PNG veya WEBP fotoğraf yükleyebilirsin.", true);
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showNotice("Fotoğraf en fazla 8 MB olabilir.", true);
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = "Yükleniyor…";

    try {
      const data = new FormData();
      data.append("file", file);
      data.append("event_id", form.elements.event_id.value);
      data.append("alt_text", form.elements.alt_text.value.trim());
      data.append("sort_order", String(state.impact.media.length));

      await api("/api/admin/impact-media", {
        method: "POST",
        body: data
      });

      await loadImpact();
      showNotice("Fotoğraf yüklendi.");
    } catch (error) {
      showNotice(error.message, true);
    } finally {
      button.disabled = false;
      button.textContent = "Fotoğraf yükle";
    }
  }

  function handleImpactClick(event) {
    const tab = event.target.closest("[data-impact-tab]");
    if (tab) {
      state.impactTab = tab.dataset.impactTab;
      clearNotice();
      renderImpact();
      return;
    }

    const edit = event.target.closest("[data-impact-edit]");
    if (edit) {
      const kind = edit.dataset.impactEdit;
      const collection = {
        event: state.impact.events,
        stat: state.impact.stats,
        map: state.impact.mapPoints
      }[kind];

      const item = collection?.find((entry) => String(entry.id) === edit.dataset.id);
      if (item) openImpactDialog(kind, item);
      return;
    }

    const remove = event.target.closest("[data-impact-delete]");
    if (remove) {
      deleteImpactRecord(remove.dataset.impactDelete, remove.dataset.id);
    }
  }

  function newImpactRecord() {
    const kind = {
      events: "event",
      stats: "stat",
      map: "map"
    }[state.impactTab];

    if (kind) openImpactDialog(kind);
  }

  function bindEvents() {
    $("navigation").addEventListener("click", (event) => {
      const button = event.target.closest("[data-type]");
      if (!button) return;
      state.section = button.dataset.type;
      loadItems();
    });

    $("newBtn").addEventListener("click", () => {
      if (state.section === "impactAdmin") newImpactRecord();
      else openEditor();
    });

    $("refreshBtn").addEventListener("click", () => {
      if (state.section === "impactAdmin") loadImpact();
      else loadItems();
    });

    $("editorForm").addEventListener("submit", saveItem);
    $("closeDialog").addEventListener("click", closeEditor);
    $("cancelBtn").addEventListener("click", closeEditor);
    $("uploadBtn").addEventListener("click", uploadImage);

    $("itemImage").addEventListener("change", (event) => {
      renderImagePreview(event.target.value.trim());
    });

    $("itemsBody").addEventListener("click", (event) => {
      if (state.section === "impactAdmin") {
        handleImpactClick(event);
        return;
      }

      const button = event.target.closest("[data-action]");
      if (!button) return;

      const item = state.items.find((entry) => String(entry.id) === button.dataset.id);
      if (button.dataset.action === "edit" && item) openEditor(item);
      if (button.dataset.action === "delete") deleteItem(button.dataset.id);
    });

    $("itemsBody").addEventListener("submit", (event) => {
      if (event.target.id === "impactMediaForm") uploadImpactMedia(event);
    });

    $("sectionTools").addEventListener("click", handleImpactClick);

    $("logoutBtn").addEventListener("click", () => {
      showNotice(
        "Çıkış işlemi için sunucu tarafında güvenli bir çıkış API'si yapılandırılmalı.",
        true
      );
    });

    $("editorDialog").addEventListener("click", (event) => {
      if (event.target === $("editorDialog")) closeEditor();
    });
  }

  function start() {
    bindEvents();
    $("userEmail").textContent = "Yetkili oturumu";
    $("userAvatar").textContent = "H";
    loadItems();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
