var express = require('express');
var crypto = require('crypto');
var router = express.Router();
var logger = require('../utilities/logger');
var labels = require('../labels/auth');


/**
 * generates random string of characters i.e salt
 * @function
 */
const genRandomString = function () {
  const length = 32;

  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex') /** convert to hexadecimal format */
    .slice(0, length);
  /** return required number of characters */
};

/**
 * hash password with sha512.
 * @function
 * @param {string} password - List of required fields.
 * @param {string} salt - Data to be validated.
 */
const sha512 = function (password, salt) {
  var hash = crypto.createHmac('sha512', salt);
  /** Hashing algorithm sha512 */
  hash.update(password);
  var value = hash.digest('hex');
  return {
    salt: salt,
    passwordHash: value
  };
};

module.exports.genRandomString = genRandomString;
module.exports.sha512 = sha512;
