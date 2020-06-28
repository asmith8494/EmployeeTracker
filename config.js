const env = require("node-env-file");
const fs = require('fs');
const path = require("path");
const envPath = path.join(__dirname, "./.env");

process.env.DB_HOST = "localhost";
process.env.DB_PORT = 3306;
process.env.DB_NAME = "employees_db";
process.env.DB_USER = "root";
process.env.DB_PASSWORD = '';

try {
    
    if (fs.existsSync(envPath)) env(envPath);
    
} catch(err) {

    console.log( "\nMissing .env file. Complete first time setup and then restart." );

}

module.exports = process.env;