const sequelize = require('../db/db.init');

const RecruiterJobOpening = sequelize.define('RecruiterJobOpening', {},
{
    timestamps: false,
}
);

module.exports = RecruiterJobOpening;