(function () {
  let popupItems = [];
  let editingPopupId = null;
  const $ = id => document.getElementById(id);
  const headers = (json = false) => ({
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${localStorage.getItem('admin_session') || ''}`
  });

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[char]);

  async function loadPopups() {
    const response = await fetch('/api/banners');
    if (!response.ok) return;
    popupItems = (await response.json()).filter(item => item.type === 'popup');
    renderPopups();
  }

  function renderPopups() {
    $('popup-count').textContent = `${popupItems.length} ширхэг`;
    $('popup-list').innerHTML = popupItems.length ? popupItems.map(item => `
      <article class="bg-white rounded-3xl p-4 border border-purple-100 shadow-card flex gap-4">
        <img src="${escapeHtml(item.imageUrl)}" alt="" class="w-24 h-32 rounded-2xl object-cover bg-slate-100">
        <div class="min-w-0 flex-1">
          <div class="flex items-start justify-between gap-2">
            <div>
              <span class="text-[10px] font-bold px-2 py-1 rounded-full ${item.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}">${item.active ? 'Идэвхтэй' : 'Идэвхгүй'}</span>
              <h4 class="font-bold text-[14px] mt-2">${escapeHtml(item.title)}</h4>
            </div>
            <div class="flex gap-1">
              <button onclick="editPopup(${item.id})" class="w-8 h-8 rounded-lg bg-slate-100 text-primary"><span class="material-symbols-outlined text-[17px]">edit</span></button>
              <button onclick="deletePopup(${item.id})" class="w-8 h-8 rounded-lg bg-red-50 text-red-500"><span class="material-symbols-outlined text-[17px]">delete</span></button>
            </div>
          </div>
          <p class="text-[12px] text-slate-500 mt-2 line-clamp-3">${escapeHtml(item.subtitle)}</p>
        </div>
      </article>`).join('') : '<div class="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">Попап мэдэгдэл байхгүй байна.</div>';
  }

  function previewFile(file) {
    if (!file?.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = event => {
      $('popup-preview-image').src = event.target.result;
      $('popup-preview').classList.remove('hidden');
      $('popup-placeholder').classList.add('hidden');
    };
    reader.readAsDataURL(file);
  }

  async function uploadImage(source) {
    if (!source.startsWith('data:')) return source;
    const blob = await (await fetch(source)).blob();
    const response = await fetch(`/api/upload?filename=popup_${Date.now()}.webp`, { method: 'POST', body: blob });
    if (!response.ok) throw new Error('Зураг байршуулахад алдаа гарлаа.');
    return (await response.json()).url;
  }

  window.editPopup = id => {
    const item = popupItems.find(popup => popup.id === id);
    if (!item) return;
    editingPopupId = id;
    $('popup-form-title').textContent = 'Попап мэдэгдэл засах';
    $('popup-title').value = item.title || '';
    $('popup-content').value = item.subtitle || '';
    $('popup-link').value = item.linkUrl || '';
    $('popup-button-text').value = item.buttonText || 'Дэлгэрэнгүй';
    $('popup-active').checked = Boolean(item.active);
    $('popup-preview-image').src = item.imageUrl || '';
    $('popup-preview').classList.remove('hidden');
    $('popup-placeholder').classList.add('hidden');
    $('popup-cancel').classList.remove('hidden');
    scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.resetPopupForm = () => {
    editingPopupId = null;
    $('popup-form').reset();
    $('popup-button-text').value = 'Дэлгэрэнгүй';
    $('popup-active').checked = true;
    $('popup-preview').classList.add('hidden');
    $('popup-placeholder').classList.remove('hidden');
    $('popup-form-title').textContent = 'Шинэ попап мэдэгдэл';
    $('popup-cancel').classList.add('hidden');
  };

  window.deletePopup = async id => {
    if (!confirm('Энэ попап мэдэгдлийг устгах уу?')) return;
    const response = await fetch(`/api/banners?id=${id}`, { method: 'DELETE', headers: headers() });
    if (!response.ok) return alert('Устгахад алдаа гарлаа.');
    resetPopupForm();
    loadPopups();
  };

  document.addEventListener('DOMContentLoaded', () => {
    $('popup-upload-area').addEventListener('click', () => $('popup-upload').click());
    $('popup-upload').addEventListener('change', event => previewFile(event.target.files[0]));
    $('popup-form').addEventListener('submit', async event => {
      event.preventDefault();
      const preview = $('popup-preview-image').src;
      if (!preview || $('popup-preview').classList.contains('hidden')) return alert('Зураг оруулна уу.');
      const button = $('popup-save');
      button.disabled = true;
      try {
        const imageUrl = await uploadImage(preview);
        const payload = {
          id: editingPopupId,
          title: $('popup-title').value.trim(),
          subtitle: $('popup-content').value.trim(),
          linkUrl: $('popup-link').value.trim(),
          buttonText: $('popup-button-text').value.trim() || 'Дэлгэрэнгүй',
          imageUrl,
          type: 'popup',
          active: $('popup-active').checked
        };
        const response = await fetch('/api/banners', {
          method: editingPopupId ? 'PUT' : 'POST',
          headers: headers(true),
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Хадгалахад алдаа гарлаа.');
        resetPopupForm();
        await loadPopups();
      } catch (error) {
        alert(error.message);
      } finally {
        button.disabled = false;
      }
    });
    loadPopups();
  });
})();
