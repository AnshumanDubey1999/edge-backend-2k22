const UserSchema = require('../models/user');
const EventSchema = require('../models/event');
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
        const isAdmin =
            req.user &&
            req.user.permissions &&
            req.user.permissions.includes('register');
        // user.isAdmin = tru
        if (isRegistered && isAdmin != user.isAdmin) {
            user = await UserSchema.findOneAndUpdate(
                { email: req.user.email },
                { isAdmin: isAdmin },
                { upsert: true, new: true }
            ).lean();
        }

        // console.log('user', user);
        const tokenData = {
            name: user.name,
            email: user.email,
            isAdmin: isAdmin,
            _id: user._id
        };
        if (!isRegistered) tokenData.avatar = req.user.avatar;
        const token = generateAccessToken(
            tokenData,
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
        const user = {
            name: req.user.name,
            contact: req.user.contact,
            email: req.user.email,
            avatar: req.user.avatar,
            stream: req.body.stream,
            year: req.body.year,
            instituteName: req.body.instituteName,
            isAdmin: req.user.isAdmin,
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

exports.myProfile = async (req, res) => {
    try {
        const user = await UserSchema.findById(req.user._id);
        res.status(200).json({
            success: true,
            user: user
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            err: error
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const user = await UserSchema.findById(req.user._id);
        user.stream = req.body.stream;
        user.instituteName = req.body.instituteName;
        user.year = req.body.year;
        await user.save();
        res.status(200).json({
            success: true,
            user: user
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            err: error
        });
    }
};

//ADMIN ONLY
exports.viewUser = async (req, res) => {
    try {
        let query = {};
        if (req.query.id) {
            query = {
                _id: req.query.id
            };
        } else if (req.query.email) {
            query = {
                email: req.query.email
            };
        } else if (req.query.contact) {
            query = {
                contact: req.query.contact
            };
        } else {
            return res.status(200).json({
                success: false,
                error: 'Need id, email or contact to find user.'
            });
        }

        const user = await UserSchema.findOne(query).lean();
        if (user) {
            user.registeredEvents = await EventSchema.getEventTitles(
                user.registeredEvents
            );
        }
        res.status(200).json({
            success: true,
            user: user
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            err: error
        });
    }
};

exports.allUsers = async (req, res) => {
    try {
        const limit = 20;
        const skip = (Number(req.query.page) - 1) * 20;
        let query = {
            $and: []
        };
        if (req.query.eventCode) {
            query['$and'].push({
                $expr: {
                    $in: [req.query.eventCode, '$registeredEvents']
                }
            });
        }
        if (req.query.stream) {
            query['$and'].push({
                stream: req.query.stream
            });
        }
        if (req.query.year) {
            query['$and'].push({
                year: req.query.year
            });
        }
        if (req.query.instituteName) {
            query['$and'].push({
                instituteName: req.query.instituteName
            });
        }
        if (req.query.name) {
            query['$and'].push({
                $text: {
                    $search: req.query.name
                }
            });
        }
        if (query.$and.length == 0) query = {};
        let documentCount = await UserSchema.aggregate([
            { $match: query },
            { $group: { _id: null, n: { $sum: 1 } } }
        ]);
        documentCount = documentCount[0] ? documentCount[0].n : 0;
        const users = await UserSchema.aggregate([
            { $match: query },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: 'events',
                    let: { registeredEvents: '$registeredEvents' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: ['$eventCode', '$$registeredEvents']
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                title: 1,
                                eventCode: 1
                            }
                        }
                    ],
                    as: 'registeredEvents'
                }
            }
        ]);
        res.status(200).json({
            success: true,
            totalDocuments: documentCount,
            range: `${skip}-${Math.min(
                documentCount,
                skip + 20
            )}/${documentCount}`,
            users: users
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            err: error
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await UserSchema.findByIdAndDelete(req.body.user_id);
        res.status(200).json({
            success: true,
            user: user
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            err: error.message
        });
    }
};
