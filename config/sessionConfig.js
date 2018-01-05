module.exports = function () {
    return {
        name: 'Buzzer-Session',
        secret: 'buzzer plus 5',
        resave: true,
        saveUninitialized: true,
        cookie: {
            secure: false,
            maxAge: 60 * 60 * 1000
        }
    };
};