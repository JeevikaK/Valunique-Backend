const sequelize = require('../db/db.init');
const { Sequelize, Model, DataTypes } = require("sequelize");

const Candidate_ID_Verify = sequelize.define('Candidate_ID_Verify', {
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

module.exports = Candidate_ID_Verify;

