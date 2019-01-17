const path = require('path');
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const MondoDBStore = require('connect-mongodb-session')(session);
const bodyParser = require('body-parser');
const csrf = require('csurf');
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const error = require('./controllers/not-found');
// const mongoConnect = require('./util/database').mongoConnect;
const mongoose = require('mongoose');
const User = require('./models/user');

const MONGODB_URI = 'mongodb+srv://prabeen:CVveoqfTEGyAJXqD@cluster0-dtqbk.mongodb.net/shop';

const app = express();

const store = new MondoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});
const csrfProtection = csrf();

app.set('view engine', 'ejs');
app.set('views');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'my secret', resave: false, saveUninitialized: false, store: store }));
app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use((req, res, next) => {
    if (!req.session.user) return next();

    User.findById(req.session.user._id)
        .then(user => {
            if (!user) return next();
            req.user = user;
            next();
        })
        .catch(err => {
            next(new Error(err));
        });
});


app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use('/500', error.get500);
app.use(error.get404);

app.use((error, req, res, next) => {
    res.status(500).render('500', { pageTitle: 'Error', path: '', isAuthenticated: req.session.isLoggedIn });
});

mongoose.connect(MONGODB_URI, { useNewUrlParser: true })
    .then(() => {
        console.log('Connection Successful');
        // User.findOne()
        //     .then(user => {
        //         if (!user) {
        //             const user = new User({
        //                 name: 'Prabeen',
        //                 email: 'prabeen@test.com',
        //                 cart: {
        //                     items: []
        //                 }
        //             });
        //             user.save();
        //         }
        //     })
        //     .catch(err => console.log(err));
        app.listen(3000);
    })
    .catch(err => console.log(err));