require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const userRouter = require('./api/users/user.router');
const passport  = require('passport');
const upload = require('multer')();

app.use(express.json());
var corOptions = {
     origin: 'http://localhost:3000'
    }
    
    //middleware
app.use(cors(corOptions));
app.use(passport.initialize());

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
    
app.use('/api/users', upload.any(), userRouter);

app.listen(process.env.APP_PORT, () => {
    console.log('server up and running on PORT: ', process.env.APP_PORT);
});