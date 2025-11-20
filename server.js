/* ******************************************
 * This server.js file is the primary file of the 
 * application. It is used to control the project.
 *******************************************/

/* ***********************
 * Require Statements
 *************************/
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const flash = require("connect-flash");
require("dotenv").config(); // no need to assign to a variable
const app = express();
const staticRoutes = require("./routes/static");
const inventoryRoute = require("./routes/inventoryRoute");
const accountRoute = require("./routes/accountRoute");
const errorRoute = require("./routes/errorRoute");
const utilities = require("./utilities");
const pool = require("./database/");

/* ***********************
 * View Engine and Templates
 *************************/
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "./layouts/layout"); // not at views root

/* ***********************
 * Middleware
 *************************/
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(staticRoutes);
app.use(
  session({
    store: new (require("connect-pg-simple")(session))({
      createTableIfMissing: true,
      pool,
    }),
    secret: process.env.SESSION_SECRET || "cse340_session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
    name: "sessionId",
  })
);
app.use(flash());

app.use(async (req, res, next) => {
  try {
    res.locals.nav = await utilities.getNav();
    res.locals.notice = req.flash("notice");
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
  } catch (err) {
    next(err);
  }
});

/* ***********************
 * Routes
 *************************/
app.use("/inv", inventoryRoute);
app.use("/account", accountRoute);
app.use("/error", errorRoute);

// Index route
app.get(
  "/",
  utilities.handleErrors(async function buildHomeView(req, res) {
    const nav = await utilities.getNav("home");
    res.render("index", { title: "Home", nav });
  })
);

/* ***********************
 * Error Handling
 *************************/
app.use((req, res, next) => {
  const error = new Error("Sorry, the page you requested was not found.");
  error.status = 404;
  next(error);
});

app.use(async (err, req, res, next) => {
  try {
    console.error(err);
    const status = err.status || 500;
    const nav = await utilities.getNav();
    res.status(status).render("error", {
      title: `${status} Error`,
      nav,
      statusCode: status,
      message: err.message || "An unexpected error occurred.",
    });
  } catch (error) {
    next(error);
  }
});

/* ***********************
 * Local Server Information
 * Values from .env (environment) file or default
 *************************/
const PORT = process.env.PORT || 5500;
const HOST = process.env.HOST || "localhost";

/* ***********************
 * Start the server
 *************************/
app.listen(PORT, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
