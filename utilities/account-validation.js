const utilities = require(".");
const { body, validationResult } = require("express-validator");
const accountModel = require("../models/account-model");

const validate = {};

/* **********************************
 *  Registration Data Validation Rules
 * ********************************* */
validate.registrationRules = () => {
  return [
    body("account_firstname")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 1 })
      .withMessage("Please provide a first name."),

    body("account_lastname")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 2 })
      .withMessage("Please provide a last name."),

    body("account_email")
      .trim()
      .escape()
      .notEmpty()
      .isEmail()
      .normalizeEmail()
      .withMessage("A valid email is required."),

    body("account_password")
      .trim()
      .notEmpty()
      .isStrongPassword({
        minLength: 12,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
      .withMessage("Password does not meet requirements."),
  ];
};

/* ******************************
 * Check data and return errors or continue to registration
 * ***************************** */
validate.checkRegData = async (req, res, next) => {
  const { account_firstname, account_lastname, account_email } = req.body;
  let errors = validationResult(req);

  if (!errors.isEmpty()) {
    const nav = await utilities.getNav();
    const errorMessages = errors.array();
    return res.render("account/register", {
      title: "Create Account",
      nav,
      errors: errorMessages,
      account_firstname,
      account_lastname,
      account_email,
    });
  }

  next();
};

validate.loginRules = () => {
  return [
    body("account_email")
      .trim()
      .notEmpty()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email address."),
    body("account_password").trim().notEmpty().withMessage("Please provide your password."),
  ];
};

validate.checkLoginData = async (req, res, next) => {
  const { account_email } = req.body;
  let errors = validationResult(req);

  if (!errors.isEmpty()) {
    const nav = await utilities.getNav();
    const errorMessages = errors.array();
    return res.render("account/login", {
      title: "Account Login",
      nav,
      errors: errorMessages,
      account_email,
    });
  }

  next();
};

validate.updateAccountRules = () => {
  return [
    body("account_firstname")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 1 })
      .withMessage("Please provide a first name."),

    body("account_lastname")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 2 })
      .withMessage("Please provide a last name."),

    body("account_email")
      .trim()
      .escape()
      .notEmpty()
      .isEmail()
      .normalizeEmail()
      .withMessage("A valid email is required.")
      .custom(async (account_email, { req }) => {
        const account = await accountModel.getAccountByEmail(account_email);
        if (account && account.account_id != req.body.account_id) {
          throw new Error("Email exists. Please use a different email");
        }
      }),
  ];
};

validate.checkUpdateData = async (req, res, next) => {
  const { account_firstname, account_lastname, account_email, account_id } = req.body;
  let errors = validationResult(req);

  if (!errors.isEmpty()) {
    const nav = await utilities.getNav();
    const errorMessages = errors.array();
    return res.render("account/update", {
      title: "Update Account",
      nav,
      errors: errorMessages,
      account_firstname,
      account_lastname,
      account_email,
      account_id,
    });
  }

  next();
};

validate.changePasswordRules = () => {
  return [
    body("account_password")
      .trim()
      .notEmpty()
      .isStrongPassword({
        minLength: 12,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
      .withMessage("Password does not meet requirements."),
  ];
};

validate.checkPasswordData = async (req, res, next) => {
  const { account_id } = req.body;
  let errors = validationResult(req);

  if (!errors.isEmpty()) {
    const nav = await utilities.getNav();
    const errorMessages = errors.array();
    // We need to fetch account data to re-render the update view correctly
    const account = await accountModel.getAccountById(account_id);
    return res.render("account/update", {
      title: "Update Account",
      nav,
      errors: errorMessages,
      account_firstname: account.account_firstname,
      account_lastname: account.account_lastname,
      account_email: account.account_email,
      account_id,
    });
  }

  next();
};

module.exports = validate;


