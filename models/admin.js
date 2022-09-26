const {sequelize} = require('../db/db.init');
const { Sequelize, Model, DataTypes } = require("sequelize");

const Admin = sequelize.define('Admin', {
    adminID:{
        type: DataTypes.INTEGER(8),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    access: {
        type: DataTypes.ENUM,
        values: ['HR', 'Hiring Manager', 'Recruiter'],
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    }
},
{
    timestamps: false,
} 
)

module.exports = Admin;