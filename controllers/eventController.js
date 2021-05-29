/* eslint-disable no-undef */
const eventModel = require('../models/event');
const eventValidateSchema = require('../validations/event_validation_schema')
    .eventSchema;
const paramsValidationSchema = require('../validations/event_validation_schema')
    .eventParamsSchema;

exports.addEvent = (req, res) => {
    console.log(req.body);
    var newEvent = {};
    const { error } = eventValidateSchema.validate(req.body);
    if (error) {
        console.log(error);
        return res.status(400).json({ error });
    }

    newEvent = this.getSantizedEventObject(req);

    eventModel
        .create(newEvent)
        .then((event) => {
            res.status(200).json({ event });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({ err });
        });
};

exports.getAllEvents = (req, res) => {
    eventModel
        .getAllEvents()
        .then((events) => {
            res.status(200).json({ events });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({ err });
        });
};

exports.getEvents = (req, res) => {
    eventModel
        .getEventsByQuery(req.query)
        .then((events) => {
            return res.status(200).json({ events });
        })
        .catch((err) => {
            console.log(err);
            return res.status(500).json({ err });
        });
};

exports.getEventByCode = (req, res) => {
    const { error } = paramsValidationSchema.validate(req.params);
    if (error) {
        return res.status(400).json({ error });
    }
    const code = req.params.eventCode;

    eventModel
        .getEventByCode(code)
        .then((event) => {
            res.status(200).json({ event });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({ err });
        });
};

exports.updateEvent = (req, res) => {
    var filter = null;
    var updatedEvent = {};
    const options = { new: true };

    const { error } = eventValidateSchema.validate(req.body);
    if (error) {
        console.log(error);
        return res.status(400).json({ error });
    }

    updatedEvent = this.getSantizedEventObject(req);
    console.log(updatedEvent);

    if (req.body.eventCode != undefined) {
        filter = { eventCode: req.body.eventCode };
    }
    if (req.body.id != undefined) {
        filter = { _id: req.body.id };
    }

    if (!filter)
        return res.status(400).json({
            error:
                'request body must have an event code or id associated with it'
        });

    eventModel
        .findOneAndUpdate(filter, updatedEvent, options)
        .populate('category')
        .then((updatedDocument) => {
            if (updatedDocument) {
                console.log(
                    `Successfully updated document: ${updatedDocument}.`
                );
            } else {
                console.log('No document matches the provided query.');
                res.status(500).json({
                    msg: 'No document matches the provided query.'
                });
            }
            res.status(200).json(updatedDocument);
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({ err });
        });
};
//santitizing fields after proper validations.
exports.getSantizedEventObject = (req) => {
    var updatedEvent = {};
    if (req.body.eventCode) updatedEvent['eventCode'] = req.body.eventCode;
    if (req.body.title) updatedEvent['title'] = req.body.title;
    if (req.body.eventPrice) updatedEvent['eventPrice'] = req.body.eventPrice;
    if (req.body.desc) updatedEvent['desc'] = req.body.desc;
    if (req.body.isActive) updatedEvent['isActive'] = req.body.isActive;
    if (req.body.discount) updatedEvent['discount'] = req.body.discount;
    if (req.body.combos) updatedEvent['combos'] = req.body.combos;
    if (req.body.cid) updatedEvent['category'] = req.body.cid;
    if (req.body.eventType) updatedEvent['eventType'] = req.body.eventType;

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

// eslint-disable-next-line no-unused-vars
exports.delete = (req, res, next) => {
    var id = req.body.id;
    var code = req.body.eventCode;

    const { error } = eventValidateSchema.validate(req.body);

    if (error) {
        console.log(error);
        return res.status(400).json({ error });
    }

    var filter = {};
    if (id != null) {
        filter = { _id: id };
    } else if (code != null) {
        filter = { eventCode: code };
    }

    eventModel
        .deleteMany(filter)
        .then((result) => {
            res.status(200).json({ result });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({ err });
        });
};
