const { Sequelize } = require('sequelize');

const PASSWORD_DB = 'Wildcraft8';
const USER_DB = 'admin0804';
const NAME_DB = 'valunique-db';
const sequelize = new Sequelize(NAME_DB, USER_DB, PASSWORD_DB, {
    "host": 'valunique-server.mysql.database.azure.com',
    "port": 3306,
    "dialect": "mysql",
    "ssl": true,
    "dialectOptions": {
       "ssl": {
          "require": true
       }
     }
});

module.exports = sequelize;