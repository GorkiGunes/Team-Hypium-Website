(() => {
  'use strict';
  const TYPES = {
    announcements: { label: 'Duyurular', singular: 'Duyuru' },
    posts: { label: 'Site yazıları & haberler', singular: 'Haber' },
    projects: { label: 'Sosyal sorumluluk', singular: 'Proje' },
    gallery: { label: 'Galeri & fotoğraflar', singular: 'Galeri kaydı' },
    members: { label: 'Takım üyeleri', singular: 'Takım üyesi' }
  };
  const $ = (id) => document.getElementById(id);
  let activeType = 'announcements';
  let items = [];
  let busy = false;
  const api = '/api/admin/items';

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }
  function showNotice(message, error = false) {
    const el = $('notice'); el.hidden = false; el.textContent = message; el.classList.toggle('error', error);
  }
  function hideNotice() { $('notice').hidden = true; }
  function dateLabel(value) {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
  }
  async function request(url, options = {}) {
    const response = await fetch(url, { credentials: 'same-origin', ...options, headers: { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(options.headers || {}) } });
    if (response.status === 401 || response.status === 403) throw new Error('Bu panele erişim yetkiniz yok. Yetkili hesabınızla tekrar giriş yapın.');
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'İşlem tamamlanamadı.');
    return data;
  }
  function updateTitles() {
    $('pageTitle').textContent = TYPES[activeType].label;
    $('listTitle').textContent = `${TYPES[activeType].label} listesi`;
    $('newBtn').textContent = `＋ Yeni ${TYPES[activeType].singular.toLocaleLowerCase('tr-TR')}`;
    document.querySelectorAll('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.type === activeType));
  }
  function render() {
    $('totalCount').textContent = items.length;
    $('publishedCount').textContent = items.filter((item) => item.status === 'published').length;
    $('draftCount').textContent = items.filter((item) => item.status !== 'published').length;
    const body = $('itemsBody');
    if (!items.length) {
      body.innerHTML = `<tr><td colspan="4" class="empty">Bu bölümde henüz içerik yok. “Yeni ${escapeHtml(TYPES[activeType].singular.toLocaleLowerCase('tr-TR'))}” ile başlayın.</td></tr>`;
      return;
    }
    body.innerHTML = items.map((item) => `<tr>
      <td><div class="item-name">${escapeHtml(item.title)}</div><div class="item-summary">${escapeHtml(item.summary || item.body || 'Açıklama eklenmemiş')}</div></td>
      <td><span class="status ${item.status === 'published' ? 'published' : 'draft'}">${item.status === 'published' ? 'Yayında' : 'Taslak'}</span></td>
      <td>${escapeHtml(dateLabel(item.updated_at))}</td>
      <td><div class="actions"><button class="small-btn" data-edit="${escapeHtml(item.id)}">Düzenle</button><button class="small-btn delete" data-delete="${escapeHtml(item.id)}">Sil</button></div></td>
    </tr>`).join('');
  }
  async function loadItems() {
    hideNotice(); $('itemsBody').innerHTML = '<tr><td colspan="4" class="empty">İçerikler yükleniyor…</td></tr>';
    try {
      const data = await request(`${api}?type=${encodeURIComponent(activeType)}`);
      items = data.items || [];
      if (data.userEmail) {
        $('userEmail').textContent = data.userEmail;
        $('userAvatar').textContent = data.userEmail.slice(0, 1).toUpperCase();
      }
      render();
    } catch (error) {
      items = []; render(); showNotice(error.message, true);
    }
  }
  function openEditor(item = null) {
    $('editorForm').dataset.mode = item ? 'edit' : 'create';
    $('editorTitle').textContent = item ? 'İçeriği düzenle' : `Yeni ${TYPES[activeType].singular.toLocaleLowerCase('tr-TR')}`;
    $('itemId').value = item?.id || '';
    $('itemTitle').value = item?.title || '';
    $('itemSummary').value = item?.summary || '';
    $('itemBody').value = item?.body || '';
    $('itemImage').value = item?.image_url || '';
    $('itemStatus').value = item?.status || 'draft';
    $('itemOrder').value = item?.sort_order ?? 0;
    $('imageFile').value = '';
    updatePreview();
    $('editorDialog').showModal();
  }
  function updatePreview() {
    const url = $('itemImage').value.trim();
    const preview = $('imagePreview');
    if (!url) { preview.hidden = true; preview.innerHTML = ''; return; }
    preview.hidden = false;
    preview.innerHTML = `<img alt="Görsel önizlemesi" src="${escapeHtml(url)}" referrerpolicy="no-referrer">`;
  }
  async function saveItem(event) {
    event.preventDefault(); if (busy) return;
    const id = $('itemId').value;
    const payload = { type: activeType, title: $('itemTitle').value.trim(), summary: $('itemSummary').value.trim(), body: $('itemBody').value.trim(), image_url: $('itemImage').value.trim(), status: $('itemStatus').value, sort_order: Number($('itemOrder').value || 0) };
    if (!payload.title) return showNotice('Başlık zorunludur.', true);
    busy = true; $('saveBtn').disabled = true; $('saveBtn').textContent = 'Kaydediliyor…';
    try {
      await request(id ? `${api}/${encodeURIComponent(id)}` : api, { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      $('editorDialog').close(); await loadItems(); showNotice('İçerik başarıyla kaydedildi.');
    } catch (error) { showNotice(error.message, true); }
    finally { busy = false; $('saveBtn').disabled = false; $('saveBtn').textContent = 'Kaydet'; }
  }
  async function deleteItem(id) {
    const item = items.find((entry) => entry.id === id);
    if (!item || !window.confirm(`“${item.title}” kaydını silmek istiyor musunuz? Bu işlem geri alınamaz.`)) return;
    try { await request(`${api}/${encodeURIComponent(id)}`, { method: 'DELETE' }); await loadItems(); showNotice('Kayıt silindi.'); }
    catch (error) { showNotice(error.message, true); }
  }
  async function uploadImage() {
    const file = $('imageFile').files?.[0];
    if (!file) return showNotice('Önce bir görsel seçin.', true);
    if (file.size > 8 * 1024 * 1024) return showNotice('Görsel 8 MB sınırını aşamaz.', true);
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) return showNotice('Yalnızca JPG, PNG, WEBP veya GIF yükleyebilirsiniz.', true);
    const form = new FormData(); form.append('file', file);
    $('uploadBtn').disabled = true; $('uploadBtn').textContent = 'Yükleniyor…';
    try {
      const data = await request('/api/admin/upload', { method: 'POST', body: form });
      $('itemImage').value = data.url; updatePreview(); showNotice('Görsel yüklendi. İçeriği kaydetmeyi unutmayın.');
    } catch (error) { showNotice(error.message, true); }
    finally { $('uploadBtn').disabled = false; $('uploadBtn').textContent = 'Görsel yükle'; }
  }
  document.querySelectorAll('.nav-item').forEach((button) => button.addEventListener('click', () => { activeType = button.dataset.type; updateTitles(); loadItems(); }));
  $('newBtn').addEventListener('click', () => openEditor());
  $('refreshBtn').addEventListener('click', loadItems);
  $('editorForm').addEventListener('submit', saveItem);
  $('closeDialog').addEventListener('click', () => $('editorDialog').close());
  $('cancelBtn').addEventListener('click', () => $('editorDialog').close());
  $('itemImage').addEventListener('input', updatePreview);
  $('uploadBtn').addEventListener('click', uploadImage);
  $('itemsBody').addEventListener('click', (event) => {
    const edit = event.target.closest('[data-edit]'); const del = event.target.closest('[data-delete]');
    if (edit) openEditor(items.find((item) => item.id === edit.dataset.edit));
    if (del) deleteItem(del.dataset.delete);
  });
  $('logoutBtn').addEventListener('click', () => { window.location.assign('/cdn-cgi/access/logout'); });
  updateTitles(); loadItems();
})();
