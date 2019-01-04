const path = require('path');
const express = require('express');
const session = require('express-session');
const MondoDBStore = require('connect-mongodb-session')(session);
const bodyParser = require('body-parser');
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

app.set('view engine', 'ejs');
app.set('views');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'my secret', resave: false, saveUninitialized: false, store: store }));

app.use((req, res, next) => {
    User.findById('5c1be8fe12e84805b0aee3ef')
        .then(user => {
            req.user = user;
            next();
        })
        .catch(err => console.log(err));
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(error.get404);

mongoose.connect(MONGODB_URI, { useNewUrlParser: true })
    .then(() => {
        console.log('Connection Successful');
        User.findOne()
            .then(user => {
                if (!user) {
                    const user = new User({
                        name: 'Prabeen',
                        email: 'prabeen@test.com',
                        cart: {
                            items: []
                        }
                    });
                    user.save();
                }
            })
            .catch(err => console.log(err));
        app.listen(3000);
    })
    .catch(err => console.log(err));