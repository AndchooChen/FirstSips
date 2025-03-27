const { auth, db } = require('../services/firebase');

exports.registerUser = async (req, res) => {
    const {
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
        birthday,
        isShopOwner,
    } = req.body;

    try {
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: '${firstName} ${lastName}',
        });

        await db.collection('users').doc(userRecord.uid).set({
            firstName,
            lastName,
            email,
            phoneNumber,
            birthday,
            isShopOwner,
            createdAt: new Date().toISOString(),
            shopId: null,
        });

        const customToken = await auth.createCustomToken(userRecord.uid);
        res.send({ token: customToken, userId: userRecord.uid });
    } catch (err) {
        console.log(err);
        res.status(500).send({ error: err.message });
    }
};