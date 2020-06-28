// Doing everything in one file to see if I can actually do this assignment

const mysql = require("mysql");
const config = require("./config");
const inquirer = require("inquirer");
const cTable = require("console.table");

if(!config.DB_PASSWORD)
    throw new Error(`Missing database password. Please run 'node init'`);

const connection = mysql.createConnection({
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME
});

connection.connect((err) => {
    if(err) throw err;
    run();
});

function run() {
    inquirer.prompt([
        {
            message: "What would you like to do?",
            type: "list",
            name: "action",
            choices: ['View all employees', 'View roles', 'View departments', 'Add employee', 'Add role', 'Add department', 'Update employee role', 'exit']
        }

    ]).then((response) => {
        if(response.action === 'View all employees') {
            viewEmployees();
        }
        else if (response.action === 'View roles') {
            viewRoles();
        }
        else if (response.action === 'View departments') {
            viewDepartments();
        }
        else if (response.action === 'Add employee') {
            addEmployee();
        }
        else if (response.action === 'Add role') {
            addRole();
        }
        else if (response.action === 'Add department') {
            addDepartment();
        }
        else if (response.action === 'Update employee role') {
            updateEmployeeRole();
        }
        else {
            connection.end();
            return;
        }
    });
}

function addDepartment() {
    inquirer.prompt([
        {
            message: "What is the department's name?",
            type: "input",
            name: "departmentName"
        }
    ]).then((response) => {
        connection.query("INSERT INTO departments (name) VALUES (?)", response.departmentName, (err, result) => {
            console.log("Success!");
            run();
        });
    });
}

function addRole() {
    connection.query("SELECT * FROM departments", (err, results) => {
        if(err) throw err;

        inquirer.prompt([
            {
                message: "What is the title?",
                type: "input",
                name: "title"
            },
            {
                message: "What is the salary?",
                type: "input",
                name: "salary",
                validate: (value) => {
                    return !isNaN(value) ? true : "Please provide a number value.";
                }
            },
            {
                message: "Which department does this role belong to?",
                type: "list",
                name: "department_id",
                choices: results.map(department => {
                    return {
                        name: department.name,
                        value: department.id
                    }
                })
            }
        ]).then((response) => {
            connection.query("INSERT INTO roles (title, salary, department_id) VALUES (?, ?, ?)", [response.title, response.salary, response.department_id], (err, result) => {
                console.log("Success!");
                run();
            });
        });
    });
}

function addEmployee() {
    connection.query("SELECT * FROM roles", (err, roles) => {
        if(err) throw err;

        connection.query("SELECT * FROM employees", (err, employees) => {
            if(err) throw err;

            const managers = employees.filter(employee => {
                let roleId;

                        roles.forEach(role => {
                            if(role.title.toLowerCase() === "manager")
                                roleId = role.id;
                        });

                        //console.log("Role ID: " + roleId);

                        if(employee.role_id === roleId) {
                            return employee;
                        }
            });

            managers.push({id: null, first_name: "null", last_name: "null", manager_id: null});

            inquirer.prompt([
                {
                    message: "What is the employee's first name?",
                    type: "input",
                    name: "first_name"
                },
                {
                    message: "What is the employee's last name?",
                    type: "input",
                    name: "last_name"
                },
                {
                    message: "What is the employee's role?",
                    type: "list",
                    name: "role_id",
                    choices: roles.map(role => {
                        return {
                            name: role.title,
                            value: role.id
                        }
                    })
                },
                {
                    message: "Who is the employee's manager?",
                    type: "list",
                    name: "manager_id",
                    choices: managers.map(manager => {
                        return {
                            name: manager.first_name + " " + manager.last_name,
                            value: manager.id
                        }
                    })
                }
            ]).then((response) => {
                connection.query("INSERT INTO employees SET ?", response, (err, result) => {
                    console.log("Success!");
                    run();
                });
            })
        });
        
    });
}

function viewDepartments() {
    connection.query(
        "SELECT * FROM departments", (err, results) => {
            if(err) throw err;

            const table = cTable.getTable("Departments", results);

            console.log(table);
            run();
        }
    );
}

function viewRoles() {
    connection.query(
        "SELECT * FROM roles", (err, results) => {
            if(err) throw err;

            const table = cTable.getTable("Roles", results);

            console.log(table);
            run();
        }
    );
}

function viewEmployees() { // id fn ln title dept sal manager
    connection.query(
        "SELECT * FROM departments", (err, departments) => {
            if(err) throw err;

            connection.query(
                "SELECT * FROM roles", (err, roles) => {
                    if(err) throw err;

                    connection.query(
                        "SELECT * FROM employees", (err, employees) => {

                            const table = cTable.getTable("Employees", employees.map(employee => {

                                const role = roles.filter(role => {
                                    if(employee.role_id === role.id)
                                        return role;
                                });

                                const dept = departments.filter(department => {
                                    if(department.id === role[0].department_id)
                                        return department;
                                });

                                const manager = employees.filter(emp => {
                                    if(employee.manager_id === emp.id){
                                        return emp;
                                    }
                                });

                                let managerName = "";

                                if(manager[0])
                                {
                                    managerName = `${manager[0].first_name} ${manager[0].last_name}`;
                                }
                                else {
                                    managerName = "null";
                                }


                                return {
                                    id: employee.id,
                                    first_name: employee.first_name,
                                    last_name: employee.last_name,
                                    title: role[0].title,
                                    department: dept[0].name,
                                    salary: role[0].salary,
                                    manager: managerName
                                }
                            }));

                            console.log(table);
                            run();
                        }
                    );
                }
            );
        }
    );
};

function updateEmployeeRole() {
    connection.query("SELECT * FROM employees", (err, employees) => {
        if(err) throw err;

        connection.query("SELECT * FROM roles", (err, roles) => {
            if(err) throw err;

            inquirer.prompt([
                {
                    message: "Which employee's role would you like to update?",
                    type: "list",
                    name: "employee_id",
                    choices: employees.map(employee => {
                        return {
                            name: `${employee.first_name} ${employee.last_name}`,
                            value: employee.id
                        }
                    })
                },
                {
                    message: "Which role would you like to move them into?",
                    type: "list",
                    name: "role_id",
                    choices: roles.map(role => {
                        return {
                            name: role.title,
                            value: role.id
                        }
                    })
                }
            ]).then((response) => {
                connection.query("UPDATE employees SET ? WHERE ?", 
                [
                    {
                        role_id: response.role_id
                    },
                    {
                        id: response.employee_id
                    }
                ],
                 (err, result) => {
                    console.log("Success!");
                    run();
                });
            });
        })
    })
}
