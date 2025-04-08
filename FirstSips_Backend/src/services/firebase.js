<<<<<<< HEAD
<<<<<<< HEAD
const admin = require('firebase_admin');
=======
const admin = require('firebase-admin');
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
require('dotenv').config();

const serviceAccount = require('./serviceAccountKey.json');

const initializeFirebase = () => {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
};

module.exports = {
<<<<<<< HEAD
    initializeFirebase,
    admin
=======
const admin = require('firebase-admin');
require('dotenv').config();

const serviceAccount = require('./serviceAccountKey.json');

const initializeFirebase = () => {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
};

module.exports = {
  initializeFirebase,
  admin
>>>>>>> LoginRedesign
=======
  initializeFirebase,
  admin
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
};