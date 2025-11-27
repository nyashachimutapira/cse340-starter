const pool = require("../database/");

async function createAccount({ account_firstname, account_lastname, account_email, account_password }) {
  const sql = `
    INSERT INTO public.account (account_firstname, account_lastname, account_email, account_password)
    VALUES ($1, $2, $3, $4)
    RETURNING account_id, account_firstname, account_lastname, account_email, account_type
  `;
  const values = [account_firstname, account_lastname, account_email, account_password];
  const result = await pool.query(sql, values);
  return result.rows[0];
}

async function getAccountByEmail(account_email) {
  const sql = `
    SELECT account_id, account_firstname, account_lastname, account_email, account_type, account_password
    FROM public.account
    WHERE account_email = $1
  `;
  const result = await pool.query(sql, [account_email]);
  return result.rows[0];
}

async function getAccountById(account_id) {
  const sql = `
    SELECT account_id, account_firstname, account_lastname, account_email, account_type
    FROM public.account
    WHERE account_id = $1
  `;
  const result = await pool.query(sql, [Number(account_id)]);
  return result.rows[0];
}

async function updateAccount(account_firstname, account_lastname, account_email, account_id) {
  try {
    const sql = "UPDATE public.account SET account_firstname = $1, account_lastname = $2, account_email = $3 WHERE account_id = $4 RETURNING *";
    const data = await pool.query(sql, [
      account_firstname,
      account_lastname,
      account_email,
      account_id,
    ]);
    return data.rows[0];
  } catch (error) {
    console.error("model error: " + error);
  }
}

async function updatePassword(account_password, account_id) {
  try {
    const sql = "UPDATE public.account SET account_password = $1 WHERE account_id = $2 RETURNING *";
    const data = await pool.query(sql, [account_password, account_id]);
    return data.rows[0];
  } catch (error) {
    console.error("model error: " + error);
  }
}

module.exports = {
  createAccount,
  getAccountByEmail,
  getAccountById,
  updateAccount,
  updatePassword,
};


