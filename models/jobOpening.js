const {sequelize} = require('../db/db.init');
const { Sequelize, Model, DataTypes } = require("sequelize");

const JobOpening = sequelize.define('JobOpening', {
    jobID:{
        type: DataTypes.STRING(8),
        allowNull: false,
        primaryKey: true 
    },
    jobName:{
        type: DataTypes.STRING(50),
        allowNull: false,  
    },
    questions:{
        type: DataTypes.TEXT,
        allowNull: false,
    },
    skills:{
        type: DataTypes.TEXT,
        allowNull: false,
    },
    openedOn: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW
    }
},
{
    timestamps: false,
});


module.exports = JobOpening;