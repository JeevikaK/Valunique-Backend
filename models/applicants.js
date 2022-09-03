const sequelize = require('../db/db.init');
const { Sequelize, Model, DataTypes } = require("sequelize");

const Applicant = sequelize.define('Applicant', {
    candidateID:{
        type: DataTypes.INTEGER(8),
        allowNull: false,
        primaryKey: true
    },
    jobID:{
        type: DataTypes.STRING(8),
        allowNull: false,
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