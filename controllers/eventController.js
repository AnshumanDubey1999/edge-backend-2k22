/* eslint-disable no-undef */
const eventModel = require('../models/event');
const UserModel = require('../models/user');
const auth = require('../middlewares/auth');
const eventValidateSchema = require('../validations/event_validation_schema')
    .eventSchema;
const paramsValidationSchema = require('../validations/event_validation_schema')
    .eventParamsSchema;

exports.addEvent = (req, res) => {
    var newEvent = {};
    const { error } = eventValidateSchema.validate(req.body);
    if (error) {
        console.log(error);
        return res.status(400).json({ success: false, error });
    }

    newEvent = this.getSantizedEventObject(req);

    eventModel
        .create(newEvent)
        .then((event) => {
            res.status(200).json({ success: true, event });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({ success: false, err });
        });
};

exports.addImage = async (req, res) => {
    // console.log(req.file.filename);
    try {
        res.status('200').json({
            sucess: true
        });
    } catch (e) {
        res.status('200').json({
            sucess: false,
            error: String(e)
        });
    }
};

exports.addLogo = async (req, res) => {
    // console.log(req.file.filename);
    try {
        res.status('200').json({
            sucess: true
        });
    } catch (e) {
        res.status('200').json({
            sucess: false,
            error: String(e)
        });
    }
};

exports.getAllEvents = async (req, res) => {
    try {
        const filter = {};
        if (req.query.club) filter.club = req.query.club;
        const events = await eventModel.find(filter);
        res.status(200).json({
            success: true,
            events: events
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            err: error.message
        });
    }
};

exports.getEvents = (req, res) => {
    const userData = auth.auth(req);
    let isAdmin = false;
    if (userData.success) isAdmin = userData.user.isAdmin;
    eventModel
        .getEventsByQuery(req.query, isAdmin)
        .then((events) => {
            return res.status(200).json({ success: true, events });
        })
        .catch((err) => {
            console.log(err);
            return res.status(500).json({ success: false, err });
        });
};

exports.getEventByCode = (req, res) => {
    const { error } = paramsValidationSchema.validate(req.params);
    if (error) {
        return res.status(400).json({ success: false, error });
    }
    const code = req.params.eventCode;

    eventModel
        .getEventByCode(code)
        .then((event) => {
            if (event === null) {
                throw new Error('Event does not exist');
            }
            res.status(200).json({ success: true, event });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({ success: false, err: err.message });
        });
};

exports.updateEvent = (req, res) => {
    var filter = null;
    var updatedEvent = {};
    const options = { new: true };

    const { error } = eventValidateSchema.validate(req.body);
    if (error) {
        console.log(error);
        return res.status(400).json({ success: false, error });
    }

    updatedEvent = this.getSantizedEventObject(req);

    if (req.body.eventCode != undefined) {
        filter = { eventCode: req.body.eventCode };
    }
    if (req.body.id != undefined) {
        filter = { _id: req.body.id };
    }

    if (!filter)
        return res.status(400).json({
            success: false,
            error:
                'request body must have an event code or id associated with it'
        });
    eventModel
        .findOneAndUpdate(filter, updatedEvent, options)
        .populate('category')
        .then((updatedDocument) => {
            if (updatedDocument) {
                res.status(200).json({ success: true, updatedDocument });
            } else {
                res.status(500).json({
                    success: false,
                    msg: 'No document matches the provided query.'
                });
            }
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({ success: false, err });
        });
};
//santitizing fields after proper validations.
exports.getSantizedEventObject = (req) => {
    var updatedEvent = {};
    if (req.body.eventCode) updatedEvent['eventCode'] = req.body.eventCode;
    if (req.body.title) updatedEvent['title'] = req.body.title;
    if (req.body.subtitle) updatedEvent['subtitle'] = req.body.subtitle;
    updatedEvent['eventPrice'] = req.body.eventPrice || 0;
    if (req.body.desc) updatedEvent['desc'] = req.body.desc;
    if ('isActive' in req.body) updatedEvent['isActive'] = req.body.isActive;
    if (req.body.discount) updatedEvent['discount'] = req.body.discount;
    if (req.body.combos) updatedEvent['combos'] = req.body.combos;
    if (req.body.cid) updatedEvent['category'] = req.body.cid;
    if (req.body.eventType) updatedEvent['eventType'] = req.body.eventType;
    if (req.body.club) updatedEvent['club'] = req.body.club;
    if (req.body.rules) updatedEvent['rules'] = req.body.rules;
    if (req.body.contacts) updatedEvent['contacts'] = req.body.contacts;

    if (updatedEvent['title'])
        updatedEvent['title'] = updatedEvent['title']
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

    if (updatedEvent['desc'])
        updatedEvent['desc'] = updatedEvent['desc']
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

    if (updatedEvent['eventType'])
        updatedEvent['eventType'] = updatedEvent['eventType']
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

    return updatedEvent;
};

exports.getRegisteredEvents = async (req, res) => {
    try {
        const user = await UserModel.findById(req.user._id);
        if (!user) {
            throw new Error('User not found!');
        }
        const events = await eventModel.findAllByEventCode(
            user.registeredEvents
        );
        res.status(200).json({ success: true, events });
    } catch (error) {
        res.json({ success: false, err: String(error) });
    }
};

// eslint-disable-next-line no-unused-vars
exports.delete = (req, res, next) => {
    var id = req.body.id;
    var code = req.body.eventCode;

    // const { error } = eventValidateSchema.validate(req.body);

    // if (error) {
    //     console.log(error);
    //     return res.status(400).json({ error });
    // }

    var filter = {};
    if (id != null) {
        filter = { _id: id };
    } else if (code != null) {
        filter = { eventCode: code };
    } else {
        return res.status(400).json({
            success: false,
            message: 'Either id or eventCode required in req.body'
        });
    }

    eventModel
        .deleteOne(filter)
        .then((result) => {
            if (result.deletedCount == 0)
                res.status(200).json({
                    success: false,
                    err: 'Invalid Event Code!'
                });
            else res.status(200).json({ success: true, result });
        })
        .catch((err) => {
            console.log({ err });
            res.status(500).json({ success: false, err });
        });
};
