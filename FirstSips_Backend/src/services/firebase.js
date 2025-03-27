const admin = require('firebase_admin');
require('dotenv').config();

const serviceAccount = require('../config/serviceAccountKey.json');

const initializeFirebase = () => {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

module.exports = {
    initializeFirebase,
    admin
};