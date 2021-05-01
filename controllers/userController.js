const UserSchema = require('../models/user');
const generateAccessToken = require('../middlewares/auth').generateAccessToken;

exports.login = async (req, res) => {
    try {
        // console.log(req.user);
        let isRegistered = true;
        let user = await UserSchema.findByEmail(req.user.email).lean();
        if (!user) {
            user = {
                name: req.user.name,
                avatar: req.user.avatar,
                contact: req.user.phone,
                email: req.user.email,
                _id: null
            };
            isRegistered = false;
        }
        user.isAdmin =
            req.user &&
            req.user.permissions &&
            req.user.permissions.includes('register');
        // user.isAdmin = tru
        if (isRegistered) {
            user = await UserSchema.findOneAndUpdate(
                { email: req.user.email },
                user,
                { upsert: true, new: true }
            ).lean();
        }

        console.log('user', user);
        const token = generateAccessToken(
            {
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                contact: user.contact,
                _id: user._id
            },
            isRegistered ? '1d' : '1hr'
        );
        res.status(200).json({
            isRegistered: isRegistered,
            user: user,
            token: token
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            err: error
        });
    }
};

exports.register = async (req, res) => {
    try {
        if (req.user._id != null) {
            throw new Error('User Already Present!');
        }
        console.log(req.user);
        const user = {
            name: req.user.name,
            contact: req.user.contact,
            email: req.user.email,
            stream: req.body.stream,
            year: req.body.year,
            instituteName: req.body.instituteName,
            isAdmin: req.user.isAdmin,
            bills: [],
            registeredEvents: []
        };
        const newUser = await UserSchema.create(user);
        const token = generateAccessToken(
            {
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                _id: newUser._id
            },
            '1d'
        );
        res.status(200).json({
            isRegistered: true,
            user: user,
            token: token
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            err: error
        });
    }
};
