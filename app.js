const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const error = require('./controllers/not-found');
// const mongoConnect = require('./util/database').mongoConnect;
const mongoose = require('mongoose');
// const User = require('./models/user');

const app = express();

app.set('view engine', 'ejs');
app.set('views');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// app.use((req, res, next) => {
//     User.findById('5c1b3a334e71c315b4bfaa8b')
//         .then(user => {
//             req.user = new User(user.name, user.email, user.cart, user._id);
//             next();
//         })
//         .catch(err => console.log(err));
// });

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(error.get404);

mongoose.connect('mongodb+srv://prabeen:CVveoqfTEGyAJXqD@cluster0-dtqbk.mongodb.net/shop?retryWrites=true', { useNewUrlParser: true })
    .then(() => {
        console.log('Connection Successful');
        app.listen(3000);
    })
    .catch(err => console.log(err));