const sequelize = require('../db/db.init');
const { Sequelize, Model, DataTypes } = require("sequelize");

const ValidCandidateID = sequelize.define('ValidCandidateID', {
    candidateID:{
        type: DataTypes.INTEGER(8),
        allowNull: false,
        primaryKey: true
    }
},
{
    timestamps: false,
} 
);

module.exports = ValidCandidateID;

