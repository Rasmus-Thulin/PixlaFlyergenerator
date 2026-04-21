document.addEventListener('DOMContentLoaded', () => {
    // Elements - Editor Form
    const formatSelect = document.getElementById('format-select');
    const themeSelect = document.getElementById('bg-theme');
    const imageUpload = document.getElementById('image-upload');
    const printBtn = document.getElementById('print-btn');
    const saveImageBtn = document.getElementById('save-image-btn');
    const saveProjectBtn = document.getElementById('save-project-btn');
    const loadProjectBtn = document.getElementById('load-project-btn');
    const loadProjectInput = document.getElementById('load-project-input');
    const addTextBtn = document.getElementById('add-text-btn');
    const addPriceBtn = document.getElementById('add-price-btn');
    const addBreakerBtn = document.getElementById('add-breaker-btn');
    const fetchJulaImgBtn = document.getElementById('fetch-jula-img-btn');
    const julaImageInput = document.getElementById('jula-image-input');
    const addFooterBannerBtn = document.getElementById('add-footer-banner-btn');
    const editorSidebar = document.querySelector('.editor-sidebar');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    const sidebarToggleIcon = sidebarToggleBtn ? sidebarToggleBtn.querySelector('.sidebar-toggle-icon') : null;

    // Text Settings Panel
    const textSettingsPanel = document.getElementById('text-settings-panel');
    const textFontSelect = document.getElementById('text-font-select');
    const textSizeSelect = document.getElementById('text-size-select');
    const btnBold = document.getElementById('btn-bold');
    const btnItalic = document.getElementById('btn-italic');
    const btnUnderline = document.getElementById('btn-underline');
    const btnAlignLeft = document.getElementById('btn-align-left');
    const btnAlignCenter = document.getElementById('btn-align-center');
    const btnAlignRight = document.getElementById('btn-align-right');
    const textColorPicker = document.getElementById('text-color-picker');
    const btnResetText = document.getElementById('btn-reset-text');

    // Elements - Flyer Preview
    const flyer = document.getElementById('flyer');
    const flyerContent = document.getElementById('flyer-content');

    // Elements - Zoom
    const flyerWrapper = document.querySelector('.flyer-wrapper');
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const zoomLevelEl = document.getElementById('zoom-level');

    let currentZoom = 0.35; // Initial zoom scale to fit on screen
    const ZOOM_STEP = 0.05;

    // Theme & Format updates
    function updateThemeAndFormat() {
        flyer.className = `flyer ${formatSelect.value} ${themeSelect.value}`;

        // Auto-add Outlet banner the first time Jula Outlet theme is selected
        if (themeSelect.value === 'theme-yellow-black') {
            if (!document.getElementById('item-outlet-banner')) {
                const item = addElementToFlyer(`
                    <div class="product-image-container outlet-banner-container">
                        <img src="Outlet.webp" alt="Outlet" class="outlet-banner-img" draggable="false"
                            style="width: var(--flyer-width); display: block; object-fit: cover;">
                    </div>
                `, -330, 'image-item outlet-banner-item');
                item.id = 'item-outlet-banner';
                item.style.zIndex = '15';
            }
        } else {
            const existing = document.getElementById('item-outlet-banner');
            if (existing) existing.remove();
        }
    }

    formatSelect.addEventListener('change', () => {
        updateThemeAndFormat();
        autoFitZoom();
    });
    themeSelect.addEventListener('change', updateThemeAndFormat);

    // Zoom Controls
    function updateZoom() {
        flyerWrapper.style.transform = `scale(${currentZoom})`;
        zoomLevelEl.textContent = `${Math.round(currentZoom * 100)}%`;
    }

    zoomInBtn.addEventListener('click', () => {
        if (currentZoom < 1.5) {
            currentZoom += ZOOM_STEP;
            updateZoom();
        }
    });

    zoomOutBtn.addEventListener('click', () => {
        if (currentZoom > 0.1) {
            currentZoom -= ZOOM_STEP;
            updateZoom();
        }
    });

    function autoFitZoom() {
        const previewArea = document.querySelector('.preview-area');
        const padding = 60;
        const assumedA4Height = 1122;
        const scaleHeight = (previewArea.clientHeight - padding) / assumedA4Height;
        currentZoom = Math.min(Math.max(scaleHeight, 0.1), 1.0);
        updateZoom();
    }

    function setSidebarCollapsed(collapsed) {
        if (!editorSidebar || !sidebarToggleBtn) return;

        editorSidebar.classList.toggle('is-collapsed', collapsed);
        editorSidebar.setAttribute('aria-expanded', String(!collapsed));
        sidebarToggleBtn.setAttribute('aria-expanded', String(!collapsed));
        sidebarToggleBtn.setAttribute('aria-label', collapsed ? 'Fäll ut sidomenyn' : 'Fäll in sidomenyn');

        if (sidebarToggleIcon) {
            sidebarToggleIcon.innerHTML = collapsed ? '&rsaquo;' : '&lsaquo;';
        }

        requestAnimationFrame(autoFitZoom);
    }

    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('click', () => {
            setSidebarCollapsed(!editorSidebar.classList.contains('is-collapsed'));
        });
    }

    // Print Button
    printBtn.addEventListener('click', () => {
        const styleId = 'dynamic-print-style';
        let styleEl = document.getElementById(styleId);
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }
        const format = formatSelect.value;
        if (format === 'a3') {
            styleEl.innerHTML = '@page { size: A3 portrait; }';
        } else {
            styleEl.innerHTML = '@page { size: A4 portrait; }';
        }

        // Remove active class from all items so no borders print
        document.querySelectorAll('.draggable-item').forEach(d => d.classList.remove('active'));
        activeItem = null;

        window.print();
    });

    // Helper: convert a loaded <img> to a data URL via an off-screen canvas
    function imgToDataURL(imgEl) {
        try {
            const c = document.createElement('canvas');
            c.width = imgEl.naturalWidth || imgEl.width || 1;
            c.height = imgEl.naturalHeight || imgEl.height || 1;
            c.getContext('2d').drawImage(imgEl, 0, 0);
            return c.toDataURL('image/png');
        } catch (e) {
            return null; // tainted or unavailable – skip
        }
    }

    // Save as Image Button
    saveImageBtn.addEventListener('click', async () => {
        // Hide UI handles so they don't appear in the image
        document.querySelectorAll('.draggable-item').forEach(d => d.classList.remove('active'));
        activeItem = null;

        saveImageBtn.textContent = 'Skapar bild…';
        saveImageBtn.disabled = true;

        // Pre-convert all local images to data URLs so canvas won't be tainted
        const localImgs = [];
        flyer.querySelectorAll('img').forEach(img => {
            if (!img.src) return;
            if (img.src.startsWith('data:') || img.src.startsWith('http')) return;
            if (img.classList.contains('placeholder') || img.classList.contains('hidden') || !img.complete) return;
            const dataUrl = imgToDataURL(img);
            if (dataUrl) {
                localImgs.push({ el: img, orig: img.src });
                img.src = dataUrl;
            }
        });

        try {
            const canvas = await html2canvas(flyer, {
                scale: 3,
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                logging: false,
                imageTimeout: 8000,
                onclone: (clonedDoc) => {
                    // Remove hidden placeholder images to avoid external fetch failures
                    clonedDoc.querySelectorAll('.flyer-image.placeholder, .flyer-image.hidden, img.hidden').forEach(img => img.remove());
                    // Remove external http images (Wikipedia logo etc.)
                    clonedDoc.querySelectorAll('#flyer img').forEach(img => {
                        if (img.src && img.src.startsWith('http')) img.remove();
                    });
                }
            });

            const link = document.createElement('a');
            link.download = 'jula-flyer.png';
            link.href = canvas.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Kunde inte spara bild:', err);
            alert('Kunde inte spara bild: ' + err.message);
        } finally {
            // Restore original srcs
            localImgs.forEach(({ el, orig }) => { el.src = orig; });

            saveImageBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> Spara som bild (PNG)`;
            saveImageBtn.disabled = false;
        }
    });


    // --- Dynamic Elements Logic ---
    let nextId = 1;

    // --- Price List Panel Logic ---
    const priceListItems = document.getElementById('price-list-items');
    const priceListEmpty = document.getElementById('price-list-empty');

    function updatePricePanel() {
        const rows = priceListItems.querySelectorAll('.price-list-row');
        priceListEmpty.style.display = rows.length === 0 ? 'block' : 'none';
    }

    function applyOldPriceVisibility(oldPriceEl, text) {
        // Hide (opacity 0, pointer-events none) when text is empty/whitespace
        const isEmpty = text.trim() === '';
        oldPriceEl.style.opacity = isEmpty ? '0' : '1';
        oldPriceEl.style.pointerEvents = isEmpty ? 'none' : '';
    }

    function registerPriceBadge(draggableItem) {
        const label = draggableItem.id || ('Prislapp ' + draggableItem.dataset.priceIdx);
        const oldPriceEl = draggableItem.querySelector('.old-price');
        const textEl = draggableItem.querySelector('.flyer-old-price-text');
        if (!oldPriceEl || !textEl) return;

        // Assign a stable index for labelling
        const idx = priceListItems.querySelectorAll('.price-list-row').length + 1;
        draggableItem.dataset.priceIdx = idx;

        // Apply initial visibility
        applyOldPriceVisibility(oldPriceEl, textEl.textContent);

        // Create sidebar row
        const row = document.createElement('div');
        row.className = 'price-list-row';
        row.dataset.forItem = draggableItem.id;
        row.style.cssText = 'display:flex; flex-direction:column; gap:4px; margin-bottom:10px;';

        const rowLabel = document.createElement('label');
        rowLabel.textContent = 'Prislapp ' + idx + ' – Spara-pris';
        rowLabel.style.cssText = 'font-size:0.78rem; color:var(--text-secondary);';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Lämna tomt för att dölja rutan';
        input.value = textEl.textContent.trim();
        input.style.cssText = 'font-size:0.85rem; padding:6px 10px;';

        // Sidebar → flyer sync
        input.addEventListener('input', () => {
            textEl.textContent = input.value;
            applyOldPriceVisibility(oldPriceEl, input.value);
        });

        // Flyer contenteditable → sidebar sync
        textEl.addEventListener('input', () => {
            input.value = textEl.textContent;
            applyOldPriceVisibility(oldPriceEl, textEl.textContent);
        });

        row.appendChild(rowLabel);
        row.appendChild(input);
        priceListItems.appendChild(row);

        // When the draggable item is removed from the flyer, clean up sidebar row
        const observer = new MutationObserver(() => {
            if (!document.contains(draggableItem)) {
                row.remove();
                updatePricePanel();
                observer.disconnect();
            }
        });
        observer.observe(flyerContent, { childList: true, subtree: false });

        updatePricePanel();
    }

    function addElementToFlyer(htmlContent, defaultY, customClass = '') {
        const wrapper = document.createElement('div');
        wrapper.className = `draggable-item ${customClass}`;
        wrapper.id = `item-dynamic-${nextId++}`;
        wrapper.style.setProperty('--y', `${defaultY}px`);
        wrapper.style.setProperty('--x', `0px`);
        wrapper.style.setProperty('--scale', `1`);
        wrapper.style.setProperty('--rotate', `0deg`);
        wrapper.style.zIndex = customClass === 'breaker-item' ? "5" : "40"; // Breaker sits lower so it doesn't block text

        wrapper.innerHTML = htmlContent + `
            <button class="delete-btn" title="Ta bort">&times;</button>
            <div class="rotate-handle" title="Rotera">↻</div>
            <div class="resize-handle"></div>
        `;
        flyerContent.appendChild(wrapper);
        return wrapper;
    }

    addTextBtn.addEventListener('click', () => {
        addElementToFlyer(`
            <div class="headline-container">
                <h1 class="flyer-text-element" contenteditable="true" spellcheck="false" style="font-size: 80px;">Ny Text</h1>
            </div>
        `, 400);
    });

    addPriceBtn.addEventListener('click', () => {
        const newItem = addElementToFlyer(`
            <div class="price-container">
                <div class="price-badge">
                    <span class="flyer-price" contenteditable="true" spellcheck="false">199.-</span>
                    <div class="old-price">
                        <span class="flyer-old-price-text" contenteditable="true" spellcheck="false">Spara 50.-</span>
                    </div>
                </div>
            </div>
        `, 400);
        registerPriceBadge(newItem);
    });

    addBreakerBtn.addEventListener('click', () => {
        addElementToFlyer(`
            <div class="breaker-ui">
                <div class="breaker-stripes"></div>
                <div class="breaker-fill"></div>
            </div>
        `, 400, 'breaker-item');
    });

    addFooterBannerBtn.addEventListener('click', () => {
        addElementToFlyer(`
            <div class="footer-banner-container">
                <h2 class="footer-banner-text" contenteditable="true" spellcheck="false">Erbjudandet gäller till lagret är slut</h2>
            </div>
        `, 500);
    });

    // --- Image Processing (Background Removal) ---
    function removeWhiteBackground(imgSrc, callback) {
        const img = new Image();
        img.crossOrigin = 'Anonymous';

        const isDataUrl = imgSrc.startsWith('data:');

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const MAX_DIM = 800;
            let width = img.width;
            let height = img.height;
            if (width > MAX_DIM || height > MAX_DIM) {
                if (width > height) {
                    height = Math.round(height * (MAX_DIM / width));
                    width = MAX_DIM;
                } else {
                    width = Math.round(width * (MAX_DIM / height));
                    height = MAX_DIM;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            try {
                const imgData = ctx.getImageData(0, 0, width, height);
                const data = imgData.data;
                const tolerance = 240; // High tolerance for white

                // Flood fill stack starting from all border pixels
                const stack = [];
                for (let x = 0; x < width; x++) {
                    stack.push([x, 0]);
                    stack.push([x, height - 1]);
                }
                for (let y = 0; y < height; y++) {
                    stack.push([0, y]);
                    stack.push([width - 1, y]);
                }

                while (stack.length > 0) {
                    const [x, y] = stack.pop();
                    if (x < 0 || x >= width || y < 0 || y >= height) continue;

                    const idx = (y * width + x) * 4;
                    if (data[idx + 3] === 0) continue; // Already processed

                    // Check if pixel is white-ish
                    if (data[idx] >= tolerance && data[idx + 1] >= tolerance && data[idx + 2] >= tolerance) {
                        data[idx + 3] = 0; // Make transparent

                        stack.push([x - 1, y]);
                        stack.push([x + 1, y]);
                        stack.push([x, y - 1]);
                        stack.push([x, y + 1]);
                    }
                }

                ctx.putImageData(imgData, 0, 0);
                callback(canvas.toDataURL('image/png'));
            } catch (e) {
                console.error("Canvas CORS error during background removal", e);
                callback(imgSrc); // Fallback to original image
            }
        };

        img.onerror = () => {
            console.error("Failed to load image for processing");
            callback(imgSrc);
        };

        // Use CORS proxy for external URLs to allow canvas read
        if (isDataUrl || imgSrc.includes('corsproxy.io')) {
            img.src = imgSrc;
        } else {
            img.src = 'https://corsproxy.io/?' + encodeURIComponent(imgSrc);
        }
    }

    fetchJulaImgBtn.addEventListener('click', () => {
        const url = julaImageInput.value.trim();
        if (!url) return;

        fetchJulaImgBtn.textContent = 'Laddar...';
        fetchJulaImgBtn.disabled = true;

        removeWhiteBackground(url, (processedUrl) => {
            fetchJulaImgBtn.textContent = 'Hämta';
            fetchJulaImgBtn.disabled = false;

            const placeholder = document.querySelector('.flyer-image.placeholder');
            if (placeholder) {
                placeholder.src = processedUrl;
                placeholder.style.opacity = '1';
                placeholder.classList.remove('placeholder');
                placeholder.style.width = '500px';
                placeholder.style.height = '500px';
                placeholder.style.maxHeight = 'none';
                placeholder.style.maxWidth = 'none';
                // Also need to ensure the parent draggable-item has the image-item class
                const parentDraggable = placeholder.closest('.draggable-item');
                if (parentDraggable) parentDraggable.classList.add('image-item');
            } else {
                addElementToFlyer(`
                    <div class="product-image-container">
                        <img src="${processedUrl}" alt="" class="flyer-image" style="width: 500px; height: 500px; object-fit: contain;" draggable="false">
                    </div>
                `, 0, 'image-item');
            }
        });

        julaImageInput.value = ''; // clear input
    });

    imageUpload.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                removeWhiteBackground(event.target.result, (processedUrl) => {
                    const placeholder = document.querySelector('.flyer-image.placeholder');
                    if (placeholder) {
                        placeholder.src = processedUrl;
                        placeholder.style.opacity = '1';
                        placeholder.classList.remove('placeholder');
                        placeholder.style.width = '500px';
                        placeholder.style.height = '500px';
                        placeholder.style.maxHeight = 'none';
                        placeholder.style.maxWidth = 'none';

                        const parentDraggable = placeholder.closest('.draggable-item');
                        if (parentDraggable) parentDraggable.classList.add('image-item');
                    } else {
                        addElementToFlyer(`
                            <div class="product-image-container">
                                <img src="${processedUrl}" alt="" class="flyer-image" style="width: 500px; height: 500px; object-fit: contain;" draggable="false">
                            </div>
                        `, 0, 'image-item');
                    }
                });
            }
            reader.readAsDataURL(file);
        }
        // reset input
        imageUpload.value = '';
    });

    // --- Drag, Drop, Scale & Delete Logic (Event Delegation) ---
    let activeItem = null;
    let isDragging = false;
    let isResizing = false;
    let startX, startY;
    let initialX = 0, initialY = 0, initialScale = 1;

    function setActive(item) {
        document.querySelectorAll('.draggable-item').forEach(d => d.classList.remove('active'));
        if (item) {
            item.classList.add('active');
            activeItem = item;
            updateTextSettingsPanel(item);
        } else {
            activeItem = null;
            textSettingsPanel.classList.add('hidden');
        }
    }

    // --- Text Settings Logic ---
    function getTextElement(item) {
        if (!item) return null;
        // Text can be in h1, h2, span etc depending on the added element
        return item.querySelector('[contenteditable="true"]');
    }

    function updateTextSettingsPanel(item) {
        const textEl = getTextElement(item);
        if (!textEl) {
            textSettingsPanel.classList.add('hidden');
            return;
        }

        textSettingsPanel.classList.remove('hidden');
        const style = window.getComputedStyle(textEl);

        // Update font family select
        const fontFamily = style.fontFamily;
        if (fontFamily.includes('JULA')) textFontSelect.value = 'JULA';
        else if (fontFamily.includes('Arial')) textFontSelect.value = 'Arial, sans-serif';
        else if (fontFamily.includes('Times')) textFontSelect.value = "'Times New Roman', serif";
        else if (fontFamily.includes('Courier')) textFontSelect.value = "'Courier New', monospace";
        else textFontSelect.value = 'JULA'; // Default wrap

        // Update toolbar buttons
        btnBold.classList.toggle('active', style.fontWeight === 'bold' || parseInt(style.fontWeight) >= 700);
        btnItalic.classList.toggle('active', style.fontStyle === 'italic');
        btnUnderline.classList.toggle('active', style.textDecorationLine === 'underline');

        // Update alignment buttons
        const align = style.textAlign;
        btnAlignLeft.classList.toggle('active', align === 'left');
        btnAlignCenter.classList.toggle('active', align === 'center');
        btnAlignRight.classList.toggle('active', align === 'right');

        // Note: we don't automatically parse colors back to hex perfectly, we'll just leave color picker as is unless we add an RGB to Hex converter.
    }

    function applyTextStyle(styleProp, value) {
        if (!activeItem) return;
        const textElements = activeItem.querySelectorAll('[contenteditable="true"]');
        textElements.forEach(el => {
            el.style[styleProp] = value;
        });
    }

    textFontSelect.addEventListener('change', () => applyTextStyle('fontFamily', textFontSelect.value));

    textSizeSelect.addEventListener('change', () => {
        applyTextStyle('fontSize', textSizeSelect.value);
        // Reset the value so it can act like a command palette
        textSizeSelect.selectedIndex = 0;
    });

    btnBold.addEventListener('click', () => {
        const textEl = getTextElement(activeItem);
        if (!textEl) return;
        const style = window.getComputedStyle(textEl);
        const isBold = style.fontWeight === 'bold' || parseInt(style.fontWeight) >= 700;
        applyTextStyle('fontWeight', isBold ? 'normal' : 'bold');
        btnBold.classList.toggle('active', !isBold);
    });

    btnItalic.addEventListener('click', () => {
        const textEl = getTextElement(activeItem);
        if (!textEl) return;
        const style = window.getComputedStyle(textEl);
        const isItalic = style.fontStyle === 'italic';
        applyTextStyle('fontStyle', isItalic ? 'normal' : 'italic');
        btnItalic.classList.toggle('active', !isItalic);
    });

    btnUnderline.addEventListener('click', () => {
        const textEl = getTextElement(activeItem);
        if (!textEl) return;
        const style = window.getComputedStyle(textEl);
        const isUnderline = style.textDecorationLine === 'underline';
        applyTextStyle('textDecoration', isUnderline ? 'none' : 'underline');
        btnUnderline.classList.toggle('active', !isUnderline);
    });

    btnAlignLeft.addEventListener('click', () => {
        applyTextStyle('textAlign', 'left');
        btnAlignLeft.classList.add('active');
        btnAlignCenter.classList.remove('active');
        btnAlignRight.classList.remove('active');
    });

    btnAlignCenter.addEventListener('click', () => {
        applyTextStyle('textAlign', 'center');
        btnAlignLeft.classList.remove('active');
        btnAlignCenter.classList.add('active');
        btnAlignRight.classList.remove('active');
    });

    btnAlignRight.addEventListener('click', () => {
        applyTextStyle('textAlign', 'right');
        btnAlignLeft.classList.remove('active');
        btnAlignCenter.classList.remove('active');
        btnAlignRight.classList.add('active');
    });

    textColorPicker.addEventListener('input', (e) => {
        applyTextStyle('color', e.target.value);
    });

    btnResetText.addEventListener('click', () => {
        if (!activeItem) return;
        const textElements = activeItem.querySelectorAll('[contenteditable="true"]');
        textElements.forEach(el => {
            el.removeAttribute('style'); // Clear inline styles
            // Keep font size via class or specific rule if needed, but removeAttribute clears inline.
            // Since we use inline font-size on headlines, we should restore it nicely but let's just clear custom toggles.
            el.style.fontSize = '';
            el.style.fontFamily = '';
            el.style.fontWeight = 'normal'; // Fix bold
            el.style.fontStyle = '';
            el.style.textDecoration = '';
            el.style.textAlign = '';
            el.style.color = '';
        });
        updateTextSettingsPanel(activeItem);
    });

    document.addEventListener('mousedown', (e) => {
        const item = e.target.closest('.draggable-item');

        // 1. Click outside flyer items and sidebar
        if (!item && !e.target.closest('.editor-sidebar') && !e.target.closest('.preview-zoom-controls')) {
            setActive(null);
            return;
        }

        if (!item) return;

        // 2. Click Delete
        if (e.target.closest('.delete-btn')) {
            item.remove();
            setActive(null);
            return;
        }

        // Initialize vars if they don't exist
        if (!item.style.getPropertyValue('--x')) item.style.setProperty('--x', '0px');
        if (!item.style.getPropertyValue('--scale')) item.style.setProperty('--scale', '1');

        // 3. Click Resize Handle
        if (e.target.closest('.resize-handle')) {
            e.preventDefault();
            e.stopPropagation();
            isResizing = true;
            setActive(item);
            startX = e.clientX;
            startY = e.clientY;
            initialScale = parseFloat(item.style.getPropertyValue('--scale')) || 1;
            return;
        }

        // 4. Click Rotate Handle
        if (e.target.closest('.rotate-handle')) {
            e.preventDefault();
            e.stopPropagation();
            isRotating = true;
            setActive(item);

            const rect = item.getBoundingClientRect();
            centerX = rect.left + rect.width / 2;
            centerY = rect.top + rect.height / 2;

            initialRotate = parseFloat(item.style.getPropertyValue('--rotate')) || 0;
            startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
            return;
        }

        // 5. Click Item (Drag or Edit)
        if (e.button !== 0) return; // Only left click

        setActive(item);

        // If clicking inside contenteditable, don't drag so user can select text
        if (e.target.closest('[contenteditable="true"]')) {
            return;
        }

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialX = parseFloat(item.style.getPropertyValue('--x')) || 0;
        initialY = parseFloat(item.style.getPropertyValue('--y')) || 0;
    });

    document.addEventListener('mousemove', (e) => {
        if (!activeItem) return;

        const dx = (e.clientX - startX) / currentZoom;
        const dy = (e.clientY - startY) / currentZoom;

        if (isDragging) {
            activeItem.style.setProperty('--x', `${initialX + dx}px`);
            activeItem.style.setProperty('--y', `${initialY + dy}px`);
        } else if (isResizing) {
            const scaleFactor = 0.005;
            const newScale = Math.max(0.1, initialScale + (dx * scaleFactor));
            activeItem.style.setProperty('--scale', newScale);
        } else if (isRotating) {
            const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
            const angleDelta = currentAngle - startAngle;
            const newAngle = initialRotate + angleDelta;
            activeItem.style.setProperty('--rotate', `${newAngle}deg`);
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        isResizing = false;
        isRotating = false;
    });

    // Initialize
    updateThemeAndFormat();
    autoFitZoom();

    // Initial loop to set properties on static items
    document.querySelectorAll('.draggable-item').forEach(item => {
        if (!item.style.getPropertyValue('--x')) item.style.setProperty('--x', '0px');
        if (!item.style.getPropertyValue('--scale')) item.style.setProperty('--scale', '1');
        if (!item.style.getPropertyValue('--rotate')) item.style.setProperty('--rotate', '0deg');
        // Register any pre-existing price badges (static HTML)
        if (item.querySelector('.old-price')) {
            registerPriceBadge(item);
        }
    });

    window.addEventListener('resize', autoFitZoom);

    // --- Save / Load Project (JSON) ---
    function serializeProject() {
        const items = [];
        document.querySelectorAll('#flyer-content .draggable-item').forEach(item => {
            // Extract content (skip handles)
            const contentEl = item.querySelector('.price-container, .headline-container, .footer-container, .product-image-container, .breaker-ui, .footer-banner-container');
            items.push({
                id: item.id,
                customClass: item.className.replace('draggable-item', '').replace('active', '').trim(),
                x: item.style.getPropertyValue('--x'),
                y: item.style.getPropertyValue('--y'),
                scale: item.style.getPropertyValue('--scale'),
                rotate: item.style.getPropertyValue('--rotate'),
                zIndex: item.style.zIndex,
                contentHTML: contentEl ? contentEl.outerHTML : ''
            });
        });
        return {
            version: 1,
            format: formatSelect.value,
            theme: themeSelect.value,
            nextId: nextId,
            items
        };
    }

    function deserializeProject(data) {
        if (!data || data.version !== 1) {
            alert('Ogiltigt projektformat.');
            return;
        }

        // Clear existing items
        document.querySelectorAll('#flyer-content .draggable-item').forEach(el => el.remove());
        // Clear price panel
        priceListItems.innerHTML = '';
        updatePricePanel();

        // Restore settings
        formatSelect.value = data.format || 'a4';
        themeSelect.value = data.theme || 'theme-red';
        updateThemeAndFormat();
        nextId = data.nextId || 1;

        // Restore items
        data.items.forEach(item => {
            const wrapper = document.createElement('div');
            wrapper.className = `draggable-item ${item.customClass}`;
            wrapper.id = item.id;
            wrapper.style.setProperty('--x', item.x || '0px');
            wrapper.style.setProperty('--y', item.y || '0px');
            wrapper.style.setProperty('--scale', item.scale || '1');
            wrapper.style.setProperty('--rotate', item.rotate || '0deg');
            wrapper.style.zIndex = item.zIndex || '40';
            wrapper.innerHTML = item.contentHTML + `
                <button class="delete-btn" title="Ta bort">&times;</button>
                <div class="rotate-handle" title="Rotera">↻</div>
                <div class="resize-handle"></div>
            `;
            flyerContent.appendChild(wrapper);

            // Re-register price badges
            if (wrapper.querySelector('.old-price')) {
                registerPriceBadge(wrapper);
            }
        });
    }

    saveProjectBtn.addEventListener('click', () => {
        const data = serializeProject();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const link = document.createElement('a');
        link.download = 'jula-projekt.json';
        link.href = URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    });

    loadProjectBtn.addEventListener('click', () => {
        loadProjectInput.click();
    });

    loadProjectInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                deserializeProject(data);
            } catch (err) {
                alert('Kunde inte läsa projektfilen. Kontrollera att det är en giltig JSON-fil.');
            }
        };
        reader.readAsText(file);
        loadProjectInput.value = ''; // reset so same file can be reloaded
    });
});
