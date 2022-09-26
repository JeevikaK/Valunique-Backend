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

options = {
   config: {
      host: 'valunique-server.mysql.database.azure.com',
      port: 3306,
      ssl: true,
      user: USER_DB, 
      password: PASSWORD_DB,
      database: NAME_DB 
   }
}

module.exports = {sequelize, options};