const bcrypt = require("bcryptjs");
const utilities = require("../utilities");
const accountModel = require("../models/account-model");

const accountController = {};

/**
 * Build the login view.
 */
accountController.buildLogin = async function buildLogin(req, res) {
  const nav = await utilities.getNav();
  res.render("account/login", {
    title: "Account Login",
    nav,
    errors: null,
  });
};

/**
 * Build the registration view.
 */
accountController.buildRegister = async function buildRegister(req, res) {
  const nav = await utilities.getNav();
  res.render("account/register", {
    title: "Create Account",
    nav,
    errors: null,
  });
};

/**
 * Placeholder for future login processing.
 */
accountController.processLogin = async function processLogin(req, res) {
  const { account_email, account_password } = req.body;
  const nav = await utilities.getNav();

  try {
    const account = await accountModel.getAccountByEmail(account_email);

    if (!account) {
      return res.status(400).render("account/login", {
        title: "Account Login",
        nav,
        errors: [{ msg: "The email and password combination was not found." }],
        account_email,
      });
    }

    const passwordMatches = await bcrypt.compare(account_password, account.account_password);
    if (!passwordMatches) {
      return res.status(400).render("account/login", {
        title: "Account Login",
        nav,
        errors: [{ msg: "The email and password combination was not found." }],
        account_email,
      });
    }

    const tokenPayload = utilities.buildAuthPayload(account);
    const accessToken = utilities.generateJWT(tokenPayload);
    utilities.attachAuthCookie(res, accessToken);

    req.flash("success", `Welcome back, ${account.account_firstname}!`);
    res.redirect("/account/");
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).render("account/login", {
      title: "Account Login",
      nav,
      errors: [{ msg: "Unexpected error logging in. Please try again." }],
      account_email,
    });
  }
};

/**
 * Placeholder for future registration processing.
 */
accountController.processRegistration = async function processRegistration(req, res) {
  const { account_firstname, account_lastname, account_email, account_password } = req.body;
  const nav = await utilities.getNav();

  try {
    const hashedPassword = await bcrypt.hash(account_password, 10);
    await accountModel.createAccount({
      account_firstname,
      account_lastname,
      account_email,
      account_password: hashedPassword,
    });

    req.flash("success", `Congratulations, ${account_firstname}. Please log in.`);
    res.redirect("/account/login");
  } catch (err) {
    console.error(err);
    let message = "Sorry, we could not register you at this time.";
    if (err.code === "23505") {
      message = "That email address is already registered. Please log in instead.";
    }

    res.status(err.status || 500).render("account/register", {
      title: "Create Account",
      nav,
      errors: [{ msg: message }],
      account_firstname,
      account_lastname,
      account_email,
    });
  }
};

/**
 * Build the account management view
 */
accountController.buildManagement = async function buildManagement(req, res) {
  const nav = await utilities.getNav();
  res.render("account/management", {
    title: "Account Management",
    nav,
    errors: null,
  });
};

/**
 * Build the account update view
 */
accountController.buildUpdateAccount = async function (req, res) {
  const account_id = parseInt(req.params.accountId);
  const nav = await utilities.getNav();
  const accountData = await accountModel.getAccountById(account_id);
  
  res.render("account/update", {
    title: "Update Account",
    nav,
    errors: null,
    account_firstname: accountData.account_firstname,
    account_lastname: accountData.account_lastname,
    account_email: accountData.account_email,
    account_id: accountData.account_id,
  });
};

/**
 * Process account update
 */
accountController.updateAccount = async function (req, res) {
  const { account_firstname, account_lastname, account_email, account_id } = req.body;
  const nav = await utilities.getNav();
  
  const updateResult = await accountModel.updateAccount(
    account_firstname,
    account_lastname,
    account_email,
    account_id
  );

  if (updateResult) {
    // Update session token with new data
    const accountData = await accountModel.getAccountById(account_id);
    const tokenPayload = utilities.buildAuthPayload(accountData);
    const accessToken = utilities.generateJWT(tokenPayload);
    utilities.attachAuthCookie(res, accessToken);

    req.flash("success", `Congratulations, ${account_firstname}, you've successfully updated your account info.`);
    res.redirect("/account/");
  } else {
    req.flash("error", "Sorry, the update failed.");
    res.status(501).render("account/update", {
      title: "Update Account",
      nav,
      errors: null,
      account_firstname,
      account_lastname,
      account_email,
      account_id,
    });
  }
};

/**
 * Process password change
 */
accountController.changePassword = async function (req, res) {
  const { account_password, account_id } = req.body;
  const nav = await utilities.getNav();

  const hashedPassword = await bcrypt.hash(account_password, 10);
  const updateResult = await accountModel.updatePassword(hashedPassword, account_id);

  if (updateResult) {
    req.flash("success", `Congratulations, you've successfully updated your password.`);
    res.redirect("/account/");
  } else {
    req.flash("error", "Sorry, the password update failed.");
    const accountData = await accountModel.getAccountById(account_id);
    res.status(501).render("account/update", {
      title: "Update Account",
      nav,
      errors: null,
      account_firstname: accountData.account_firstname,
      account_lastname: accountData.account_lastname,
      account_email: accountData.account_email,
      account_id: accountData.account_id,
    });
  }
};

accountController.logout = function logout(req, res) {
  utilities.clearAuthCookie(res);
  req.flash("notice", "You have been logged out.");
  res.redirect("/");
};

module.exports = accountController;


