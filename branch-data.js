(function () {
  const fallbackBranches = [
    { id: 1, name: 'Салбар 1', manager_name: 'Одгэрэл / Дүгэрсүрэн', phone: '010-8138-4849 / 010-8460-5703', standard_price: 1800, express_price: 2500, service_area: 'Пусан, Кимхэ, Янсан, Пухан, Улсан, Дэжон, Чонан, Андун, Ёнжу, Чанвон' },
    { id: 2, name: 'Салбар 2', manager_name: 'Оргил / Бооб', phone: '010-8256-2953 / 010-8174-5995', standard_price: 2000, express_price: 3000, service_area: 'Мугпу, Гуанжу, Сүнчон, Чонжу' },
    { id: 3, name: 'Салбар 3', manager_name: 'Пүүжээ', phone: '010-5850-6206', standard_price: 1800, express_price: 2500, service_area: 'Тэгү, Күмин, Ёнчан, Кёнсан' }
  ];

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[char]);

  const formatPrice = value => Number(value || 0).toLocaleString() + ' ₩';
  const phoneHref = value => String(value || '').split('/')[0].replace(/[^\d+]/g, '');

  function infoRows(branch) {
    return `
      <div class="space-y-2 mb-4 pl-1">
        <div class="flex items-start text-[13px]">
          <span class="material-symbols-outlined text-[16px] text-slate-400 shrink-0 w-7">person</span>
          <span class="font-semibold text-gray-700 w-24 shrink-0">Хариуцагч:</span>
          <span class="text-gray-700 font-medium">${escapeHtml(branch.manager_name)}</span>
        </div>
        <div class="flex items-start text-[13px]">
          <span class="material-symbols-outlined text-[16px] text-slate-400 shrink-0 w-7">call</span>
          <span class="font-semibold text-gray-700 w-24 shrink-0">Утас:</span>
          <a href="tel:${phoneHref(branch.phone)}" class="text-primary font-medium hover:underline">${escapeHtml(branch.phone)}</a>
        </div>
      </div>`;
  }

  function priceGrid(branch) {
    return `
      <div class="grid grid-cols-2 gap-2 mb-3">
        <div class="bg-blue-50 rounded-xl p-3 border border-blue-100">
          <p class="text-[10px] font-bold text-blue-500 uppercase">Энгийн ачаа 1кг</p>
          <p class="text-[15px] font-black text-blue-700 mt-1">${formatPrice(branch.standard_price)}</p>
        </div>
        <div class="bg-amber-50 rounded-xl p-3 border border-amber-100">
          <p class="text-[10px] font-bold text-amber-600 uppercase">Экспресс ачаа 1кг</p>
          <p class="text-[15px] font-black text-amber-700 mt-1">${formatPrice(branch.express_price)}</p>
        </div>
      </div>`;
  }

  function branchCard(branch, selectable) {
    const content = `
      <div class="p-4 rounded-2xl border-2 border-transparent bg-[#F5F7FF] shadow-sm transition-all ${selectable ? 'peer-checked:border-primary peer-checked:bg-blue-50/50 hover:bg-[#EEF2FF]' : ''}">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary">
              <span class="material-symbols-outlined text-[20px]">storefront</span>
            </div>
            <h4 class="font-bold text-gray-900 text-[15px]">${escapeHtml(branch.name)}</h4>
          </div>
          ${selectable
            ? '<div class="w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center bg-white"><div class="w-2.5 h-2.5 rounded-full bg-primary"></div></div>'
            : '<span class="text-[11px] text-emerald-500 font-semibold bg-white border border-emerald-100 px-2.5 py-1 rounded-full shadow-sm">Ажиллаж байна</span>'}
        </div>
        ${infoRows(branch)}
        ${priceGrid(branch)}
        ${branch.service_area ? `<div class="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
          <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[14px]">location_on</span> АЧАА АВАХ ХОТ
          </div>
          <p class="text-[12px] text-slate-600 leading-relaxed">${escapeHtml(branch.service_area)}</p>
        </div>` : ''}
      </div>`;

    if (!selectable) return `<div class="animate-fade-in-up">${content}</div>`;
    return `<label class="block relative cursor-pointer group">
      <input type="radio" name="branchSelect" value="${escapeHtml(branch.name)}" data-branch-id="${branch.id}" class="peer sr-only">
      ${content}
    </label>`;
  }

  async function loadBranches() {
    try {
      const response = await fetch('/api/branches');
      if (!response.ok) throw new Error('Branch API unavailable');
      const branches = await response.json();
      return branches.length ? branches : fallbackBranches;
    } catch (error) {
      console.warn(error);
      return fallbackBranches;
    }
  }

  window.NominBranches = {
    items: [],
    ready: loadBranches().then(branches => {
      window.NominBranches.items = branches;
      return branches;
    }),
    getByName(name) {
      return this.items.find(branch => branch.name === name);
    },
    renderInfo(container, branches) {
      container.innerHTML = branches.map(branch => branchCard(branch, false)).join('');
    },
    renderOptions(container, branches) {
      container.innerHTML = branches.map(branch => branchCard(branch, true)).join('');
      document.dispatchEvent(new CustomEvent('nomin:branches-rendered'));
    }
  };

  document.addEventListener('DOMContentLoaded', async () => {
    const branches = await window.NominBranches.ready;
    const infoContainer = document.getElementById('branches-list');
    const optionContainer = document.getElementById('branch-options');
    if (infoContainer) window.NominBranches.renderInfo(infoContainer, branches);
    if (optionContainer) window.NominBranches.renderOptions(optionContainer, branches);
  });
})();
