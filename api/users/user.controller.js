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
const date = require('date-and-time');
const uploadFile = require("../users/upload");

const passport  = require('passport');
const strategy  = require('passport-facebook');

const FacebookStrategy = strategy.Strategy;

passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(obj, done) {
    done(null, obj);
  });
  
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL,
        profileFields: ["email", "name"]
      },
      function(accessToken, refreshToken, profile, done) {
        const { email, first_name, last_name } = profile._json;
        const userData = {
          email,
          firstName: first_name,
          lastName: last_name
        };
        new Registration(userData).save();
        done(null, profile);
      }
    )
  );

let Publishable_Key = 'pk_test_51LOFBCSIWOhbslXvJi4cEwyYEiY7p6s1SYYmCJxFMHDz7Jn3U6Eu7yYmYHr4ZorvmKKvoUhJI0nVFG62MJVxAkdo00n2IDSoTP';
let Secret_Key = 'sk_test_51LOFBCSIWOhbslXvejhEDkhsHX48VlhAuFe0keUoI6ElHscYVCtH43z9dJBPE1QjpjmSkqvVvZdMwhWmSaCmE3Ye002P8Vb9uX';

const stripe = require('stripe')(Secret_Key);



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
        const baseUrl = process.env.BASEURL + process.env.APP_PORT + req.baseUrl;
        const body = req.body;
        const salt = genSaltSync(10);
        body.password = hashSync(body.password, salt);
        Registration.findOne({where: {email: body.email}}).then(results => {
            if (results == null) {
                Registration.create({
                    firstName: body.first_name,
                    role_id: 2,
                    lastName: body.last_name,
                    gender: body.gender,
                    email: body.email,
                    password: body.password,
                    number: body.number
                }).then(addedUser => {
                    // console.log(addedUser.dataValues.id);
                    const token = sign({
                        id: addedUser.dataValues.id,
                    }, process.env.JWT_EMAIL_KEY, {
                        expiresIn: '600s',
                    });
                    let values = {
                        is_email_verified : 0,
                        email_verified_token: token,
                    }
                    addedUser.update(values).then(updatedPassword => {
                        if (!updatedPassword) {
                            return res.json({
                                success: 0,
                                message: 'Email verify mail sending failed...!'
                            });
                        }
                    }).catch(error => {
                        return res.json({
                            success: 0,
                            message: error
                        });
                    });
                    // console.log(updatedPassword);
                    const transporter = nodemailer.createTransport({
                        name: 'Zamin',
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
                        subject: 'Email Verification - 01Synergy',
                        html: '<p>You are successfully registered.., kindly use below button to verify your email</p><br><a class="btn btn-info" href="'+baseUrl+'/verify/'+token+'/'+body.email+'">Verify your Email</a>'
                    }
                    transporter.sendMail(mailOptions, (err, info) => {
                        if (err) {
                            console.log(err);
                        }
                    });

                    return res.json({
                        success: 1,
                        message: 'User added successfully... Please verify your email...',
                        data: addedUser
                    });
                }).catch(error => {
                    return res.json({
                        success: 0,
                        message: 'Something went wrong...!'
                    });
                });
            } else {
                return res.json({
                    success: 0,
                    message: 'This email is already in use...!'
                });
            }
        }).catch(error => {
            return res.json({
                success: 0,
                error: error
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
                    expiresIn: '6h',
                });
                const refresh_token = sign({
                    email: body.email
                }, process.env.JWT_LOGIN_KEY, {
                    expiresIn: '24h',
                });
                // console.log(results.dataValues.is_email_verified);
                if (results.dataValues.is_email_verified == 0) {
                    return res.json({
                        success: 0, 
                        message: 'Please verify your email first...!',
                    });
                } else {
                    return res.json({
                        success: 1, 
                        message: 'login successfully',
                        access_token: access_token,
                        refresh_token: refresh_token
                    });
                }
            } else {
                return res.json({
                    success: 0,
                    message: 'Wrong Password!'
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
                message: 'Token required!'
            });
        } else {
            console.log(token);
            destroy(token);
            return res.json({
                success: 1,
                message: 'User Logout Successfully!'
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
    // verifyEmailSend: (req, res) => {
    //     const body = req.body;
    //     const baseUrl = process.env.BASEURL + process.env.APP_PORT + req.baseUrl;
    //     Registration.findOne({where: {email: body.email}}).then(results => {
    //         const token = sign({
    //             id: results.dataValues.id,
    //         }, process.env.JWT_EMAIL_KEY, {
    //             expiresIn: '600s',
    //         });
    //         let values = {
    //             is_email_verified : 0,
    //             email_verified_token: token,
    //         }
    //         results.update(values).then(updatedPassword => {
    //             // console.log(updatedPassword);
    //             if (!updatedPassword) {
    //                 return res.json({
    //                     success: 0,
    //                     message: 'Email verify mail sending failed...!'
    //                 });
    //             }
    //         }).catch(error => {
    //             return res.json({
    //                 success: 0,
    //                 message: error
    //             });
    //         });
    //         // console.log(updatedPassword);
    //         const transporter = nodemailer.createTransport({
    //             name: 'Zamin',
    //             host: process.env.MAIL_HOST,
    //             port: process.env.MAIL_PORT,
    //             secure: false,
    //             requireTLS: true,
    //             auth: {
    //                 user: process.env.MAIL_USER,
    //                 pass: process.env.MAIL_PASS
    //             }
    //         });
    //         const mailOptions = {
    //             from: 'Zamin Mirza',
    //             to: body.email,
    //             subject: 'Email Verification - 01Synergy',
    //             html: '<p>You are successfully registered.., kindly use below button to verify your email</p><br><a class="btn btn-info" href="'+baseUrl+'/verify/'+token+'/'+body.email+'">Verify your Email</a>'
    //         }
    //         transporter.sendMail(mailOptions, (err, info) => {
    //             if (err) {
    //                 return res.json({
    //                     success: 0,
    //                     message: 'Mail sending failed!',
    //                     error: err
    //                 });
    //             } else {
    //                 return res.json({
    //                     success: 1,
    //                     message: 'Mail sent',
    //                 });
    //             }
    //         });
    //     }).catch(error => {
    //         return res.json({
    //             success: 0,
    //             message: 'Invalid email'
    //         });
    //     });
    // },
    verifyEmail: (req, res) => {
        let token = req.params.token;
        let email = req.params.email;
        Registration.findOne({ where: {email_verified_token: token, email: email} }).then(results => {
            if (results == null) {
                return res.json({
                    success: 0,
                    message: 'Invalid link...!'
                });
            } else {
                verify(token, process.env.JWT_EMAIL_KEY, (err, decoded) => {
                    if (err) {
                        res.json({
                            success: 0,
                            message: 'Token expired!'
                        });
                    } else {
                        let values = {
                            is_email_verified : 1,
                            email_verified_token: '',
                        }
                        results.update(values).then(success => {
                            res.json({
                                success: 1,
                                message: 'your email verified successfully!'
                            });
                        }).catch(error => {
                            res.json({
                                success: 0, 
                                error: error
                            });
                        });
                    }
                });
            }
        }).catch(error => {
            return res.json({
                success: 0,
                error: error
            });
        });
    },
    resetPassword: (req, res) => {
        const body = req.body;
        const token = body.token;
        const salt = genSaltSync(10);
        body.password = hashSync(body.password, salt);
        Registration.findOne({where: {reset_password_token: token}}).then(results => {
            // if (!results) {
                
            // }
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
        }).catch(error => {
            return res.json({
                success: 0,
                message: 'Invalid token'
            });
        });
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
    },
    checkSubscription: (req, res) => {
        var date = new Date();
        var expiry_date = new Date();
        var checkValidity = 0;
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
                    UserSubscription.findAll({
                        where: {
                            user_id: userData.id
                        },
                        order: [['id','DESC']],
                    }).then(subscription => {
                        if (subscription == null) {
                            return res.json({
                                success: 0,
                                message: 'No-Subscription'
                            });
                        } else {
                            let a = subscription.map(element => {
                                let exp = new Date(element.dataValues.expires_at);
                                if (exp >= date) {
                                    checkValidity = 1;
                                } else {
                                    checkValidity = 0;
                                }
                                let values = {
                                    id: element.dataValues.id,
                                    sub_id: element.dataValues.sub_id,
                                    user_id: element.dataValues.user_id,
                                    type: element.dataValues.type,
                                    starts_at: element.dataValues.starts_at,
                                    expires_at: element.dataValues.expires_at,
                                    user_price: element.dataValues.user_price,
                                    payment_id: element.dataValues.payment_id,
                                    status: element.dataValues.status,
                                    checkValidity: checkValidity,
                                }
                                
                                return values;
                              }); 
                            //   console.log(a);
                              return res.json({
                                success: 1,
                                data: a
                            });
                        }
                        
                    }).catch(error => {
                        return res.json({
                            success: 0,
                            message: error
                        });
                    });
                }).catch(error => {
                    return res.json({
                        success: 0,
                        message: error
                    });
                })
            }
        });
    },
    fileUpload: async (req, res, next) => {
            try {
                console.log(uploadFile(req, res));
              await uploadFile (req, res);
              if (req.file == undefined) {
                return res.status(400).send({ message: "Please upload a file!" });
              }
              res.status(200).send({
                message: "Uploaded the file successfully: " + req.file.originalname,
              });
            } catch (err) {
              res.status(500).send({
                message: `Could not upload the file: ${req.file.originalname}. ${err}`,
              });
            }
    },
    payment: (req, res) => {
        // stripe.customers.create({
        //     email: req.body.stripeEmail,
        //     name: 'Gourav Hammad',
        //     address: {
        //         line1: 'TC 9/4 Old MES colony',
        //         postal_code: '452331',
        //         city: 'Indore',
        //         state: 'Madhya Pradesh',
        //         country: 'India',
        //     }
        // })
        // .then((customer) => {
     
        //     return stripe.charges.create({
        //         amount: 2500,     // Charing Rs 25
        //         description: 'Web Development Product',
        //         currency: 'INR',
        //         customer: customer.id
        //     });
        // })
        // .then((charge) => {
        //     return res.json({
        //                     success: 1,
        //                     message: charge
        //                 });
        // })
        // .catch((err) => {
        //     console.log(err);
        //     return res.json({
        //         success: 0,
        //         message: err
        //     });
        // });
        // console.log('ok');
    res.render('Home', {
       key: Publishable_Key
    })
    },
    payments: async (req, res) => {
        const token = await stripe.tokens.create({
            card: {
              number: '4242424242424242',
              exp_month: 7,
              exp_year: 2023,
              cvc: '314',
            },
          });
        console.log('Pardedep', token);
        stripe.customers.create({
            email: req.body.stripeEmail,
            source: req.body.stripeToken,
            name: 'Gautam Sharma',
            address: {
                line1: 'TC 9/4 Old MES colony',
                postal_code: '110092',
                city: 'New Delhi',
                state: 'Delhi',
                country: 'India',
            }
        })
        .then((customer) => {
     
            return stripe.charges.create({
                amount: 7000,    
                description: 'Web Development Product',
                currency: 'USD',
                customer: customer.id
            });
        })
        .then((charge) => {
            res.send("Success") // If no error occurs
        })
        .catch((err) => {
            res.send(err)    // If some error occurs
        });
    }
}