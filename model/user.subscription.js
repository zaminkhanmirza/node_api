const Sequelize = require('sequelize');
const sequelize = require('../config/seq_database');

// module.exports = (sequelize, DataTypes) => {
    const UserSubscription = sequelize.define('UserSubscription', {
        sub_id: { 
            type: Sequelize.INTEGER 
        },
        user_id: { 
            type: Sequelize.INTEGER 
        },
        type: { 
            type: Sequelize.INTEGER 
        },
        starts_at: { 
            type: Sequelize.DATE
        },
        expires_at: {
            type: Sequelize.DATE
        },
        user_price: {
            type: Sequelize.INTEGER
        },
        payment_id: {
            type: Sequelize.STRING
        },
        status: {
            type: Sequelize.INTEGER
        }
    }, {
        timestamps: false
    });
// }

module.exports = UserSubscription;