const Sequelize = require('sequelize');
const sequelize = require('../config/seq_database');

// module.exports = (sequelize, DataTypes) => {
    const Registrations = sequelize.define('registration', {
        role_id: { 
            type: Sequelize.INTEGER 
        },
        firstName: { 
            type: Sequelize.STRING 
        },
        lastName: { 
            type: Sequelize.STRING
        },
        gender: {
            type: Sequelize.STRING
        },
        email: {
            type: Sequelize.STRING
        },
        password: {
            type: Sequelize.STRING
        },
        reset_password_token: {
            type: Sequelize.STRING
        },
        number: {
            type: Sequelize.STRING
        }
    }, {
        timestamps: false
    });
// }

module.exports = Registrations;