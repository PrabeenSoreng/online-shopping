const mongodb = require('mongodb');

const getDb = require('../util/database').getDb;

class User {
    constructor(username, email) {
        this.name = username;
        this.email = email;
    }

    save() {
        const db = getDb();
        return db.collection('users').insertOne(this)
            .then(user => console.log('User Created'))
            .catch(err => console.log(err));
    }

    static findById(userId) {
        const db = getDb();
        return db.collection('users')
            .find({ _id: new mongodb.ObjectID(userId) }).next()
            .then(user => {
                return user;
            })
            .catch(err => console.log(err));
    }
}

module.exports = User;