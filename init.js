const inquirer = require("inquirer");
const config = require("./config");
const fs = require("fs");

if( !config.DB_PASSWORD ) {

    inquirer.prompt({
        message: "Please enter your password for MySQL",
        type: "input",
        name: "password"
    }).then( ({ password }) => {

        fs.writeFile( "./.env", `DB_PASSWORD="${password}"`, (err) => {
            if( err ) throw err;
            console.log( "Password configuration file created!" );
        });

    });

} else {

    console.log( "Configuration file already created!" );

}