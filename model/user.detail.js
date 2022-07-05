const Sequelize = require('sequelize');
const sequelize = require('../config/seq_database');

// module.exports = (sequelize, DataTypes) => {
    const Details = sequelize.define('detail', {
        address: { 
            type: Sequelize.STRING 
        },
    }, {
        timestamps: false
    });
// }

module.exports = Details;