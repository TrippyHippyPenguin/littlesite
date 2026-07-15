const packageDetails = {
  simple: {
    title: 'Simple Website',
    description: 'A polished informational website for services, pricing, and contact details.',
    features: ['Business information', 'Services and pricing', 'Responsive design'],
    price: '$50',
    priceNote: 'Fixed project price',
  },
  advanced: {
    title: 'Advanced Website',
    description: 'A custom platform for business data, workflows, scheduling, and admin tools.',
    features: ['Custom workflows', 'Secure data storage', 'Admin tools and dashboards'],
    price: '$150–$250',
    priceNote: 'Estimated range — final quote provided',
  },
};

// Replace this with the /exec URL from your deployed Google Apps Script web app.
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbykA_r6J1c7Pisp_rV3cRogpDLhFR8xLHKWFP0YKYiVdy8_hRBk6TxcST4OV4gaZes8/exec';

const packageInputs = document.querySelectorAll('[data-package]');
const careInput = document.querySelector('[name="monthly_site_care"]');
const summaryTitle = document.getElementById('summary-package');
const summaryDescription = document.getElementById('summary-description');
const summaryFeatures = document.getElementById('summary-features');
const summaryCare = document.getElementById('summary-care');
const summaryPrice = document.getElementById('summary-price');
const summaryPriceNote = document.getElementById('summary-price-note');
const advancedNeeds = document.getElementById('advanced-needs');
const capabilityGuidance = document.getElementById('capability-guidance');
const advancedNeedInputs = document.querySelectorAll('[data-advanced-need]');

function updateAvailableNeeds(packageName) {
  const isAdvanced = packageName === 'advanced';
  advancedNeeds.hidden = !isAdvanced;
  capabilityGuidance.hidden = isAdvanced;

  advancedNeedInputs.forEach((input) => {
    input.disabled = !isAdvanced;
    if (!isAdvanced) input.checked = false;
  });
}

function updatePackage(packageName) {
  const details = packageDetails[packageName];
  if (!details) return;

  summaryTitle.textContent = details.title;
  summaryDescription.textContent = details.description;
  summaryFeatures.innerHTML = details.features.map((feature) => `<li><i>✓</i>${feature}</li>`).join('');
  summaryPrice.textContent = details.price;
  summaryPriceNote.textContent = details.priceNote;
  updateAvailableNeeds(packageName);
}

packageInputs.forEach((input) => {
  input.addEventListener('change', () => updatePackage(input.dataset.package));
});

careInput.addEventListener('change', () => {
  summaryCare.textContent = careInput.checked ? 'Interested' : 'Not selected';
  summaryCare.classList.toggle('selected', careInput.checked);
});

const selectedFromUrl = new URLSearchParams(window.location.search).get('package');
const matchingInput = [...packageInputs].find((input) => input.dataset.package === selectedFromUrl);

updateAvailableNeeds(null);

if (matchingInput) {
  matchingInput.checked = true;
  updatePackage(selectedFromUrl);
}

const orderForm = document.getElementById('order-form');
const submitButton = document.querySelector('.submit-order');
const submitStatus = document.getElementById('submit-status');
const submitArea = document.querySelector('.form-submit-area');
const submitHeading = document.getElementById('submit-heading');
const submitCopy = document.getElementById('submit-copy');

function setSubmitStatus(message, type = '') {
  submitStatus.textContent = message;
  submitStatus.classList.remove('success', 'error');
  if (type) submitStatus.classList.add(type);
}

submitButton.addEventListener('click', async () => {
  if (!orderForm.reportValidity()) return;

  if (GOOGLE_APPS_SCRIPT_URL.includes('PASTE_YOUR_')) {
    setSubmitStatus('Add your deployed Google Apps Script URL in order.js before accepting orders.', 'error');
    return;
  }

  const formData = new FormData(orderForm);
  const order = {
    website_package: formData.get('website_package'),
    business_name: formData.get('business_name'),
    contact_name: formData.get('contact_name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    business_description: formData.get('business_description'),
    website_needs: formData.getAll('website_needs'),
    website_request: formData.get('website_request'),
    monthly_site_care: careInput.checked,
    payment_method: formData.get('payment_method'),
    submitted_at: new Date().toISOString(),
    page_url: window.location.href,
    website: formData.get('website'),
  };

  const originalButtonContent = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.textContent = 'Sending…';
  setSubmitStatus('Sending your project request…');

  try {
    await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(order),
    });

    submitArea.classList.add('submitted');
    submitHeading.textContent = 'Order request sent';
    submitCopy.textContent = `Thank you, ${order.contact_name}. Your project details are now with TWM Tech.`;
    submitButton.textContent = 'Order sent ✓';
    setSubmitStatus(`I’ll review your request and reach out to ${order.email} by email soon.`, 'success');
  } catch (error) {
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonContent;
    setSubmitStatus('The request could not be sent. Check your connection and try again.', 'error');
  }
});

document.getElementById('year').textContent = new Date().getFullYear();
