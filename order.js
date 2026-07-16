const packageDetails = {
  starter: {
    title: 'Starter Website',
    description: 'A professional one-page website for small businesses that need to get online quickly.',
    features: ['Professional one-page website', 'Business information', 'Responsive design'],
    price: '$99',
    priceNote: 'One-time website development price',
  },
  business: {
    title: 'Business Website',
    description: 'A complete multi-page website with forms, galleries, and everything most businesses need.',
    features: ['Complete multi-page website', 'Forms and galleries', 'Responsive design'],
    price: '$199',
    priceNote: 'One-time website development price',
  },
  advanced: {
    title: 'Advanced Website',
    description: 'A custom website with databases, customer data storage, dashboards, or advanced workloads.',
    features: ['Databases and data storage', 'Custom dashboards', 'Advanced workloads'],
    price: 'Starting at $299',
    priceNote: 'Final quote provided after project review',
  },
};

// Basin form endpoints are public submission URLs and are safe to include here.
const BASIN_FORM_ENDPOINT = 'https://usebasin.com/f/5d1779d23c6f';

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
  summaryCare.textContent = careInput.checked ? 'Interested — from $59/month' : 'Not selected';
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

  const formData = new FormData(orderForm);
  const order = {
    form_type: 'Website Project Request',
    website_package: formData.get('website_package'),
    business_name: formData.get('business_name'),
    contact_name: formData.get('contact_name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    business_description: formData.get('business_description'),
    website_needs: formData.getAll('website_needs').join(', ') || 'None selected',
    website_request: formData.get('website_request'),
    monthly_site_care: careInput.checked ? 'Yes' : 'No',
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
    const response = await fetch(BASIN_FORM_ENDPOINT, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(order),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || 'Basin rejected the request.');
    }

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
