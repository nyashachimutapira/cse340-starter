const jwt = require("jsonwebtoken");
const invModel = require("../models/inventory-model");

const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET || "cse340_jwt_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
const JWT_COOKIE_NAME = process.env.JWT_COOKIE_NAME || "jwt";
const JWT_COOKIE_MAX_AGE = Number(process.env.JWT_COOKIE_MAX_AGE_MS) || 1000 * 60 * 60; // 1 hour

const utilities = {};

/**
 * Build the primary navigation element based on the available classifications.
 * @param {number|string|null} activeClassificationId
 * @returns {Promise<string>}
 */
utilities.getNav = async function getNav(activeClassificationId = null) {
  const classifications = await invModel.getClassifications();
  let nav = '<ul id="primary-nav">';
  nav += `<li><a href="/" title="Home page"${activeClassificationId === "home" ? ' class="active"' : ""}>Home</a></li>`;

  classifications
    .filter((classification) => classification.classification_name !== "Classic")
    .forEach((classification) => {
      const isActive =
        Number(activeClassificationId) === classification.classification_id;
      nav += `<li><a href="/inv/type/${classification.classification_id}" title="View our ${classification.classification_name} inventory"${
        isActive ? ' class="active"' : ""
      }>${classification.classification_name}</a></li>`;
    });

  nav += "</ul>";
  return nav;
};

/**
 * Build the classification select list for forms.
 * @param {number|null} selectedId
 * @returns {Promise<string>}
 */
utilities.buildClassificationList = async function buildClassificationList(selectedId = null) {
  const classifications = await invModel.getClassifications();
  let classificationList =
    '<select name="classification_id" id="classificationList" required>';
  classificationList += "<option value=''>Choose a Classification</option>";

  classifications.forEach((classification) => {
    classificationList += `<option value="${classification.classification_id}"${
      Number(selectedId) === classification.classification_id ? " selected" : ""
    }>${classification.classification_name}</option>`;
  });

  classificationList += "</select>";
  return classificationList;
};

/**
 * Build the HTML grid for a set of vehicles grouped by classification.
 * @param {Array<object>} data
 * @returns {string}
 */
utilities.buildClassificationGrid = function buildClassificationGrid(data = []) {
  if (!Array.isArray(data) || !data.length) {
    return '<p class="notice" role="status">Sorry, no matching inventory could be found.</p>';
  }

  const gridItems = data
    .map((vehicle) => {
      const title = `${vehicle.inv_year} ${vehicle.inv_make} ${vehicle.inv_model}`;
      const price = utilities.formatCurrency(vehicle.inv_price);
      return `<li class="inv-card">
        <a href="/inv/detail/${vehicle.inv_id}" aria-label="View details for the ${title}">
          <figure>
            <img src="${vehicle.inv_thumbnail}" alt="Thumbnail of ${title}">
            <figcaption>
              <p class="vehicle-title">${title}</p>
              <p class="vehicle-price">${price}</p>
            </figcaption>
          </figure>
        </a>
      </li>`;
    })
    .join("");

  return `<ul class="inv-grid">${gridItems}</ul>`;
};

/**
 * Build the HTML for an individual vehicle detail view.
 * @param {object} vehicle
 * @returns {string}
 */
utilities.buildVehicleDetail = function buildVehicleDetail(vehicle) {
  if (!vehicle) {
    return "";
  }

  const title = `${vehicle.inv_year} ${vehicle.inv_make} ${vehicle.inv_model}`;
  const price = utilities.formatCurrency(vehicle.inv_price);
  const miles = utilities.formatNumber(vehicle.inv_miles);

  return `
    <section class="vehicle-detail">
      <div class="vehicle-media">
        <img src="${vehicle.inv_image}" alt="Image of ${title}">
      </div>
      <div class="vehicle-content">
        <p class="vehicle-price">${price}</p>
        <p><strong>Year:</strong> ${vehicle.inv_year}</p>
        <p><strong>Make:</strong> ${vehicle.inv_make}</p>
        <p><strong>Model:</strong> ${vehicle.inv_model}</p>
        <p><strong>Mileage:</strong> ${miles} miles</p>
        <p><strong>Color:</strong> ${vehicle.inv_color}</p>
        <p class="vehicle-description">${vehicle.inv_description}</p>
      </div>
    </section>
  `;
};

/**
 * Format a numeric value as U.S. currency.
 * @param {number} value
 * @returns {string}
 */
utilities.formatCurrency = function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format a numeric value with commas.
 * @param {number} value
 * @returns {string}
 */
utilities.formatNumber = function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
};

/**
 * Wrap controller logic with a common error handler.
 * @param {Function} callback
 * @returns {Function}
 */
utilities.handleErrors = function handleErrors(callback) {
  return function wrappedController(req, res, next) {
    Promise.resolve(callback(req, res, next)).catch(next);
  };
};

utilities.buildAuthPayload = function buildAuthPayload(account) {
  if (!account) return null;
  return {
    account_id: account.account_id,
    account_firstname: account.account_firstname,
    account_lastname: account.account_lastname,
    account_email: account.account_email,
    account_type: account.account_type,
  };
};

utilities.generateJWT = function generateJWT(payload, options = {}) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: options.expiresIn || JWT_EXPIRES_IN,
  });
};

utilities.attachAuthCookie = function attachAuthCookie(res, token) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: JWT_COOKIE_MAX_AGE,
  };

  if (process.env.JWT_COOKIE_DOMAIN) {
    cookieOptions.domain = process.env.JWT_COOKIE_DOMAIN;
  }

  res.cookie(JWT_COOKIE_NAME, token, cookieOptions);
};

utilities.clearAuthCookie = function clearAuthCookie(res) {
  res.clearCookie(JWT_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
};

utilities.checkJWTToken = function checkJWTToken(req, res, next) {
  const token = req.cookies?.[JWT_COOKIE_NAME];

  if (!token) {
    res.locals.account = null;
    res.locals.loggedIn = false;
    return next();
  }

  try {
    const accountData = jwt.verify(token, JWT_SECRET);
    req.account = accountData;
    res.locals.account = accountData;
    res.locals.loggedIn = true;
  } catch (error) {
    console.error("Invalid JWT detected:", error.message);
    utilities.clearAuthCookie(res);
    res.locals.account = null;
    res.locals.loggedIn = false;
  }

  next();
};

utilities.requireAuth = function requireAuth(req, res, next) {
  if (!req.account) {
    req.flash("notice", "Please log in to continue.");
    return res.redirect("/account/login");
  }

  next();
};

utilities.checkAccountType = function (req, res, next) {
  if (req.account) {
    if (req.account.account_type === "Employee" || req.account.account_type === "Admin") {
      return next();
    }
  }
  req.flash("notice", "You are not authorized to access this resource.");
  return res.redirect("/account/login");
};

module.exports = utilities;

