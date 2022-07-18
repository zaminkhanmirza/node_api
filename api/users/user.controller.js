require('dotenv').config();
const sequelize = require('../../config/seq_database');
const Registration = require('../../model/users');
const Details = require('../../model/user.detail');
const SubsriptionList = require('../../model/subscription.list');
const UserSubscription = require('../../model/user.subscription');
const nodemailer = require('nodemailer');
const { genSaltSync, hashSync, compareSync } = require('bcrypt');
const { sign, verify, destroy } = require('jsonwebtoken');
const jwt_decode = require('jwt-decode');
const { Op } = require("sequelize");
const date = require('date-and-time')

Registration.hasMany(Details);
Details.belongsTo(Registration);

// SubsriptionList.hasMany(UserSubscription, { as: "usersubscriptions" });
// UserSubscription.belongsTo(SubsriptionList, {
//   foreignKey: "sub_id",
//   as: "sub_id",
// });

sequelize.sync().then((result) => {
}).catch((err) => {
    console.log(err);
});

module.exports = {
    createUser: (req, res) => {
        const body = req.body;
        const salt = genSaltSync(10);
        body.password = hashSync(body.password, salt);
        Registration.create({
            firstName: body.first_name,
            role_id: 2,
            lastName: body.last_name,
            gender: body.gender,
            email: body.email,
            password: body.password,
            number: body.number
        }).then(customer => {
            return customer.createDetail({address: body.address});
        }).then(details => {
            console.log('User location is ',details);
            return res.json({
                success: 1,
                message: 'User added successfully'
            });
        }).catch(error => {
            return res.json({
                success: 0,
                message: 'User not created!'
            });
        });
    },
    getUsers: (req, res) => {
        Registration.findAll({
            where: {
                role_id: {
                    [Op.ne]: 1
                }
            },
            attributes: {
                exclude: ['reset_password_token', 'password', 'role_id']
            }
        }).then(allUsers => {
            console.log(allUsers);
            if (allUsers.length === 0) {
                return res.json({
                    success: 0,
                    message: 'Record not found!'
                });
            } else {
                return res.json({
                    success: 1,
                    message: allUsers
                });
            }
        }).catch(error => {
            return res.json({
                success: 0,
                message: error
            });
        });
    },
    getUserByUserId: (req, res) => {
        const regId = req.params.id;
        Registration.findAll({
            where: {
                role_id: {
                    [Op.ne]: 1
                },
                id: regId
            },
            attributes: {
                exclude: ['reset_password_token', 'password', 'role_id']
            }
        }).then(data =>{
            if(data.length > 0){
                return res.json({
                    success: 1,
                    message: data
                });
            }else{
                return res.json({
                    success: 0,
                    message: 'Record not found!'
                });
            }
        });
    },
    updateUser: (req, res) => {
        const regId = req.params.id;
        const body = req.body;
        const salt = genSaltSync(10);
        body.password = hashSync(body.password, salt);
        Registration.findOne({
            where: {
                role_id: 2,
                id: regId
            }
        })
        .then(record => {
            if (!record) {
                return res.json({
                    success: 0,
                    message: 'Record not found!'
                });
            }
            let values = {
                registered : true,
                firstName: body.first_name,
                lastName: body.last_name,
                gender: body.gender,
                email: body.email,
                password: body.password,
                number: body.number
            }
            record.update(values).then( updatedRecord => {
                return res.json({
                    success: 1,
                    message: 'User updated successfully'
                });
            })
        })
        .catch((error) => {
            return res.json({
                success: 0,
                message: 'User not updated!'
            });
        })
    },
    deleteUser: (req, res) => {
        const regId = req.params.id;
        Registration.destroy({ where: {id: regId} }).then(rowDeleted =>{          
            if(rowDeleted === 1){
                return res.json({
                    success: 1,
                    message: 'User deleted successfully'
                });
            }else{
                return res.json({
                    success: 0,
                    message: 'Record not found!'
                });
            }
        });
    },
    login: (req, res) => {
        const body = req.body;
        if (!body.email && !body.password) {
            return res.json({
                success: 0,
                message: 'Please fill all fields...!'
            });
        }
        if (!body.email) {
            return res.json({
                success: 0,
                message: 'Please fill email'
            });
        }
        if (!body.password) {
            return res.json({
                success: 0,
                message: 'Please fill password'
            });
        }
        Registration.findOne({where: {email: body.email}}).then(results => {
            if (!results) {
                return res.json({
                    success: 0,
                    message: 'Invalid Email'
                });
            }
            const result = compareSync(body.password, results.password);
            if (result) {
                results.password = undefined;
                const access_token = sign({
                    email: body.email
                }, process.env.JWT_KEY, {
                    expiresIn: '1h',
                });
                const refresh_token = sign({
                    email: body.email
                }, process.env.JWT_LOGIN_KEY, {
                    expiresIn: '24h',
                });
                return res.json({
                    success: 1, 
                    message: 'login successfully',
                    access_token: access_token,
                    refresh_token: refresh_token
                });
            } else {
                return res.json({
                    success: 0,
                    data: 'Wrong Password!'
                });
            }
        });
    },
    logout: (req, res) => {
        let token = req.get("authorization");
        token = token.slice(7);
        // const body = req.body;
        if (!token) {
            return res.json({
                success: 0,
                data: 'Token required!'
            });
        } else {
            console.log(token);
            destroy(token);
            return res.json({
                success: 1,
                data: 'User Logout Successfully!'
            });
        }
    },
    forgetPassword: (req, res) => {
        const body = req.body;
        const baseUrl = process.env.BASEURL + process.env.APP_PORT + req.baseUrl;
        Registration.findOne({where: {email: body.email}}).then(results => {
            if (!results) {
                return res.json({
                    success: 0,
                    message: 'Invalid email'
                });
            }
            const token = sign({
                id: results.dataValues.id,
            }, process.env.JWT_RESET_KEY, {
                expiresIn: '1h',
            });
            let values = {
                registered : true,
                reset_password_token: token,
            }
            results.update(values).then(updatedPassword => {
                if (!updatedPassword) {
                    return res.json({
                        success: 0,
                        message: 'Reset password link sending failed...!'
                    });
                }
            });
            const transporter = nodemailer.createTransport({
                host: process.env.MAIL_HOST,
                port: process.env.MAIL_PORT,
                secure: false,
                requireTLS: true,
                auth: {
                    user: process.env.MAIL_USER,
                    pass: process.env.MAIL_PASS
                }
            });
            const mailOptions = {
                from: 'Zamin Mirza',
                to: body.email,
                subject: 'Reset Password Link - 01Synergy',
                html: '<p>You requested for reset password, kindly use below token to reset your password</p><br><p>TOKEN - '+ token
            }
            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    return res.json({
                        success: 0,
                        message: 'Mail sending failed!'
                    });
                } else {
                    return res.json({
                        success: 1,
                        message: 'Mail sent'
                    });
                }
            });
            return res.json({
                success: 1,
                message: 'Password reset link has been sent to your emails. please check...',
                token: token
            });
        })
    },
    resetPassword: (req, res) => {
        const body = req.body;
        const token = body.token;
        const salt = genSaltSync(10);
        body.password = hashSync(body.password, salt);
        Registration.findOne({where: {reset_password_token: token}}).then(results => {
            if (!results) {
                return res.json({
                    success: 0,
                    message: 'Invalid token'
                });
            }
            let values = {
                password: body.password,
            }
            results.update(values).then( updatedPassword => {
                return res.json({
                    success: 1,
                    message: 'Password reset successfully'
                });
            }).catch(error => {
                return res.json({
                    success: 0,
                    message: 'Password not reset!'
                });
            })
        })
    },
    refreshToken: (req, res) => {
        const refreshToken = req.body.token;
        var decoded = jwt_decode(refreshToken);
        var email = decoded.email;
        Registration.findOne({where: {email: email}}).then(results => { 
            if (!results) {
                return res.json({
                    success: 0,
                    message: 'Invalid Email'
                });
            }
            results.password = undefined;
            const access_token = sign({
                email: email
            }, process.env.JWT_KEY, {
                expiresIn: '1h',
            });
            const refresh_token = sign({
                email: email
            }, process.env.JWT_LOGIN_KEY, {
                expiresIn: '24h',
            });
            var data = {
                access_token: access_token,
                refresh_token: refresh_token,
            }
            return res.json({
                success: 1,
                access_token: access_token,
                refresh_token: refresh_token
            });
        })
    },
    
    subscriptionList: (req, res) => {
        SubsriptionList.findAll().then(subscription_list => {
            // console.log(subscription_list);
            if (subscription_list.length === 0) {
                return res.json({
                    success: 0,
                    message: 'Record not found!'
                });
            } else {
                return res.json({
                    success: 1,
                    data: subscription_list
                });
            }
        }).catch(error => {
            return res.json({
                success: 0,
                message: error
            });
        });
    },
    
    
    buySubscription: (req, res) => {
        var date = new Date();
        var expiry_date = new Date();
        const body = req.body;
        let token = req.get("authorization");
        token = token.slice(7);
        verify(token, process.env.JWT_KEY, (err, decoded) => {
            if (err) {
                return res.json({
                    success: 0,
                    message: err
                });
            } else {
                Registration.findOne({
                    where: {
                        email: decoded.email,
                    }
                }).then(userData => {
                    UserSubscription.findOne({
                        where: {
                            user_id: userData.id
                        },
                        order: [['id','DESC']],
                    }).then(Subscription => {
                        if (Subscription == null) {
                            if (body.type == 0) {
                                expiry_date = expiry_date.setDate(expiry_date.getDate() + 3);
                                UserSubscription.create({
                                    sub_id: 0,
                                    user_id: userData.id,
                                    type: 0,
                                    starts_at: date,
                                    expires_at: expiry_date,
                                    user_price: 0,
                                    payment_id: 'testing',
                                    status: 1
                                }).then((trial) => {
                                    return res.json({
                                        success: 1,
                                        message: 'Subscription success!',
                                        data: trial
                                    });
                                }).catch(error => {
                                    console.log(error);
                                });
                            } else {
                                SubsriptionList.findOne({
                                    where: {
                                        id: body.sub_id
                                    }
                                }).then(subsDetail => {
                                    console.log(subsDetail);
                                    let expiry = new Date();
                                    if (body.sub_id == 1) {
                                        expiry = expiry.setDate(expiry.getDate() + 365);
                                    } else {
                                        expiry = expiry.setDate(expiry.getDate() + 30);
                                    }
                                    UserSubscription.create({
                                        sub_id: body.sub_id,
                                        user_id: userData.id,
                                        type: 1,
                                        starts_at: date,
                                        expires_at: expiry,
                                        user_price: subsDetail.dataValues.price,
                                        payment_id: 'testing',
                                        status: 1
                                    }).then((trial) => {
                                        return res.json({
                                            success: 1,
                                            message: 'Subscription success!',
                                            data: trial
                                        });
                                    }).catch(error => {
                                        console.log(error);
                                    });
                                }).catch(error => {
                                    console.log(error);
                                    return res.json({
                                        success: 0,
                                        message: 'something went wrong!',
                                        data: error
                                    });
                                });
                            }
                        } else {
                            if (Subscription.dataValues.type == 0) {
                                if (body.type == 0) {
                                    return res.json({
                                        success: 1,
                                        success: 'You have already subscribed trial version',
                                        data: Subscription
                                    });
                                } else {
                                    let expiry_d = new Date();
                                    let newPrice = 0;
                                    if (body.sub_id == 1) {
                                        expiry_d = expiry_d.setDate(expiry_d.getDate() + 365);
                                        newPrice = 1499;
                                    } else {
                                        expiry_d = expiry_d.setDate(expiry_d.getDate() + 30);
                                        newPrice = 150;
                                    }
                                    UserSubscription.create({
                                        sub_id: body.sub_id,
                                        user_id: userData.id,
                                        type: 1,
                                        starts_at: date,
                                        expires_at: expiry_d,
                                        user_price: newPrice,
                                        payment_id: 'testing',
                                        status: 1
                                    }).then((trial) => {
                                        return res.json({
                                            success: 1,
                                            message: 'Subscription success!',
                                            data: trial
                                        });
                                    }).catch(error => {
                                        console.log(error);
                                    });
                                } 
                            } else {
                                if (body.type == 0) {
                                    return res.json({
                                        success: 0,
                                        message: 'You can not subscribe this plan now...',
                                        data: Subscription
                                    });
                                } else {
                                    let exp = new Date(Subscription.dataValues.expires_at);
                                    if (exp >= date) {
                                        return res.json({
                                            success: 0,
                                            message: 'You have already subscribed paid plan...',
                                            data: Subscription
                                        });
                                    } else {
                                        let expiry_da = new Date();
                                        let newPrice = 0;
                                        if (body.sub_id == 1) {
                                            expiry_da = expiry_da.setDate(expiry_da.getDate() + 365);
                                            newPrice = 1499;
                                        } else {
                                            expiry_da = expiry_da.setDate(expiry_da.getDate() + 30);
                                            newPrice = 150;
                                        }
                                        UserSubscription.create({
                                            sub_id: body.sub_id,
                                            user_id: userData.id,
                                            type: 1,
                                            starts_at: date,
                                            expires_at: expiry_da,
                                            user_price: newPrice,
                                            payment_id: 'testing',
                                            status: 1
                                        }).then((trial) => {
                                            return res.json({
                                                success: 1,
                                                message: 'Subscription success!',
                                                data: trial
                                            });
                                        }).catch(error => {
                                            console.log(error);
                                        });
                                    }
                                }
                            }
                        }
                    }).catch(error => {
                        console.log(error);
                        return res.json({
                            success: 0,
                            message: error
                        });
                    });
                }).catch(error => {
                    return res.json({
                        success: 0,
                        data: error
                    });
                });
            }
        });
    }
}