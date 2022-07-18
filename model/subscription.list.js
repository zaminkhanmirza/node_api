const Sequelize = require('sequelize');
const sequelize = require('../config/seq_database');

// module.exports = (sequelize, DataTypes) => {
    const SubsriptionList = sequelize.define('SubsriptionList', {
        subscription_id: { 
            type: Sequelize.STRING 
        },
        name: { 
            type: Sequelize.STRING 
        },
        price: { 
            type: Sequelize.INTEGER
        },
        validity: {
            type: Sequelize.INTEGER
        },
        validity_unit: {
            type: Sequelize.STRING
        },
        status: {
            type: Sequelize.INTEGER
        },
    }, {
        timestamps: false
    });
// }

module.exports = SubsriptionList;