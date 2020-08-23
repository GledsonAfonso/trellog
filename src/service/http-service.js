const { request } = require('axios');

const { timeout } = require('../configuration/environment');

const _timeout = timeout;
const _headers = { 'content-type': 'application/json' };

const _do = async ({ url, data, method, timeout = _timeout, headers = _headers }) => {
    const options = {
        url,
        method,
        headers,
        data,
        timeout,
        timeoutErrorMessage: `Timeout rejection. Time set ${timeout}ms`
    };

    return await request(options);
};

const get = async ({ url, timeout, headers }) => (await _do({ url, method: 'GET', timeout, headers })).data;
const post = async ({ url, body, timeout, headers }) => await _do({ url, data: body, method: 'POST', timeout, headers });
const put = async ({ url, body, timeout, headers }) => await _do({ url, data: body, method: 'PUT', timeout, headers });

module.exports = { get, post, put };