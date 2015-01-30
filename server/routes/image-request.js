var errorUtil = require('../../lib/error');
var habitat = require('habitat');
var policy_gen = require('s3-post-policy');
var uuid_gen = require('node-uuid');

var baseDir = 'i';

module.exports = function (req, res, next) {
    var user = req.session && req.session.user;

    // Check auth
    if (habitat.get('FAKE_AUTH')) {
        user = req.body.user;
    } else {
        if (!user) return next(errorUtil(401, 'No user session found'));
        if (!user.id || !user.username) return next(errorUtil(401, 'No valid user session found'));
    }

    var policy = policy_gen({
        id: habitat.get('ACCESS_KEY_ID'),
        key: habitat.get('SECRET_ACCESS_KEY'),
        date: Date.now(),
        region: habitat.get('REGION'),
        bucket: habitat.get('BUCKET'),
        policy: {
            expiration: Date.now() + 60 * 1000, // 1 minute to upload to S3
            conditions: [
                {'Cache-Control': 'max-age=31536000'}, // 1 year
                ['starts-with', '$Content-Type', 'image/'], // Content-Type has to start with 'image/'
                ['starts-with', '$key', baseDir + '/' + user.id + '/' + uuid_gen.v4() ]
            ]
        }
    });

    res.json(policy);
};