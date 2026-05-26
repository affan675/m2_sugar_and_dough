/* ============================================
   Sugar & Dough Bakery – main.js
   Full functionality:
   - Mobile hamburger menu
   - URL param pre‑fill (dish + price)
   - Live inline form validation
   - AJAX order submission (Formspree)
   - Smooth redirect to thankyou.html (confetti there)
   - Dynamic footer year
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Set current year in footer ---
    document.querySelectorAll('#current-year').forEach(el => {
        el.textContent = new Date().getFullYear();
    });

    // --- 2. Mobile hamburger menu toggle ---
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('nav');

    if (hamburger && nav) {
        hamburger.addEventListener('click', () => {
            const expanded = hamburger.getAttribute('aria-expanded') === 'true';
            hamburger.setAttribute('aria-expanded', !expanded);
            nav.classList.toggle('active');
            hamburger.classList.toggle('active');
        });

        // Close menu on link click
        document.querySelectorAll('.nav__link').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // --- 3. URL parameter pre‑fill (dish & price) ---
    const orderForm = document.getElementById('order-form-element');
    const summaryDiv = document.getElementById('order-summary');
    const summaryDish = document.getElementById('summary-dish');
    const summaryPrice = document.getElementById('summary-price');
    const dishSelect = document.getElementById('dish-select');

    if (orderForm && summaryDiv) {
        const params = new URLSearchParams(window.location.search);
        const dishParam = params.get('dish');
        const priceParam = params.get('price');

        if (dishParam && priceParam) {
            summaryDiv.style.display = 'block';
            summaryDish.textContent = decodeURIComponent(dishParam);
            summaryPrice.textContent = '₹' + decodeURIComponent(priceParam);

            // Auto‑select matching dish
            if (dishSelect) {
                const options = dishSelect.options;
                for (let i = 0; i < options.length; i++) {
                    if (options[i].value === dishParam) {
                        dishSelect.selectedIndex = i;
                        break;
                    }
                }
            }
        } else {
            summaryDiv.style.display = 'none';
        }
    }

    // --- 4. If the user manually picks a dish, update summary card ---
    if (dishSelect && summaryDiv) {
        dishSelect.addEventListener('change', () => {
            const selected = dishSelect.options[dishSelect.selectedIndex];
            const dishName = selected.value;
            const priceMatch = selected.text.match(/₹(\d+)/);
            if (dishName && priceMatch) {
                summaryDiv.style.display = 'block';
                summaryDish.textContent = dishName;
                summaryPrice.textContent = '₹' + priceMatch[1];
            } else {
                summaryDiv.style.display = 'none';
            }
        });
    }

    // --- 5. Form validation & AJAX submission ---
    if (!orderForm) return; // stop if no form present

    // Grab all form fields & error spans
    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');
    const quantityInput = document.getElementById('quantity');
    const dateInput = document.getElementById('pickup-date');
    const timeInput = document.getElementById('pickup-time');
    const nameErr = document.getElementById('name-error');
    const phoneErr = document.getElementById('phone-error');
    const dishErr = document.getElementById('dish-error');
    const quantityErr = document.getElementById('quantity-error');
    const dateErr = document.getElementById('date-error');
    const timeErr = document.getElementById('time-error');

    // Set min date to today
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }

    // Helper: show / clear error
    function showError(field, errEl, msg) {
        if (errEl) errEl.textContent = msg;
        field.classList.add('input-error');
    }
    function clearError(field, errEl) {
        if (errEl) errEl.textContent = '';
        field.classList.remove('input-error');
    }

    // Individual validation functions
    function valName() {
        if (!nameInput) return true;
        const val = nameInput.value.trim();
        if (val === '') { showError(nameInput, nameErr, 'Full name is required.'); return false; }
        clearError(nameInput, nameErr);
        return true;
    }

    function valPhone() {
        if (!phoneInput) return true;
        const val = phoneInput.value.trim();
        if (!/^[0-9]{10}$/.test(val)) { showError(phoneInput, phoneErr, 'Enter a valid 10‑digit number.'); return false; }
        clearError(phoneInput, phoneErr);
        return true;
    }

    function valDish() {
        if (!dishSelect) return true;
        if (dishSelect.value === '') { showError(dishSelect, dishErr, 'Please choose a dish.'); return false; }
        clearError(dishSelect, dishErr);
        return true;
    }

    function valQty() {
        if (!quantityInput) return true;
        const q = parseInt(quantityInput.value, 10);
        if (isNaN(q) || q < 1 || q > 10) { showError(quantityInput, quantityErr, 'Quantity must be 1–10.'); return false; }
        clearError(quantityInput, quantityErr);
        return true;
    }

    function valDate() {
        if (!dateInput || dateInput.value === '') { showError(dateInput, dateErr, 'Pickup date is required.'); return false; }
        clearError(dateInput, dateErr);
        return true;
    }

    function valTime() {
        if (!timeInput || timeInput.value === '') { showError(timeInput, timeErr, 'Pickup time is required.'); return false; }
        clearError(timeInput, timeErr);
        return true;
    }

    // Attach live validation
    nameInput?.addEventListener('blur', valName);
    phoneInput?.addEventListener('blur', valPhone);
    dishSelect?.addEventListener('change', valDish);
    quantityInput?.addEventListener('blur', valQty);
    dateInput?.addEventListener('blur', valDate);
    timeInput?.addEventListener('blur', valTime);

    // --- 6. Submit handler (AJAX to Formspree) ---
    orderForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Run all checks
        let valid = true;
        if (!valName()) valid = false;
        if (!valPhone()) valid = false;
        if (!valDish()) valid = false;
        if (!valQty()) valid = false;
        if (!valDate()) valid = false;
        if (!valTime()) valid = false;

        if (!valid) {
            // Scroll to first error
            const firstErr = document.querySelector('.input-error');
            if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const submitBtn = orderForm.querySelector('.form-submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Placing Order...';
        submitBtn.disabled = true;

        const formData = new FormData(orderForm);

        fetch(orderForm.action, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        })
        .then(response => {
            if (response.ok) {
                // Store flag for confetti on thankyou page
                sessionStorage.setItem('orderPlaced', 'true');
                window.location.href = 'thankyou.html';
            } else {
                // Server error
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                alert('Oops! Something went wrong. Please try again or contact us via WhatsApp.');
            }
        })
        .catch(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            alert('Network error. Please check your connection and try again.');
        });
    });

}); // end DOMContentLoaded