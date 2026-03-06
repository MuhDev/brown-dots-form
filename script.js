document.addEventListener('DOMContentLoaded', () => {
    // ===== DOM Elements =====
    const form = document.getElementById('preOrderForm');
    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');
    const quantityInput = document.getElementById('quantity');
    const deliveryRadios = document.querySelectorAll('input[name="delivery_method"]');
    const deliveryFields = document.getElementById('deliveryFields');
    const pickupFields = document.getElementById('pickupFields');
    const totalAmountEl = document.getElementById('totalAmount');
    const submitBtn = document.getElementById('submitBtn');
    const successModal = document.getElementById('successModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');

    const PRICE_PER_UNIT = 395;

    // ===== File Upload Elements =====
    const fileInput = document.getElementById('paymentReceipt');
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileUploadContent = document.getElementById('fileUploadContent');
    const filePreview = document.getElementById('filePreview');
    const fileNameEl = document.getElementById('fileName');
    const fileRemoveBtn = document.getElementById('fileRemoveBtn');
    const copyIbanBtn = document.getElementById('copyIbanBtn');
    const ibanValue = document.getElementById('ibanValue');

    // ===== Toggle Delivery/Pickup Fields =====
    deliveryRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const value = e.target.value;

            if (value === 'delivery') {
                deliveryFields.classList.add('active');
                pickupFields.classList.remove('active');
                // Reset pickup selection
                document.querySelectorAll('input[name="pickup_date"]').forEach(r => r.checked = false);
            } else if (value === 'pickup') {
                pickupFields.classList.add('active');
                deliveryFields.classList.remove('active');
                // Reset delivery fields
                document.querySelectorAll('input[name="delivery_date"]').forEach(r => r.checked = false);
                document.getElementById('deliveryLat').value = '';
                document.getElementById('deliveryLng').value = '';
                if (window.deliveryMarker) {
                    window.deliveryMap.removeLayer(window.deliveryMarker);
                    window.deliveryMarker = null;
                    document.getElementById('mapHint').classList.remove('hidden');
                    document.querySelector('.map-container').classList.remove('has-marker');
                }
            }

            // Clear delivery method error
            clearError('delivery-error');
        });
    });

    // ===== Update Total Price =====
    quantityInput.addEventListener('input', () => {
        let qty = parseInt(quantityInput.value) || 1;
        if (qty < 1) qty = 1;
        if (qty > 50) qty = 50;
        const total = qty * PRICE_PER_UNIT;
        totalAmountEl.textContent = total.toLocaleString('ar-SA') + ' ر.س';
    });

    // ===== Phone Input - Numbers Only =====
    phoneInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
        if (phoneInput.classList.contains('error')) {
            validatePhone();
        }
    });

    // ===== Real-time Validation on Blur =====
    nameInput.addEventListener('blur', () => {
        validateName();
    });

    phoneInput.addEventListener('blur', () => {
        validatePhone();
    });

    // ===== Validation Functions =====
    function validateName() {
        const value = nameInput.value.trim();
        if (!value) {
            showError('name', 'name-error', 'يرجى إدخال الاسم');
            return false;
        }
        clearError('name-error');
        nameInput.classList.remove('error');
        return true;
    }

    function validatePhone() {
        const value = phoneInput.value.trim();
        const phoneRegex = /^05\d{8}$/;

        if (!value) {
            showError('phone', 'phone-error', 'يرجى إدخال رقم الجوال');
            return false;
        }
        if (!phoneRegex.test(value)) {
            showError('phone', 'phone-error', 'يجب أن يكون رقم الجوال 10 أرقام ويبدأ بـ 05');
            return false;
        }
        clearError('phone-error');
        phoneInput.classList.remove('error');
        return true;
    }

    function validateDeliveryMethod() {
        const selected = document.querySelector('input[name="delivery_method"]:checked');
        if (!selected) {
            showError(null, 'delivery-error', 'يرجى اختيار طريقة الاستلام');
            return false;
        }
        clearError('delivery-error');
        return true;
    }

    function validateDeliveryFields() {
        let valid = true;
        const method = document.querySelector('input[name="delivery_method"]:checked');

        if (!method) return false;

        if (method.value === 'delivery') {
            // Map location
            const lat = document.getElementById('deliveryLat').value;
            const lng = document.getElementById('deliveryLng').value;
            if (!lat || !lng) {
                showError(null, 'map-error', 'يرجى تحديد موقع التوصيل على الخريطة');
                valid = false;
            } else {
                clearError('map-error');
            }

            // Delivery Date
            const deliveryDate = document.querySelector('input[name="delivery_date"]:checked');
            if (!deliveryDate) {
                showError(null, 'delivery-date-error', 'يرجى اختيار تاريخ التوصيل');
                valid = false;
            } else {
                clearError('delivery-date-error');
            }

        } else if (method.value === 'pickup') {
            // Pickup Date
            const pickupDate = document.querySelector('input[name="pickup_date"]:checked');
            if (!pickupDate) {
                showError(null, 'pickup-date-error', 'يرجى اختيار موعد الاستلام');
                valid = false;
            } else {
                clearError('pickup-date-error');
            }
        }

        return valid;
    }

    // ===== Helper Functions =====
    function showError(inputId, errorId, message) {
        const errorEl = document.getElementById(errorId);
        errorEl.textContent = message;
        errorEl.classList.add('visible');
        if (inputId) {
            document.getElementById(inputId).classList.add('error');
        }
    }

    function clearError(errorId) {
        const errorEl = document.getElementById(errorId);
        if (errorEl) {
            errorEl.classList.remove('visible');
        }
    }

    function clearAllErrors() {
        document.querySelectorAll('.error-message').forEach(el => el.classList.remove('visible'));
        document.querySelectorAll('.form-control.error').forEach(el => el.classList.remove('error'));
    }

    // ===== Receipt Validation =====
    function validateReceipt() {
        if (!fileInput.files || fileInput.files.length === 0) {
            showError(null, 'receipt-error', 'يرجى رفع إيصال الدفع');
            return false;
        }
        clearError('receipt-error');
        return true;
    }

    // ===== Copy IBAN =====
    copyIbanBtn.addEventListener('click', () => {
        const iban = ibanValue.textContent;
        navigator.clipboard.writeText(iban).then(() => {
            copyIbanBtn.textContent = '✅';
            copyIbanBtn.classList.add('copied');
            setTimeout(() => {
                copyIbanBtn.textContent = '📋';
                copyIbanBtn.classList.remove('copied');
            }, 2000);
        });
    });

    // ===== Copy Account Number =====
    const copyAccountBtn = document.querySelector('.copy-account-btn');
    if (copyAccountBtn) {
        copyAccountBtn.addEventListener('click', () => {
            const accountNum = copyAccountBtn.closest('.iban-wrapper').querySelector('.iban-value').textContent;
            navigator.clipboard.writeText(accountNum).then(() => {
                copyAccountBtn.textContent = '✅';
                copyAccountBtn.classList.add('copied');
                setTimeout(() => {
                    copyAccountBtn.textContent = '📋';
                    copyAccountBtn.classList.remove('copied');
                }, 2000);
            });
        });
    }

    // ===== File Upload =====
    fileUploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        handleFileSelect(fileInput.files);
    });

    // Drag and drop
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
    });

    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.classList.remove('dragover');
    });

    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelect(e.dataTransfer.files);
        }
    });

    function handleFileSelect(files) {
        if (files && files.length > 0) {
            const file = files[0];
            fileNameEl.textContent = file.name;
            fileUploadContent.style.display = 'none';
            filePreview.style.display = 'flex';
            fileUploadArea.classList.add('has-file');
            clearError('receipt-error');
        }
    }

    fileRemoveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.value = '';
        fileUploadContent.style.display = 'block';
        filePreview.style.display = 'none';
        fileUploadArea.classList.remove('has-file');
    });

    // ===== Form Submission =====
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Clear previous errors
        clearAllErrors();

        // Run all validations
        const isNameValid = validateName();
        const isPhoneValid = validatePhone();
        const isMethodValid = validateDeliveryMethod();
        const isFieldsValid = validateDeliveryFields();

        const isReceiptValid = validateReceipt();

        if (!isNameValid || !isPhoneValid || !isMethodValid || !isFieldsValid || !isReceiptValid) {
            // Scroll to first error
            const firstError = document.querySelector('.error-message.visible');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        // Collect form data into FormData (to include file)
        const method = document.querySelector('input[name="delivery_method"]:checked').value;
        const formDataObj = new FormData();

        formDataObj.append('name', nameInput.value.trim());
        formDataObj.append('phone', phoneInput.value.trim());
        formDataObj.append('quantity', parseInt(quantityInput.value));
        formDataObj.append('total', parseInt(quantityInput.value) * PRICE_PER_UNIT);
        formDataObj.append('deliveryMethod', method);

        if (method === 'delivery') {
            const lat = document.getElementById('deliveryLat').value;
            const lng = document.getElementById('deliveryLng').value;
            const googleMapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
            formDataObj.append('location', googleMapsLink);
            formDataObj.append('deliveryDate', document.querySelector('input[name="delivery_date"]:checked').value);
        } else {
            formDataObj.append('pickupDate', document.querySelector('input[name="pickup_date"]:checked').value);
        }

        // Append receipt file
        if (fileInput.files && fileInput.files.length > 0) {
            formDataObj.append('paymentReceipt', fileInput.files[0]);
        }

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري إرسال الطلب...';

        // POST to webhook
        fetch('https://n8n.tawreedplus.com/webhook/6a5ee28f-8e49-41dc-80d4-4cc5134685eb', {
            method: 'POST',
            body: formDataObj,
        })
            .then(response => {
                if (response.ok) {
                    // Show success modal
                    successModal.classList.add('active');
                    submitBtn.textContent = 'تم إرسال الطلب ✓';
                } else {
                    throw new Error('حدث خطأ أثناء إرسال الطلب');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.');
                submitBtn.disabled = false;
                submitBtn.textContent = 'تأكيد الطلب المسبق ✨';
            });
    });

    // ===== Modal Close =====
    modalCloseBtn.addEventListener('click', () => {
        successModal.classList.remove('active');
        // Reset form
        form.reset();
        deliveryFields.classList.remove('active');
        pickupFields.classList.remove('active');
        totalAmountEl.textContent = '395 ر.س';
        submitBtn.disabled = false;
        submitBtn.textContent = 'تأكيد الطلب المسبق ✨';
        clearAllErrors();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Close modal on overlay click
    successModal.addEventListener('click', (e) => {
        if (e.target === successModal) {
            modalCloseBtn.click();
        }
    });

    // ===== Quantity Controls =====
    quantityInput.addEventListener('change', () => {
        let qty = parseInt(quantityInput.value);
        if (isNaN(qty) || qty < 1) {
            quantityInput.value = 1;
        } else if (qty > 50) {
            quantityInput.value = 50;
        }
        // Trigger input event to update total
        quantityInput.dispatchEvent(new Event('input'));
    });

    // ===== Product Image Carousel =====
    const carouselTrack = document.getElementById('carouselTrack');
    const dots = document.querySelectorAll('.carousel-dots .dot');
    let currentSlide = 0;
    const totalSlides = dots.length;
    let autoPlayInterval;

    function goToSlide(index) {
        currentSlide = index;
        // RTL: use positive translateX
        carouselTrack.style.transform = `translateX(${currentSlide * 100}%)`;
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSlide);
        });
    }

    function nextSlide() {
        goToSlide((currentSlide + 1) % totalSlides);
    }

    // Dot click navigation
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const index = parseInt(dot.dataset.index);
            goToSlide(index);
            resetAutoPlay();
        });
    });

    // Auto-play
    function startAutoPlay() {
        autoPlayInterval = setInterval(nextSlide, 3500);
    }

    function resetAutoPlay() {
        clearInterval(autoPlayInterval);
        startAutoPlay();
    }

    startAutoPlay();

    // ===== Leaflet Map =====
    let mapInitialized = false;

    function initMap() {
        if (mapInitialized) return;
        mapInitialized = true;

        // Center on Jeddah
        const map = L.map('map', {
            center: [21.5, 39.2],
            zoom: 11,
            zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 19,
        }).addTo(map);

        window.deliveryMap = map;
        window.deliveryMarker = null;

        const latInput = document.getElementById('deliveryLat');
        const lngInput = document.getElementById('deliveryLng');
        const mapHint = document.getElementById('mapHint');
        const mapContainer = document.querySelector('.map-container');

        // Custom marker icon using brown theme
        const brownIcon = L.divIcon({
            className: 'custom-marker',
            html: '<div style="background:linear-gradient(135deg,#5C3D2E,#7A5C4F);width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>',
            iconSize: [30, 30],
            iconAnchor: [15, 30],
        });

        function placeMarker(latlng) {
            if (window.deliveryMarker) {
                window.deliveryMarker.setLatLng(latlng);
            } else {
                window.deliveryMarker = L.marker(latlng, { icon: brownIcon }).addTo(map);
            }
            latInput.value = latlng.lat.toFixed(6);
            lngInput.value = latlng.lng.toFixed(6);
            mapHint.classList.add('hidden');
            mapContainer.classList.add('has-marker');
            clearError('map-error');
        }

        // Click on map to place marker
        map.on('click', (e) => {
            placeMarker(e.latlng);
        });

        // Locate me button
        const locateBtn = document.getElementById('locateMeBtn');
        locateBtn.addEventListener('click', () => {
            if (!navigator.geolocation) {
                alert('المتصفح لا يدعم تحديد الموقع');
                return;
            }
            locateBtn.classList.add('loading');
            locateBtn.textContent = '⏳ جاري تحديد الموقع...';

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const latlng = L.latLng(pos.coords.latitude, pos.coords.longitude);
                    map.setView(latlng, 16);
                    placeMarker(latlng);
                    locateBtn.classList.remove('loading');
                    locateBtn.textContent = '📍 حدد موقعي الحالي';
                },
                (err) => {
                    alert('تعذر تحديد الموقع. تأكد من تفعيل خدمة الموقع.');
                    locateBtn.classList.remove('loading');
                    locateBtn.textContent = '📍 حدد موقعي الحالي';
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    }

    // Initialize map when delivery is selected
    deliveryRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'delivery') {
                // Delay to allow CSS transition/display change
                setTimeout(() => {
                    initMap();
                    if (window.deliveryMap) {
                        window.deliveryMap.invalidateSize();
                    }
                }, 100);
            }
        });
    });
});
