/**
 * TWM Tech website order receiver for Google Apps Script.
 *
 * Recommended setup:
 * 1. Open the Google Spreadsheet that should receive orders.
 * 2. Choose Extensions > Apps Script.
 * 3. Replace the editor contents with this file.
 * 4. Run setupOrderSheet once and approve the requested permissions.
 * 5. Choose Deploy > New deployment > Web app.
 * 6. Execute as: Me. Who has access: Anyone.
 * 7. Copy the deployed /exec URL into GOOGLE_APPS_SCRIPT_URL in order.js.
 *
 * If this is a standalone script rather than one opened from the spreadsheet,
 * paste the spreadsheet ID into CONFIG.SPREADSHEET_ID below.
 */

const CONFIG = Object.freeze({
  SPREADSHEET_ID: '',
  SHEET_NAME: 'Orders',
});

const HEADERS = Object.freeze([
  'Order ID',
  'Received At',
  'Website Package',
  'Business Name',
  'Contact Name',
  'Email',
  'Phone',
  'Business Description',
  'Website Needs',
  'Website Request',
  'Monthly Site Care',
  'Payment Preference',
  'Customer Submitted At',
  'Source Page',
]);

const ALLOWED_PACKAGES = Object.freeze(['Simple Website', 'Advanced Website']);
const ALLOWED_PAYMENT_METHODS = Object.freeze(['Credit card', 'Cash', 'Cash App', 'PayPal']);
const INFORMATIONAL_NEEDS = Object.freeze([
  'Show services and pricing',
  'Display contact information',
]);
const ADVANCED_NEEDS = Object.freeze([
  'Accept job applications',
  'Schedule appointments',
  'Store customer or business data',
  'Provide an admin panel',
]);

/**
 * Creates and formats the Orders sheet. Run this once before deployment.
 */
function setupOrderSheet() {
  const sheet = getOrCreateOrderSheet_();
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setBackground('#0b1f3a')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  sheet.autoResizeColumns(1, HEADERS.length);
  sheet.setColumnWidth(8, 280);
  sheet.setColumnWidth(9, 230);
  sheet.setColumnWidth(10, 340);
  Logger.log('Order sheet ready: ' + sheet.getParent().getUrl());
}

/**
 * Health-check response for opening the deployed web-app URL in a browser.
 */
function doGet() {
  return jsonResponse_({
    ok: true,
    service: 'TWM Tech order receiver',
  });
}

/**
 * Receives a website order and appends it to the configured spreadsheet.
 */
function doPost(e) {
  try {
    const order = parseOrder_(e);

    // Basic bot trap. Real customers never see or fill this field.
    if (order.website) {
      return jsonResponse_({ ok: true });
    }

    const validatedOrder = validateOrder_(order);
    const lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      const sheet = getOrCreateOrderSheet_();
      const orderId = Utilities.getUuid();
      const receivedAt = new Date();

      sheet.appendRow([
        protectCell_(orderId),
        receivedAt,
        protectCell_(validatedOrder.website_package),
        protectCell_(validatedOrder.business_name),
        protectCell_(validatedOrder.contact_name),
        protectCell_(validatedOrder.email),
        protectCell_(validatedOrder.phone),
        protectCell_(validatedOrder.business_description),
        protectCell_(validatedOrder.website_needs.join(', ')),
        protectCell_(validatedOrder.website_request),
        validatedOrder.monthly_site_care ? 'Yes' : 'No',
        protectCell_(validatedOrder.payment_method),
        protectCell_(validatedOrder.submitted_at),
        protectCell_(validatedOrder.page_url),
      ]);

      return jsonResponse_({ ok: true, orderId: orderId });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    console.error(error);
    return jsonResponse_({ ok: false, error: String(error.message || error) });
  }
}

function parseOrder_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('The request body is empty.');
  }

  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    throw new Error('The request body is not valid JSON.');
  }
}

function validateOrder_(order) {
  const cleaned = {
    website_package: cleanText_(order.website_package, 100),
    business_name: cleanText_(order.business_name, 200),
    contact_name: cleanText_(order.contact_name, 200),
    email: cleanText_(order.email, 320),
    phone: cleanText_(order.phone, 80),
    business_description: cleanText_(order.business_description, 5000),
    website_needs: Array.isArray(order.website_needs) ? order.website_needs : [],
    website_request: cleanText_(order.website_request, 10000),
    monthly_site_care: order.monthly_site_care === true,
    payment_method: cleanText_(order.payment_method, 100),
    submitted_at: cleanText_(order.submitted_at, 100),
    page_url: cleanText_(order.page_url, 1000),
  };

  requireValue_(cleaned.website_package, 'Website package');
  requireValue_(cleaned.business_name, 'Business name');
  requireValue_(cleaned.contact_name, 'Contact name');
  requireValue_(cleaned.email, 'Email');
  requireValue_(cleaned.business_description, 'Business description');
  requireValue_(cleaned.website_request, 'Website request');
  requireValue_(cleaned.payment_method, 'Payment preference');

  if (ALLOWED_PACKAGES.indexOf(cleaned.website_package) === -1) {
    throw new Error('Invalid website package.');
  }

  if (ALLOWED_PAYMENT_METHODS.indexOf(cleaned.payment_method) === -1) {
    throw new Error('Invalid payment preference.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned.email)) {
    throw new Error('Invalid email address.');
  }

  const allowedNeeds = cleaned.website_package === 'Advanced Website'
    ? INFORMATIONAL_NEEDS.concat(ADVANCED_NEEDS)
    : INFORMATIONAL_NEEDS;

  cleaned.website_needs = cleaned.website_needs
    .map(function (need) { return cleanText_(need, 150); })
    .filter(function (need, index, values) {
      return allowedNeeds.indexOf(need) !== -1 && values.indexOf(need) === index;
    });

  return cleaned;
}

function getOrCreateOrderSheet_() {
  const spreadsheet = getSpreadsheet_();
  let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setBackground('#0b1f3a')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
  }

  return sheet;
}

function getSpreadsheet_() {
  if (CONFIG.SPREADSHEET_ID) {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('No spreadsheet is connected. Set CONFIG.SPREADSHEET_ID.');
  }
  return spreadsheet;
}

function cleanText_(value, maxLength) {
  if (value === null || value === undefined) return '';
  return String(value).trim().slice(0, maxLength);
}

function requireValue_(value, label) {
  if (!value) throw new Error(label + ' is required.');
}

// Prevent customer-entered text from being interpreted as a Sheet formula.
function protectCell_(value) {
  const text = String(value === null || value === undefined ? '' : value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function jsonResponse_(body) {
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
