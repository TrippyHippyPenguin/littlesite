// Basin form endpoints are public submission URLs and are safe to include here.
const BASIN_FORM_ENDPOINT = 'https://usebasin.com/f/5d1779d23c6f';

const planDetails = {
  essential: {
    title: 'Essential Hosting',
    description: 'Managed hosting, security, monitoring, backups, and professional maintenance for a focused website.',
    features: ['Managed website hosting', 'Routine maintenance', 'Backups and monitoring'],
    price: '$59/month',
  },
  business: {
    title: 'Business Hosting',
    description: 'Managed hosting, security, monitoring, backups, and professional maintenance for a complete business website.',
    features: ['Managed website hosting', 'Routine maintenance', 'Backups and monitoring'],
    price: '$79/month',
  },
  advanced: {
    title: 'Advanced Hosting',
    description: 'Managed hosting and maintenance for databases, stored customer data, dashboards, or advanced workloads.',
    features: ['Advanced hosting', 'Database and data support', 'Workload monitoring'],
    price: '$129/month',
  },
};

const planInputs = document.querySelectorAll('[data-plan]');
const advancedHostingNeeds = document.getElementById('advanced-hosting-needs');
const advancedHostingNeedInputs = document.querySelectorAll('[data-advanced-hosting-need]');
const careGuidance = document.getElementById('care-guidance');
const summaryTitle = document.getElementById('summary-package');
const summaryDescription = document.getElementById('summary-description');
const summaryFeatures = document.getElementById('summary-features');
const summaryPrice = document.getElementById('summary-price');

function updateAvailableNeeds(planName) {
  const isAdvanced = planName === 'advanced';
  advancedHostingNeeds.hidden = !isAdvanced;
  careGuidance.hidden = isAdvanced;

  advancedHostingNeedInputs.forEach((input) => {
    input.disabled = !isAdvanced;
    if (!isAdvanced) input.checked = false;
  });
}

function updatePlan(planName) {
  const details = planDetails[planName];
  if (!details) return;

  summaryTitle.textContent = details.title;
  summaryDescription.textContent = details.description;
  summaryPrice.textContent = details.price;
  summaryFeatures.innerHTML = details.features.map((feature) => `<li><i>✓</i>${feature}</li>`).join('');
  updateAvailableNeeds(planName);
}

planInputs.forEach((input) => {
  input.addEventListener('change', () => updatePlan(input.dataset.plan));
});

updateAvailableNeeds(null);

const selectedFromUrl = new URLSearchParams(window.location.search).get('plan');
const matchingInput = [...planInputs].find((input) => input.dataset.plan === selectedFromUrl);
if (matchingInput) {
  matchingInput.checked = true;
  updatePlan(selectedFromUrl);
}

const subscriptionForm = document.getElementById('subscription-form');
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
  if (!subscriptionForm.reportValidity()) return;

  const formData = new FormData(subscriptionForm);
  const currentSiteUrl = String(formData.get('current_site_url') || '').trim();
  const requestDetails = String(formData.get('website_request') || '').trim();
  const order = {
    form_type: 'Hosting and Maintenance Request',
    website_package: formData.get('website_package'),
    business_name: formData.get('business_name'),
    contact_name: formData.get('contact_name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    business_description: formData.get('business_description'),
    website_needs: formData.getAll('website_needs').join(', ') || 'None selected',
    website_request: `${currentSiteUrl ? `Current website: ${currentSiteUrl}\n\n` : ''}${requestDetails}`,
    monthly_site_care: 'Yes',
    payment_method: formData.get('payment_method'),
    submitted_at: new Date().toISOString(),
    page_url: window.location.href,
    website: formData.get('website'),
  };

  const originalButtonContent = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.textContent = 'Sending…';
  setSubmitStatus('Sending your subscription request…');

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
    submitHeading.textContent = 'Subscription request sent';
    submitCopy.textContent = `Thank you, ${order.contact_name}. Your site care details are now with TWM Tech.`;
    submitButton.textContent = 'Request sent ✓';
    setSubmitStatus(`I’ll review your request and reach out to ${order.email} by email soon.`, 'success');
  } catch (error) {
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonContent;
    setSubmitStatus('The request could not be sent. Check your connection and try again.', 'error');
  }
});

document.getElementById('year').textContent = new Date().getFullYear();
