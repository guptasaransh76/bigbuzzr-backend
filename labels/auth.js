const labels = {
    'err_request_body_missing'      : 'request body does not contain required fields',
    'err_mysql_connection'          : 'not able to connect to database',
    'err_mysql_query'               : 'not albe to query database',
    'err_user_not_found'            : 'user not found',
    'err_authentication_failed'     : 'authentication failed',
    'err_logout_not_found'          : 'session not found',



    'info_login_success'            : 'login successful',
    'info_logout_success'           : 'logout successful'
};

module.exports = function (key) {
    return labels[key] ? labels[key] : "undefined_label";
};