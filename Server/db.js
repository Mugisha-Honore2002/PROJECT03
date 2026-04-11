const { Pool } = require('pg');
require("dotenv").config();
 
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.HOST,
    port: process.env.PORT,
    database: process.env.DB_NAME 
});

pool.connect()
  .then(() => console.log("DB Connected ✅ ✅"))
  .catch(err => console.error("DB Error 🧨❌", err));


module.exports = pool;