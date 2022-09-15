const sequelize = require('../db/db.init');
const { Sequelize, Model, DataTypes } = require("sequelize");

const Applicant = sequelize.define('Applicant', {
    id:{
        type: DataTypes.INTEGER(8),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    candidateID:{
        type: DataTypes.INTEGER(8),
        allowNull: false,
    },
    jobID:{
        type: DataTypes.STRING(8),
        allowNull: false,
    },
    jobName:{
        type: DataTypes.STRING(50),
    },
    status:{
        type: DataTypes.ENUM,
        values: ['Applying', 'Applied', 'Rejected', 'Shortlisted'],
    },
    whyVolvo:{
        type: DataTypes.STRING,
        allowNull: true,
    },
    aboutVolvo:{
        type: DataTypes.STRING,
        allowNull: true,
    },
    skills:{
        type: DataTypes.STRING,
        allowNull: true,
    },
    additionalSkills:{
        type: DataTypes.STRING,
        allowNull: true,
    },
    location:{
        type: DataTypes.STRING,
    }, 
    relocate: {
        type:DataTypes.STRING,
        allowNull: true,
    },
    appliedOn: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW
    }
},
{
    timestamps: false,
} 
);

module.exports = Applicant;

