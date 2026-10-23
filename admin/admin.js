
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const state = {
    section: "announcements",
    items: [],
    loading: false,
    editingId: null
  };

  const sections = {
    announcements: {
      title: "Duyurular",
      listTitle: "Duyuru listesi",
      type: "announcement",
      newLabel: "Yeni duyuru"
    },
    posts: {
      title: "Haberler ve yazılar",
      listTitle: "Haber listesi",
      type: "news",
      newLabel: "Yeni haber"
    },
    projects: {
      title: "Sosyal sorumluluk",
      listTitle: "Proje listesi",
      type: "impact",
      newLabel: "Yeni proje"
    },
    gallery: {
      title: "Galeri ve fotoğraflar",
      listTitle: "Galeri listesi",
      type: "gallery",
      newLabel: "Yeni galeri içeriği"
    },
    members: {
      title: "Takım üyeleri",
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
    return status === "published" ? "Yayında" :
      status === "archived" ? "Arşivlendi" : "Taslak";
  }

  async function api(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers
      }
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
        throw new Error(
          "Bu işlem için yetkin yok veya yönetici erişimi doğrulanamadı."
        );
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
        <tr>
          <td colspan="4" class="empty">
            Bu bölümde henüz içerik yok.
            Yeni bir içerik oluşturabilirsin.
          </td>
        </tr>`;
      renderStats();
      return;
    }

    body.innerHTML = state.items.map((item) => {
      const title = item.title_tr || "Başlıksız içerik";
      const description = item.body_tr || "";

      return `
        <tr>
          <td>
            <div class="item-name">${escapeHTML(title)}</div>
            <div class="item-summary">
              ${escapeHTML(description.slice(0, 140))}
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
        </tr>`;
    }).join("");

    renderStats();
  }

  async function loadItems() {
    clearNotice();

    const section = sections[state.section];

    $("pageTitle").textContent = section.title;
    $("listTitle").textContent = section.listTitle;
    $("newBtn").innerHTML = `<span aria-hidden="true">＋</span> ${escapeHTML(section.newLabel)}`;

    document.querySelectorAll(".nav-item").forEach((button) => {
      const active = button.dataset.type === state.section;
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });

    if (!section.type) {
      state.items = [];
      renderStats();

      $("itemsBody").innerHTML = `
        <tr>
          <td colspan="4" class="empty">
            Takım üyeleri için ayrı bir veritabanı tablosu ve API
            henüz oluşturulmadı. Bu bölüm, o bağlantı hazır olduğunda
            etkinleştirilecek.
          </td>
        </tr>`;

      showNotice("Takım üyeleri bölümü henüz sunucuya bağlanmadı.");
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
        <tr>
          <td colspan="4" class="empty">
            İçerikler yüklenemedi. Sunucu API bağlantısını kontrol et.
          </td>
        </tr>`;

      showNotice(error.message, true);
    } finally {
      state.loading = false;
    }
  }

  function openEditor(item = null) {
    const section = sections[state.section];

    if (!section.type) {
      showNotice(
        "Takım üyeleri için sunucu tarafındaki kayıt sistemi henüz kurulmadı."
      );
      return;
    }

    state.editingId = item?.id ?? null;

    $("editorTitle").textContent = item
      ? "İçeriği düzenle"
      : section.newLabel;

    $("itemId").value = item?.id ?? "";
    $("itemTitle").value = item?.title_tr ?? "";
    $("itemSummary").value = "";
    $("itemBody").value = item?.body_tr ?? "";
    $("itemImage").value = item?.image_url ?? "";
    $("itemStatus").value = item?.status ?? "draft";
    $("itemOrder").value = "0";
    $("imageFile").value = "";

    renderImagePreview(item?.image_url ?? "");

    clearNotice();

    const dialog = $("editorDialog");
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      showNotice("Tarayıcın bu düzenleme penceresini desteklemiyor.", true);
    }
  }

  function closeEditor() {
    $("editorDialog").close();
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
    if (!section.type) return;

    const title = $("itemTitle").value.trim();
    const body = $("itemBody").value.trim();
    const image = $("itemImage").value.trim();
    const status = $("itemStatus").value;

    if (!title) {
      showNotice("Lütfen bir başlık gir.", true);
      return;
    }

    if (!["draft", "published"].includes(status)) {
      showNotice("Geçersiz yayın durumu.", true);
      return;
    }

    if (image) {
      try {
        const parsed = new URL(image, location.origin);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          throw new Error();
        }
      } catch {
        showNotice("Görsel adresi geçerli bir HTTP veya HTTPS adresi olmalı.", true);
        return;
      }
    }

    const payload = {
      type: section.type,
      title_tr: title,
      body_tr: body,
      image_url: image || null,
      status
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
      showNotice(
        `${error.message} İçerik kaydedilmiş kabul edilmedi; tekrar kontrol et.`,
        true
      );
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = "Kaydet";
    }
  }

  async function deleteItem(id) {
    const item = state.items.find((entry) => String(entry.id) === String(id));
    if (!item) return;

    const confirmed = window.confirm(
      `"${item.title_tr || "Başlıksız içerik"}" silinsin mi? Bu işlem geri alınamayabilir.`
    );

    if (!confirmed) return;

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

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (!allowed.includes(file.type)) {
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

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "same-origin",
        body: form,
        headers: { Accept: "application/json" }
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error || `Görsel yüklenemedi (HTTP ${response.status}).`
        );
      }

      if (typeof result.url !== "string" || !result.url.trim()) {
        throw new Error("Sunucu yüklenen görselin adresini döndürmedi.");
      }

      $("itemImage").value = result.url;
      renderImagePreview(result.url);
      showNotice("Görsel yüklendi. Kaydet'e basarak içeriğe bağla.");
    } catch (error) {
      showNotice(error.message, true);
    } finally {
      button.disabled = false;
      button.textContent = "Görsel yükle";
    }
  }

  function bindEvents() {
    $("navigation").addEventListener("click", (event) => {
      const button = event.target.closest("[data-type]");
      if (!button) return;

      state.section = button.dataset.type;
      loadItems();
    });

    $("newBtn").addEventListener("click", () => openEditor());
    $("refreshBtn").addEventListener("click", loadItems);
    $("editorForm").addEventListener("submit", saveItem);
    $("closeDialog").addEventListener("click", closeEditor);
    $("cancelBtn").addEventListener("click", closeEditor);
    $("uploadBtn").addEventListener("click", uploadImage);

    $("itemImage").addEventListener("change", (event) => {
      renderImagePreview(event.target.value.trim());
    });

    $("itemsBody").addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;

      const item = state.items.find(
        (entry) => String(entry.id) === button.dataset.id
      );

      if (button.dataset.action === "edit" && item) {
        openEditor(item);
      } else if (button.dataset.action === "delete") {
        deleteItem(button.dataset.id);
      }
    });

    $("logoutBtn").addEventListener("click", () => {
      showNotice(
        "Güvenli çıkış için Cloudflare Access oturumunu kapatmalısın. " +
        "Sunucu tarafında bir çıkış uç noktası henüz yapılandırılmadı."
      );
    });

    $("editorDialog").addEventListener("click", (event) => {
      if (event.target === $("editorDialog")) closeEditor();
    });
  }

  function start() {
    bindEvents();
    loadItems();

    // Access kullanılıyorsa e-posta bilgisi mevcut değilken
    // sahte bir kullanıcı adı üretme.
    $("userEmail").textContent = "Yetkili oturumu";
    $("userAvatar").textContent = "H";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
