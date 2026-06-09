/* ========================================
   NOMIN CARGO - Order Form Logic
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ========== CHECK AUTHENTICATION ==========
  const userStr = localStorage.getItem('nomin_user');
  if (!userStr) {
    showCustomAlert('Та захиалга өгөхийн тулд эхлээд нэвтэрч орно уу.', () => {
      window.location.href = 'login';
    });
    return;
  }

  // ========== CUSTOM ALERT ==========
  function showCustomAlert(message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 opacity-0 transition-opacity duration-300';
    overlay.innerHTML = `
      <div class="bg-white rounded-3xl p-6 shadow-elevated max-w-sm w-full text-center relative overflow-hidden transform scale-95 transition-transform duration-300">
        <div class="w-16 h-16 bg-blue-50 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100/50">
          <span class="material-symbols-outlined text-[32px] filled">info</span>
        </div>
        <h3 class="text-[18px] font-bold text-gray-900 mb-2">Мэдэгдэл</h3>
        <p class="text-[14px] text-slate-500 mb-6 leading-relaxed">${message}</p>
        <button type="button" class="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-[15px] shadow-btn hover:shadow-lg active:scale-[0.98] transition-all">
          Ойлголоо
        </button>
      </div>
    `;
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.classList.remove('opacity-0');
      overlay.querySelector('div.bg-white').classList.remove('scale-95');
    });

    overlay.querySelector('button').addEventListener('click', () => {
      overlay.classList.add('opacity-0');
      overlay.querySelector('div.bg-white').classList.add('scale-95');
      setTimeout(() => {
        if(document.body.contains(overlay)) document.body.removeChild(overlay);
        if (onConfirm) onConfirm();
      }, 300);
    });
  }

  // ========== GET ORDER TYPE FROM URL ==========
  const urlParams = new URLSearchParams(window.location.search);
  const orderType = urlParams.get('type') || 'standard'; // default to standard
  let isExpress = (orderType === 'express');

  // ========== DOM ELEMENTS ==========
  const badgeContainer = document.getElementById('orderTypeBadgeContainer');
  const descriptionContainer = document.getElementById('orderDescriptionContainer');
  const orderForm = document.getElementById('orderForm');
  const imageUploadArea = document.getElementById('imageUploadArea');
  const imageInput = document.getElementById('imageInput');
  const uploadPlaceholder = document.getElementById('uploadPlaceholder');
  const imagePreviewGrid = document.getElementById('imagePreviewGrid');
  const submitBtn = document.getElementById('submitBtn');
  const successContainer = document.getElementById('successContainer');
  const successDetails = document.getElementById('successDetails');

  // ========== STATE ==========
  let uploadedImages = [];
  const MAX_IMAGES = 5;

  function getSelectedBranch() {
    const name = document.querySelector('input[name="branchSelect"]:checked')?.value;
    return window.NominBranches?.getByName(name) || null;
  }

  function bindBranchEvents() {
    document.querySelectorAll('input[name="branchSelect"]').forEach(radio => {
      if (radio.dataset.bound === '1') return;
      radio.dataset.bound = '1';
      radio.addEventListener('change', () => {
        const branchError = document.getElementById('branchSelectError');
        if (branchError) branchError.style.display = 'none';
        renderOrderType();
      });
    });
  }

  document.addEventListener('nomin:branches-rendered', () => {
    bindBranchEvents();
    renderOrderType();
  });

  // ========== SET BADGE & TYPE TOGGLE ==========
  const btnTypeStandard = document.getElementById('btnTypeStandard');
  const btnTypeExpress = document.getElementById('btnTypeExpress');
  const typeToggleBg = document.getElementById('typeToggleBg');

  function renderOrderType() {
    const selectedBranch = document.querySelector('input[name="branchSelect"]:checked');
    const branch = selectedBranch ? selectedBranch.value : null;
    const selectedBranchData = getSelectedBranch();

    // Determine price display text based on branch selection
    let expressPrice, standardPrice;
    if (!branch) {
      // No branch selected yet - show price range
      const branches = window.NominBranches?.items || [];
      const expressPrices = branches.map(item => Number(item.express_price)).filter(Boolean);
      const standardPrices = branches.map(item => Number(item.standard_price)).filter(Boolean);
      const formatRange = prices => {
        if (!prices.length) return '0';
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return min === max ? min.toLocaleString() : `${min.toLocaleString()}~${max.toLocaleString()}`;
      };
      expressPrice = formatRange(expressPrices);
      standardPrice = formatRange(standardPrices);
    } else {
      expressPrice = Number(selectedBranchData?.express_price || 0).toLocaleString();
      standardPrice = Number(selectedBranchData?.standard_price || 0).toLocaleString();
    }

    if (isExpress) {
      if (btnTypeExpress) {
        btnTypeExpress.classList.replace('text-gray-500', 'text-gray-900');
        btnTypeStandard.classList.replace('text-gray-900', 'text-gray-500');
        if(typeToggleBg) typeToggleBg.style.transform = 'translateX(100%)';
      }
      if (descriptionContainer) {
        descriptionContainer.className = "mb-8 p-4 bg-amber-50 rounded-xl border border-amber-100 text-[13px] text-amber-900 leading-relaxed font-bold";
        descriptionContainer.innerHTML = `✈️ Экспрэсс ачаа: 10~14 хоногт хүргэгдэнэ (${expressPrice} вон/кг)<br><span class=\"font-medium text-[12px] opacity-80 font-normal\">Та доорх мэдээллийг бөглөж явуулсаны дараа бид таны оруулсан хаягаар ачааг очиж авах болно.</span>`;
      }
    } else {
      if (btnTypeStandard) {
        btnTypeStandard.classList.replace('text-gray-500', 'text-gray-900');
        btnTypeExpress.classList.replace('text-gray-900', 'text-gray-500');
        if(typeToggleBg) typeToggleBg.style.transform = 'translateX(0)';
      }
      if (descriptionContainer) {
        descriptionContainer.className = "mb-8 p-4 bg-blue-50/70 rounded-xl border border-blue-100 text-[13px] text-blue-900 leading-relaxed font-bold";
        descriptionContainer.innerHTML = `🚢 Энгийн ачаа: 30~45 хоногт хүргэгдэнэ (${standardPrice} вон/кг)<br><span class=\"font-medium text-[12px] opacity-80 font-normal\">Та доорх мэдээллийг бөглөж явуулсаны дараа бид таны оруулсан хаягаар ачааг очиж авах болно.</span>`;
      }
    }
    updatePricePreview(); // recalculate price when type changes
  }

  // ========== WEIGHT PRICE CALCULATION ==========
  const itemWeight = document.getElementById('itemWeight');
  const pricePreviewArea = document.getElementById('pricePreviewArea');
  const pricePreviewText = document.getElementById('pricePreviewText');

  function updatePricePreview() {
     if(!itemWeight || !pricePreviewArea || !pricePreviewText) return;
     const weight = parseFloat(itemWeight.value);
     if (isNaN(weight) || weight <= 0) {
        pricePreviewArea.classList.remove('flex');
        pricePreviewArea.classList.add('hidden');
     } else {
        const branchData = getSelectedBranch() || window.NominBranches?.items?.[0];
        const rateStandard = Number(branchData?.standard_price || 0);
        const rateExpress = Number(branchData?.express_price || 0);
        const rate = isExpress ? rateExpress : rateStandard;
        const total = Math.round(weight * rate);
        pricePreviewText.textContent = total.toLocaleString() + ' ₩';
        pricePreviewArea.classList.remove('hidden');
        pricePreviewArea.classList.add('flex');
     }
  }

  if (itemWeight) {
     itemWeight.addEventListener('input', updatePricePreview);
  }

  if (btnTypeStandard && btnTypeExpress) {
    btnTypeStandard.addEventListener('click', () => { isExpress = false; renderOrderType(); });
    btnTypeExpress.addEventListener('click', () => { isExpress = true; renderOrderType(); });
  }

  renderOrderType();

  // ========== IMAGE UPLOAD ==========
  imageUploadArea.addEventListener('click', () => {
    if (uploadedImages.length < MAX_IMAGES) imageInput.click();
  });

  imageInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    const remaining = MAX_IMAGES - uploadedImages.length;
    const filesToAdd = files.slice(0, remaining);

    filesToAdd.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          uploadedImages.push({ file, dataUrl: ev.target.result, id: Date.now() + Math.random() });
          renderImagePreviews();
        };
        reader.readAsDataURL(file);
      }
    });
    imageInput.value = '';
  });

  function renderImagePreviews() {
    imagePreviewGrid.innerHTML = '';
    
    uploadedImages.forEach((img, index) => {
      const item = document.createElement('div');
      item.className = 'relative aspect-square rounded-xl overflow-hidden border border-gray-200';
      item.innerHTML = `
        <img src="${img.dataUrl}" alt="Preview" class="w-full h-full object-cover">
        <button type="button" class="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center text-[14px]" data-index="${index}">✕</button>
      `;
      imagePreviewGrid.appendChild(item);
    });

    if (uploadedImages.length > 0) {
      imagePreviewGrid.classList.remove('hidden');
      imagePreviewGrid.classList.add('grid', 'gap-2', 'mt-4');
      uploadPlaceholder.classList.add('hidden');
      imageUploadArea.classList.remove('py-8');
      imageUploadArea.classList.add('p-4');
    } else {
      imagePreviewGrid.classList.add('hidden');
      imagePreviewGrid.classList.remove('grid', 'gap-2', 'mt-4');
      uploadPlaceholder.classList.remove('hidden');
      imageUploadArea.classList.add('py-8');
      imageUploadArea.classList.remove('p-4');
    }

    if (uploadedImages.length > 0) imageUploadArea.classList.remove('border-red-500', 'bg-red-50');
  }

  imagePreviewGrid.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('button');
    if (deleteBtn) {
      e.stopPropagation();
      uploadedImages.splice(parseInt(deleteBtn.dataset.index), 1);
      renderImagePreviews();
    }
  });

  // ========== WIZARD STATE ==========
  let currentStep = 1;
  const totalSteps = 4;

  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const wizardProgress = document.getElementById('wizardProgress');

  function updateWizardUI() {
    document.querySelectorAll('.wizard-step').forEach(step => {
      step.classList.add('hidden');
      step.classList.remove('block');
    });
    
    const activeStep = document.getElementById(`step${currentStep}`);
    if (activeStep) {
      activeStep.classList.remove('hidden');
      activeStep.classList.add('block');
    }

    for (let i = 1; i <= totalSteps; i++) {
      const indicator = document.getElementById(`stepIndicator${i}`);
      const label = document.getElementById(`stepLabel${i}`);
      const line = document.getElementById(`stepLine${i}`);
      
      if (i < currentStep) {
        if (indicator) {
          indicator.className = 'w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[14px] transition-colors';
          indicator.innerHTML = '<span class="material-symbols-outlined text-[16px]">check</span>';
        }
        if (label) label.className = 'text-[11px] font-bold text-primary text-center transition-colors whitespace-nowrap';
        if (line) line.className = 'flex-1 h-0.5 bg-primary -mx-4 z-0 relative top-[-10px] transition-colors';
      } else if (i === currentStep) {
        if (indicator) {
          indicator.className = 'w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[14px] transition-colors';
          indicator.innerHTML = i;
        }
        if (label) label.className = 'text-[11px] font-bold text-primary text-center transition-colors whitespace-nowrap';
        if (line) line.className = 'flex-1 h-0.5 bg-gray-200 -mx-4 z-0 relative top-[-10px] transition-colors';
      } else {
        if (indicator) {
          indicator.className = 'w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center font-bold text-[14px] transition-colors';
          indicator.innerHTML = i;
        }
        if (label) label.className = 'text-[11px] font-bold text-gray-400 text-center transition-colors whitespace-nowrap';
        if (line) line.className = 'flex-1 h-0.5 bg-gray-200 -mx-4 z-0 relative top-[-10px] transition-colors';
      }
    }

    if (currentStep === 1) {
      if (prevBtn) prevBtn.classList.add('hidden');
      if (nextBtn) nextBtn.classList.remove('hidden');
      if (submitBtn) submitBtn.classList.add('hidden');
    } else if (currentStep === totalSteps) {
      if (prevBtn) prevBtn.classList.add('hidden');
      if (nextBtn) nextBtn.classList.add('hidden');
      if (submitBtn) submitBtn.classList.remove('hidden');
    } else {
      if (prevBtn) prevBtn.classList.add('hidden');
      if (nextBtn) nextBtn.classList.remove('hidden');
      if (submitBtn) submitBtn.classList.add('hidden');
    }
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (validateStep(currentStep)) {
        currentStep++;
        updateWizardUI();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentStep--;
      updateWizardUI();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ========== FORM VALIDATION ==========
  function validateStep(step) {
    let isValid = true;
    let firstError = null;

    if (step === 1) {
      const branchContainer = document.getElementById('branchSelectContainer');
      const branchError = document.getElementById('branchSelectError');
      if (branchContainer) branchContainer.classList.remove('border-red-500', 'bg-red-50');
      if (branchError) branchError.style.display = 'none';

      const selectedBranch = document.querySelector('input[name="branchSelect"]:checked');
      if (!selectedBranch) {
        if (branchError) branchError.style.display = 'block';
        isValid = false;
        if (!firstError) firstError = branchContainer;
      }
    }

    if (step === 2) {
      const requiredFields = [
        { id: 'senderName' }, { id: 'senderPhone' }, { id: 'senderAddress' }
      ];
      requiredFields.forEach(f => {
        const el = document.getElementById(f.id);
        if (el) el.classList.remove('border-red-500', 'bg-red-50');
      });
      document.querySelectorAll('#step2 .error-msg').forEach(el => el.style.display = 'none');

      requiredFields.forEach(field => {
        const input = document.getElementById(field.id);
        if (!input) return;
        const value = input.value.trim();
        const errorMsg = document.getElementById(field.id + 'Error');
        
        if (!value) {
          input.classList.add('border-red-500', 'bg-red-50');
          if (errorMsg) errorMsg.style.display = 'block';
          isValid = false;
          if (!firstError) firstError = input;
        }
      });
    }

    if (step === 3) {
      const requiredFields = [
        { id: 'itemCategory' }, { id: 'itemQuantity' }
      ];
      requiredFields.forEach(f => {
        const el = document.getElementById(f.id);
        if (el) el.classList.remove('border-red-500', 'bg-red-50');
      });
      document.querySelectorAll('#step3 .error-msg').forEach(el => el.style.display = 'none');
      imageUploadArea.classList.remove('border-red-500', 'bg-red-50');

      requiredFields.forEach(field => {
        const input = document.getElementById(field.id);
        if (!input) return;
        const value = input.value.trim();
        const errorMsg = document.getElementById(field.id + 'Error');
        
        if (!value) {
          input.classList.add('border-red-500', 'bg-red-50');
          if (errorMsg) errorMsg.style.display = 'block';
          isValid = false;
          if (!firstError) firstError = input;
        }
      });

      if (uploadedImages.length === 0) {
        imageUploadArea.classList.add('border-red-500', 'bg-red-50');
        const imgError = document.getElementById('imageError');
        if (imgError) imgError.style.display = 'block';
        isValid = false;
        if (!firstError) firstError = imageUploadArea;
      }
    }

    if (step === 4) {
      const requiredFields = [
        { id: 'receiverName' }, { id: 'receiverPhone' }, { id: 'receiverAddress' }
      ];
      requiredFields.forEach(f => {
        const el = document.getElementById(f.id);
        if (el) el.classList.remove('border-red-500', 'bg-red-50');
      });
      document.querySelectorAll('#step4 .error-msg').forEach(el => el.style.display = 'none');

      requiredFields.forEach(field => {
        const input = document.getElementById(field.id);
        if (!input) return;
        const value = input.value.trim();
        const errorMsg = document.getElementById(field.id + 'Error');
        
        if (!value) {
          input.classList.add('border-red-500', 'bg-red-50');
          if (errorMsg) errorMsg.style.display = 'block';
          isValid = false;
          if (!firstError) firstError = input;
        }
      });
    }

    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (firstError.focus) firstError.focus();
    }

    return isValid;
  }

  // Hide branch error on change
  bindBranchEvents();

  document.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('input', () => {
      input.classList.remove('border-red-500', 'bg-red-50');
      const errorMsg = document.getElementById(input.id + 'Error');
      if (errorMsg) errorMsg.style.display = 'none';
    });
  });

  // ========== FORM SUBMISSION ==========
  const submitBtnEl = document.getElementById('submitBtn');

  orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    // Loading State
    const originalText = submitBtnEl.innerHTML;
    submitBtnEl.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> <span>Уншиж байна...</span>';
    submitBtnEl.disabled = true;

    try {
      const orderData = {
        type: isExpress ? 'express' : 'standard',
        branch: document.querySelector('input[name="branchSelect"]:checked').value,
        sender: {
          name: document.getElementById('senderName').value.trim(),
          phone: document.getElementById('senderPhone').value.trim(),
          address: document.getElementById('senderAddress').value.trim(),
        },
        item: { category: document.getElementById('itemCategory').value.trim(), quantity: document.getElementById('itemQuantity').value.trim() },
        large_items: Array.from(document.querySelectorAll('input[name="largeItem"]:checked')).map(cb => cb.value),
        receiver: {
          name: document.getElementById('receiverName').value.trim(),
          phone: document.getElementById('receiverPhone').value.trim(),
          address: document.getElementById('receiverAddress').value.trim()
        },
      };

      // Compress & Upload images to R2
      const imagePromises = uploadedImages.map(imgData => {
        return new Promise((resolve) => {
           const img = new Image();
           img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 1200;
              const MAX_HEIGHT = 1200;
              let width = img.width;
              let height = img.height;

              if (width > height) {
                if (width > MAX_WIDTH) { height = Math.round(height * (MAX_WIDTH / width)); width = MAX_WIDTH; }
              } else {
                if (height > MAX_HEIGHT) { width = Math.round(width * (MAX_HEIGHT / height)); height = MAX_HEIGHT; }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);
              
              canvas.toBlob(async (blob) => {
                 try {
                     const fileName = `order_${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
                     const res = await fetch('/api/upload?filename=' + fileName, {
                         method: 'POST',
                         body: blob
                     });
                     if (res.ok) {
                         const json = await res.json();
                         resolve(json.url);
                     } else {
                         resolve(imgData.dataUrl); // Fallback to base64
                     }
                 } catch(e) {
                     resolve(imgData.dataUrl); // Fallback to base64
                 }
              }, 'image/webp', 0.8);
           };
           img.onerror = () => resolve(imgData.dataUrl);
           img.src = imgData.dataUrl;
        });
      });
      
      const imageUrls = await Promise.all(imagePromises);

      // Generate a temporary Order ID for UI
      let tempPrefix = 'MN';
      if (orderData.branch === 'Салбар 2') tempPrefix = 'MK';
      else if (orderData.branch === 'Салбар 3') tempPrefix = 'TG';
      else if (orderData.branch === 'Салбар 4') tempPrefix = 'UL';
      const orderId = tempPrefix + Date.now().toString().slice(-6);

      let userEmail = '';
      try {
          const uStr = localStorage.getItem('nomin_user');
          if (uStr) userEmail = JSON.parse(uStr).email || '';
      } catch(e) {}

      // Calculate weight and price if provided
      let finalWeight = null;
      let finalPrice = null;
      const weightInputRaw = document.getElementById('itemWeight')?.value?.trim();
      if (weightInputRaw) {
          const w = parseFloat(weightInputRaw);
          if (!isNaN(w) && w > 0) {
              finalWeight = w.toString();
              const branchData = window.NominBranches?.getByName(orderData.branch);
              const rateStandard = Number(branchData?.standard_price || 0);
              const rateExpress = Number(branchData?.express_price || 0);
              const finalRate = isExpress ? rateExpress : rateStandard;
              finalPrice = Math.round(w * finalRate).toString();
          }
      }

      const newOrder = {
        ...orderData,
        orderId: orderId,
        date: new Date().toISOString(),
        status: 'pending',
        images: imageUrls,
        user_email: userEmail,
        weight: finalWeight,
        total_price: finalPrice
      };

      // Real API Call
      const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newOrder)
      });
      
      if (!res.ok) {
          throw new Error('Захиалга үүсгэхэд алдаа гарлаа');
      }

      const resData = await res.json();
      newOrder.orderId = resData.orderId || newOrder.orderId;
      newOrder.order_id = newOrder.orderId;

      showSuccess(newOrder);
    } catch (err) {
      showCustomAlert('Алдаа гарлаа: ' + err.message);
    } finally {
      submitBtnEl.innerHTML = originalText;
      submitBtnEl.disabled = false;
    }
  });

  function showSuccess(data) {
    orderForm.classList.add('hidden');
    
    // Hide wizard progress, title and description
    document.getElementById('headerTitle').textContent = '';
    if (badgeContainer) badgeContainer.classList.add('hidden');
    if (descriptionContainer) descriptionContainer.classList.add('hidden');
    if (wizardProgress) wizardProgress.classList.add('hidden');
    
    // Also hide the order type toggle wrapper (the one with the two buttons and bg)
    const typeToggleContainer = typeToggleBg ? typeToggleBg.parentElement : null;
    if (typeToggleContainer) typeToggleContainer.classList.add('hidden');

    const typeLabel = data.type === 'standard' ? 'Энгийн ачаа' : 'Экспрэсс ачаа';
    const deliveryTime = data.type === 'standard' ? '30~45 хоног' : '10~14 хоног';
    const orderNum = data.orderId || 'NM' + Date.now().toString().slice(-8);

    successDetails.innerHTML = `
      <div class="flex justify-between border-b border-gray-100 pb-2">
        <span class="text-gray-500 text-[13px]">Захиалгын дугаар</span>
        <span class="font-bold text-gray-900 text-[13px]">${orderNum}</span>
      </div>
      <div class="flex justify-between border-b border-gray-100 pb-2 pt-1">
        <span class="text-gray-500 text-[13px]">Тээврийн төрөл</span>
        <span class="font-bold text-gray-900 text-[13px]">${typeLabel}</span>
      </div>
      <div class="flex justify-between border-b border-gray-100 pb-2 pt-1">
        <span class="text-gray-500 text-[13px]">Салбар</span>
        <span class="font-bold text-gray-900 text-[13px]">${data.branch}</span>
      </div>
      <div class="flex justify-between border-b border-gray-100 pb-2 pt-1">
        <span class="text-gray-500 text-[13px]">Илгээгч</span>
        <span class="font-bold text-gray-900 text-[13px]">${data.sender.name}</span>
      </div>
      <div class="flex justify-between border-b border-gray-100 pb-2 pt-1">
        <span class="text-gray-500 text-[13px]">Хүлээн авагч</span>
        <span class="font-bold text-gray-900 text-[13px]">${data.receiver.name}</span>
      </div>
      <div class="flex justify-between border-b border-gray-100 pb-2 pt-1">
        <span class="text-gray-500 text-[13px]">Бараа</span>
        <span class="font-bold text-gray-900 text-[13px]">${data.item.category} (${data.item.quantity}ш)</span>
      </div>
      ${data.large_items && data.large_items.length > 0 ? `
      <div class="flex justify-between border-b border-gray-100 pb-2 pt-1">
        <span class="text-gray-500 text-[13px]">Том оврын ачаа</span>
        <span class="font-bold text-gray-900 text-[13px]">${data.large_items.join(', ')}</span>
      </div>` : ''}
      <div class="flex justify-between pt-1">
        <span class="text-gray-500 text-[13px]">Хүргэлтийн хугацаа</span>
        <span class="font-bold text-gray-900 text-[13px]">${deliveryTime}</span>
      </div>
    `;
    
    successContainer.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Handle mobile keyboard overlap by hiding bottom nav when inputs are focused
  const bottomNav = document.querySelector('nav.fixed.bottom-0');
  if (bottomNav) {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        if (window.innerWidth < 768) {
          bottomNav.style.display = 'none';
        }
      });
      input.addEventListener('blur', () => {
        setTimeout(() => {
          const activeTag = document.activeElement ? document.activeElement.tagName : '';
          if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA' && activeTag !== 'SELECT') {
            bottomNav.style.display = '';
          }
        }, 50);
      });
    });
  }
});
