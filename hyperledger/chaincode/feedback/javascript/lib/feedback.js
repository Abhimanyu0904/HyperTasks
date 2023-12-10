/* eslint-disable @stylistic/js/max-len */
/*
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

const {Contract, Context} = require("fabric-contract-api"),
    {Iterators} = require("fabric-shim"),
    {UNIVERSITY_TYPE, STUDENT_KEY_IDENTIFIER, FACULTY_KEY_IDENTIFIER, STUDENT_TYPE, FACULTY_TYPE, SUCCESS_MSG, FAILURE_MSG, REQUEST_KEY_IDENTIFIER, NOT_STARTED, UNIVERSITY_KEY_IDENTIFIER, HASH, HASH_ENCODING, CREATION, CONFIRMATION, STATUS, CONFIRMED, REQUEST_TYPE, ADMIN_EMAIL, IN_PROGRESS, ON_HOLD, IMPLEMENTED, DROPPED} = require("../utils/constants"),
    crypto = require("crypto");

// global variables
let facultyCounter = 0,
    requestCounter = 0,
    studentCounter = 0,
    users = {
        faculties: {},
        students: {},
        university: false,
    };

/**
 * Resolves an iterator by gathering all the iterator results and incrementing the required counters.
 * @param {Iterators.StateQueryIterator} iterator - The iterator to be resolved.
 * @returns {Promise<void>} a promise that is resolved when the iterator fetches all results.
 */
async function resolveIterator(iterator){
    let iterator_flag = true;

    while (iterator_flag) {
        const res = await iterator.next();

        if (res.value && res.value.value.toString()) {
            try {
                const asset = JSON.parse(res.value.value.toString("utf8"));
                console.log(`asset: ${JSON.stringify(asset), null, 2}`);
                console.log(`asset key: ${res.value.key}`);

                switch (asset.type){
                case STUDENT_TYPE:
                    var identifier = crypto
                        .createHash(HASH)
                        .update(asset.email)
                        .digest(HASH_ENCODING);

                    ++studentCounter;
                    users.students[identifier] = true;
                    break;

                case FACULTY_TYPE:
                    identifier = crypto
                        .createHash(HASH)
                        .update(asset.email)
                        .digest(HASH_ENCODING);

                    ++facultyCounter;
                    users.faculties[identifier] = true;
                    break;

                case REQUEST_TYPE:
                    ++requestCounter;
                    break;

                case UNIVERSITY_TYPE:
                    users.university = true;
                    break;

                default:
                    console.log(`unknown asset type: ${asset.type}`);
                }
            } catch (err) {
                console.error(`Error: ${err}`);
                console.error(`Asset: ${res.value.value.toString("utf8")}`);
            }
        }

        if (res.done) {
            await iterator.close();
            iterator_flag = false;
            console.log("iterator finished fetching results");
        }
    }
}

class Feedback extends Contract {

    /**
     * Initializes the ledger.
     * @param {Context} ctx - context object to interact with the world state
     * @returns {Promise<void>} a Promise that resolves when the ledger is completely initialized
     */
    async initLedger(ctx) {
        console.info("=============== START : initLedger ===============");

        // fetch all iterators asynchronously at the same time
        const [
            faculty_iterator,
            requests_iterator,
            student_iterator,
            university_iterator,
        ] = await Promise.all([
            ctx.stub.getStateByPartialCompositeKey(FACULTY_KEY_IDENTIFIER, []),
            ctx.stub.getStateByPartialCompositeKey(REQUEST_KEY_IDENTIFIER, []),
            ctx.stub.getStateByPartialCompositeKey(STUDENT_KEY_IDENTIFIER, []),
            ctx.stub.getStateByPartialCompositeKey(UNIVERSITY_KEY_IDENTIFIER, [
                "1",
                ADMIN_EMAIL,
            ]),
        ]);
        console.log("iterators fetched");

        // wait for all iterators to resolve
        await Promise.all([
            resolveIterator(faculty_iterator),
            resolveIterator(requests_iterator),
            resolveIterator(student_iterator),
            resolveIterator(university_iterator),
        ]);

        if (!users.university) {
            console.log("creating university asset");
            const key = ctx.stub.createCompositeKey(UNIVERSITY_KEY_IDENTIFIER, [
                "1",
                ADMIN_EMAIL,
            ]);
            console.log(`key: ${key}`);

            const ashoka = {
                ashoka_id: "0000000000",
                email: ADMIN_EMAIL,
                name: "ashoka",
                password: crypto
                    .createHash(HASH)
                    .update("admin")
                    .digest(HASH_ENCODING),
                type: UNIVERSITY_TYPE,
                verified: true,
            };
            console.log(`ashoka asset: ${JSON.stringify(ashoka, null, 2)}`);
            await ctx.stub.putState(key, Buffer.from(JSON.stringify(ashoka)));
            users.university = true;
            console.log("university asset created");
        }

        console.info("=============== END : initLedger ===============");
    }

    /**
     * Registers a user of student or faculty type.
     * @param {Context} ctx - context object to interact with the world state
     * @param {string} name - the name of the user
     * @param {string} email - the email of the user
     * @param {string} ashoka_id - the Ashoka ID of the user
     * @param {string} password - the hashed password for the user
     * @param {string} user_type - the type of the user: student | faculty
     * @returns {Promise<Buffer>} - a success or failure message confirming the status of registration
     */
    async registerUser(ctx, name, email, ashoka_id, password, user_type) {
        console.info("=============== START : registerUser ===============");
        let key = "";
        const identifier = crypto
                .createHash(HASH)
                .update(email)
                .digest(HASH_ENCODING),
            ret = {message: FAILURE_MSG};
        console.log(`function arguments: name: ${name}, email: ${email}, ashoka_id: ${ashoka_id}, password: ${password}, user_type: ${user_type}`);

        switch (user_type){
        case FACULTY_TYPE:
            ++facultyCounter;
            key = ctx.stub.createCompositeKey(FACULTY_KEY_IDENTIFIER, [
                facultyCounter.toString(),
                email,
            ]);
            if (Object.hasOwn(users.faculties, identifier)) {
                ret.error= "faculty already exists";
                console.error(ret.error);
                return Buffer.from(JSON.stringify(ret));
            }

            // add faculty identifier to global list of faculties
            users.faculties[identifier] = true;
            break;

        case STUDENT_TYPE:
            ++studentCounter;
            key = ctx.stub.createCompositeKey(STUDENT_KEY_IDENTIFIER, [
                studentCounter.toString(),
                email,
            ]);
            if (Object.hasOwn(users.students, identifier)) {
                ret.error= "student already exists";
                console.error(ret.error);
                return Buffer.from(JSON.stringify(ret));
            }

            // add student identifier to global list of students
            users.students[identifier] = true;
            break;

        default:
            ret.error= `invalid user type: ${user_type}`;
            console.error(ret.error);
            return Buffer.from(JSON.stringify(ret));
        }

        // create the user asset object
        const user = {
            ashoka_id,
            email,
            name,
            password: crypto
                .createHash(HASH)
                .update(password)
                .digest(HASH_ENCODING),
            type: user_type,
            verified: false,
        };
        console.log(`user asset: ${JSON.stringify(user), null, 2}`);
        console.log(`key: ${key}`);
        // add user to the ledger
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(user)));
        ret.message = SUCCESS_MSG;

        console.info("=============== END : registerUser ===============");
        return Buffer.from(JSON.stringify(ret));
    }

    /**
     * Adds a new request to the system.
     * @param {Context} ctx - context object to interact with the world state
     * @param {string} description - the description of the request
     * @param {string} user_type - the type of the user making the request
     * @returns {Promise<Buffer>} - a success or failure message confirming the status of the request
     */
    async addRequest(ctx, description, user_type) {
        console.info("=============== START : addRequest ===============");
        let required_confirmations = 0;
        const ret = {message: FAILURE_MSG};
        console.log(`function arguments: description: ${description}, user_type: ${user_type}`);

        ++requestCounter;
        const key = ctx.stub.createCompositeKey(REQUEST_KEY_IDENTIFIER, [
            requestCounter,
            user_type,
        ]);
        console.log(`key: ${key}`);

        switch (user_type){
        case FACULTY_TYPE:
            required_confirmations = Math.ceil(facultyCounter/2);
            break;

        case STUDENT_TYPE:
            required_confirmations = Math.ceil(studentCounter/2);
            break;

        default:
            ret.error = `unknown user type: ${user_type}`;
            console.error(ret.error);
            return Buffer.from(JSON.stringify(ret));
        }

        const now = new Date().getTime(),
            // create a new request asset
            request = {
                confirmations: 0,
                confirmed: false,
                confirmed_by: {},
                created_at: now,
                description,
                key,
                required_confirmations,
                status: NOT_STARTED,
                type: REQUEST_TYPE,
                university_notes: "",
                update_type: CREATION,
                updated_at: now,
                user_type,
            };
        console.log(`request asset: ${JSON.stringify(request), null, 2}`);

        await ctx.stub.putState(key, Buffer.from(JSON.stringify(request)));
        ret.message = SUCCESS_MSG;
        console.info("=============== END : addFeedback ===============");
        return Buffer.from(JSON.stringify(ret));
    }

    /**
     * Retrieves the required requests by the given user type.
     * @param {Context} ctx - context object to interact with the world state
     * @param {string} user_type - The type of user.
     * @param {boolean} confirmed - To indicate if confirmed or unconfirmed requests are to be queried.
     * @returns {Promise<Buffer>} - The queried feedbacks in JSON format.
     */
    async queryRequests(ctx, user_type, confirmed) {
        console.info("=============== START : queryRequests ===============");
        console.log(`function arguments: user_type: ${user_type}, confirmed: ${confirmed}`);

        let iterator_flag = true;
        const ret = {message: FAILURE_MSG, response: []};

        if (![
            FACULTY_TYPE,
            STUDENT_TYPE,
        ].includes(user_type)){
            ret.error = `invalid user type: ${user_type}`;
            console.error(ret.error);
            return Buffer.from(JSON.stringify(ret));
        }

        const iterator = await ctx.stub.getStateByPartialCompositeKey(REQUEST_KEY_IDENTIFIER, [user_type]);

        while (iterator_flag) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                try {
                    const request = JSON.parse(res.value.value.toString("utf8"));
                    console.log(`request: ${JSON.stringify(request), null, 2}`);
                    if (request.confirmed === confirmed) {
                        ret.response.push(request);
                    }
                } catch (err) {
                    console.error(err);
                    console.error(res.value.value.toString("utf8"));
                }
            }
            if (res.done) {
                ret.message = SUCCESS_MSG;
                await iterator.close();
                iterator_flag = false;
            }
        }

        console.info("=============== END : queryRequests ===============");
        return Buffer.from(JSON.stringify(ret));
    }

    /**
     * Confirm the request for a given request ID.
     * @param {Context} ctx - context object to interact with the world state
     * @param {string} key - The request key.
     * @param {string} email - The email of the user.
     * @returns {Promise<Buffer>} a promise that resolves after feedback is updated giving indication of success or failure of the operation.
     */
    async confirmRequest(ctx, key, email) {
        console.info("=============== START : confirmRequest ===============");
        console.log(`function arguments: key: ${key}, email: ${email}`);
        const identifier = crypto
                .createHash(HASH)
                .update(email)
                .digest(HASH_ENCODING),
            ret = {message: FAILURE_MSG};

        // retrieve the request from the ledger
        const requestAsBytes = await ctx.stub.getState(key);
        if (!requestAsBytes || requestAsBytes.length === 0) {
            ret.error = `Request with ID ${key} does not exist.`;
            console.error(ret.error);
            return Buffer.from(JSON.stringify(ret));
        }
        const request = JSON.parse(requestAsBytes.toString());
        console.log(`request: ${JSON.stringify(request), null, 2}`);

        // check if user has already confirmed
        if (Object.hasOwn(request.confirmed_by, identifier)) {
            ret.error = "User has already confirmed this feedback.";
            console.error(ret.error);
            return Buffer.from(JSON.stringify(ret));
        }

        // add confirmation
        request.confirmed_by[identifier] = true;
        ++request.confirmations;
        request.update_type = CONFIRMATION;
        if (request.confirmations === request.required_confirmations){
            request.confirmed = true;
            request.update_type = CONFIRMED;
            console.log(`request confirmed at ${request.confirmations}. required: ${request.required_confirmations}`);
        }
        request.updated_at = new Date().getTime();

        // update request in the ledger
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(request)));
        ret.message = SUCCESS_MSG;
        console.info("=============== END : confirmRequest ===============");
        return Buffer.from(JSON.stringify(ret));
    }

    /**
     * Updates a request.
     * @param {Context} ctx - context object to interact with the world state
     * @param {string} key - The request key.
     * @param {string} notes - The notes for the request.
     * @param {string} status - The status of the request.
     * @returns {Promise<Buffer>} a promise that resolves after feedback is updated giving indication of success or failure of the operation.
     */
    async updateRequest(ctx, key, notes, status) {
        console.info("=============== START : updateRequest ===============");
        console.log(`function arguments: key: ${key}, notes: ${notes}, status: ${status}`);
        const requestAsBytes = await ctx.stub.getState(key),
            ret = {message: FAILURE_MSG};

        if (!requestAsBytes || requestAsBytes.length === 0) {
            ret.error = `Request with ID ${key} does not exist.`;
            console.error(ret.error);
            return Buffer.from(JSON.stringify(ret));
        }
        const request = JSON.parse(requestAsBytes.toString());
        console.log(`original request: ${JSON.stringify(request), null, 2}`);

        if (notes !== "")
            request.university_notes = notes;

        if (status === ""){
            ret.error = "Status cannot be empty.";
            ret.message = FAILURE_MSG;
            console.error(ret.error);
            return Buffer.from(JSON.stringify(ret));
        }
        if (![
            IN_PROGRESS,
            ON_HOLD,
            IMPLEMENTED,
            DROPPED,
        ].includes(status)){
            ret.error = `Invalid status: ${status}`;
            console.error(ret.error);
            return Buffer.from(JSON.stringify(ret));
        }

        request.status = status;
        request.update_type = STATUS;
        request.updated_at = new Date().getTime();
        console.log(`updated request: ${JSON.stringify(request), null, 2}`);

        await ctx.stub.putState(key, Buffer.from(JSON.stringify(request)));
        ret.message = SUCCESS_MSG;
        console.info("=============== END : updateRequest ===============");
        return Buffer.from(JSON.stringify(ret));
    }

    /**
     * Retrieves the history for a given request ID.
     * @param {Context} ctx - context object to interact with the world state
     * @param {string} key - The request key.
     * @returns {Promise<Buffer>} A promise that resolves with the request history.
     */
    async queryRequestHistory(ctx, key) {
        console.info("=============== START : queryRequestHistory ===============");
        console.log(`function arguments: key: ${key}`);
        const iterator = await ctx.stub.getHistoryForKey(key),
            ret = {message: FAILURE_MSG, response: []};
        let iterator_flag = true;

        while (iterator_flag) {
            const res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                try {
                    const request = JSON.parse(res.value.value.toString("utf8"));
                    console.log(`request: ${JSON.stringify(request), null, 2}`);
                    if (request.update_type !== CONFIRMATION) // filter out confirmation updates
                        ret.response.unshift(request); // have a list starting from oldest to latest update
                } catch (err) {
                    console.error(err);
                    console.error(res.value.value.toString("utf8"));
                }
            }

            if (res.done) {
                ret.message = SUCCESS_MSG;
                await iterator.close();
                iterator_flag = false;
            }
        }

        console.info("=============== END : queryRequestHistory ===============");
        return Buffer.from(JSON.stringify(ret));
    }

    /**
     * Validates the given user asset.
     * @param {Context} ctx - context object to interact with the world state
     * @param {string} user_type - The user type.
     * @param {string} email - The user email id.
     * @returns {Promise<Buffer>} A promise that resolves with the request history.
     */
    async validateUser(ctx, user_type, email){
        console.info("=============== START : validateUser ===============");
        console.log(`function arguments: user_type: ${user_type}, email: ${email}`);
        let iterator_flag = true,
            key = "",
            user = {};
        const ret = {message: FAILURE_MSG};

        if (![
            FACULTY_TYPE,
            STUDENT_TYPE,
        ].includes(user_type)){
            ret.error = `invalid user type: ${user_type}`;
            console.error(ret.error);
            return Buffer.from(JSON.stringify(ret));
        }
        const objectType = user_type === FACULTY_TYPE ? FACULTY_KEY_IDENTIFIER : STUDENT_KEY_IDENTIFIER;
        const iterator = await ctx.stub.getStateByPartialCompositeKey(objectType, [email]);

        while (iterator_flag) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                try {
                    const u = JSON.parse(res.value.value.toString("utf8"));
                    console.log(`user: ${JSON.stringify(u), null, 2}`);
                    if (u.email === email){
                        key = res.value.key;
                        user = u;
                    }
                } catch (err) {
                    console.error(err);
                    console.error(res.value.value.toString("utf8"));
                }
            }
            if (res.done) {
                ret.message = SUCCESS_MSG;
                await iterator.close();
                iterator_flag = false;
            }
        }

        user.verified = true;
        console.log(`verified user: ${JSON.stringify(user), null, 2}`);
        console.log(`user key: ${key}`);

        await ctx.stub.putState(key, Buffer.from(JSON.stringify(user)));
        console.info("=============== END : validateUser ===============");
        return Buffer.from(JSON.stringify(ret));
    }

    /**
     * Retrieves the user asset for the given email id and verifies if password is correct.
     * @param {Context} ctx - context object to interact with the world state
     * @param {string} user_type - the type of the user
     * @param {string} email - The email of the user to retrieve.
     * @param {string} password - the password entered by the user
     * @returns {Promise<Buffer>} A promise that resolves with a success message and user object if credentials are correct.
     */
    async loginUser(ctx, user_type, email, password) {
        console.info("=============== START : loginUser ===============");
        console.log(`function arguments: user_type: ${user_type}, email: ${email}, password: ${password}`);
        const ret = {message: FAILURE_MSG, response: {}};
        let iterator_flag = true;

        if (![
            FACULTY_TYPE,
            STUDENT_TYPE,
            UNIVERSITY_TYPE,
        ].includes(user_type)){
            ret.error = `invalid user type: ${user_type}`;
            console.error(ret.error);
            return Buffer.from(JSON.stringify(ret));
        }
        const objectType = user_type === FACULTY_TYPE ? FACULTY_KEY_IDENTIFIER : user_type === UNIVERSITY_TYPE ? UNIVERSITY_KEY_IDENTIFIER : STUDENT_KEY_IDENTIFIER;
        const iterator = await ctx.stub.getStateByPartialCompositeKey(objectType, [email]);

        while (iterator_flag) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                try {
                    // TODO: check if user verified
                    const user = JSON.parse(res.value.value.toString("utf8"));
                    console.log(`user: ${JSON.stringify(user), null, 2}`);
                    if (user.email === email &&
                        user.password === crypto
                            .createHash(HASH)
                            .update(password)
                            .digest(HASH_ENCODING))
                        ret.response = user;
                } catch (err) {
                    console.error(err);
                    console.error(res.value.value.toString("utf8"));
                }
            }

            if (res.done) {
                ret.message = SUCCESS_MSG;
                await iterator.close();
                iterator_flag = false;
            }
        }

        if (Object.keys(ret.response).length === 0) {
            ret.message = FAILURE_MSG;
            ret.error = "invalid credentials";
            console.error(ret.error);
            return Buffer.from(JSON.stringify(ret));
        }
        if (!ret.response.verified) {
            ret.message = FAILURE_MSG;
            ret.error = "user not verified";
            console.error(ret.error);
            return Buffer.from(JSON.stringify(ret));
        }

        console.info("=============== END : loginUser ===============");
        return Buffer.from(JSON.stringify(ret));
    }

    /**
     * Queries unverified users based on the given user type.
     * @param {Context} ctx - The context object.
     * @param {string} user_type - The type of user to query (faculty, student, or university).
     * @returns {Promise<Buffer>} The serialized JSON object containing the query result.
     */
    async queryUnverifiedUsers(ctx, user_type){
        console.info("=============== START : queryUnverifiedUsers ===============");
        console.log(`function arguments: user_type: ${user_type}`);
        const ret = {message: FAILURE_MSG, response: []};
        let iterator_flag = true;

        if (![
            FACULTY_TYPE,
            STUDENT_TYPE,
        ].includes(user_type)){
            ret.error = `invalid user type: ${user_type}`;
            console.error(ret.error);
            return Buffer.from(JSON.stringify(ret));
        }
        const objectType = user_type === FACULTY_TYPE ? FACULTY_KEY_IDENTIFIER : STUDENT_KEY_IDENTIFIER;
        const iterator = await ctx.stub.getStateByPartialCompositeKey(objectType, []);

        while (iterator_flag) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                try {
                    const user = JSON.parse(res.value.value.toString("utf8"));
                    console.log(`user: ${JSON.stringify(user), null, 2}`);
                    if (user.verified === false)
                        ret.response.push(user);
                } catch (err) {
                    console.error(err);
                    console.error(res.value.value.toString("utf8"));
                }
            }

            if (res.done) {
                ret.message = SUCCESS_MSG;
                await iterator.close();
                iterator_flag = false;
            }
        }

        console.info("=============== END : queryUnverifiedUsers ===============");
        return Buffer.from(JSON.stringify(ret));
    }

    /**
     * Deletes a user.
     * @param {Context} ctx - The context object.
     * @param {string} user_type - The type of user.
     * @param {string} user_email - The email of the user.
     * @returns {Promise<Buffer>} ret - The result object containing the message.
     */
    async deleteUser(ctx, user_type, user_email){
        console.info("=============== START : deleteUser ===============");
        console.log(`function arguments: user_type: ${user_type}, user_email: ${user_email}`);
        const ret = {message: FAILURE_MSG};
        let iterator_flag = true;

        if (![
            FACULTY_TYPE,
            STUDENT_TYPE,
        ].includes(user_type)){
            ret.error = `invalid user type: ${user_type}`;
            console.error(ret.error);
            return Buffer.from(JSON.stringify(ret));
        }
        const objectType = user_type === FACULTY_TYPE ? FACULTY_KEY_IDENTIFIER : STUDENT_KEY_IDENTIFIER;
        const iterator = await ctx.stub.getStateByPartialCompositeKey(objectType, [user_email]);

        while (iterator_flag) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                try {
                    const user = JSON.parse(res.value.value.toString("utf8"));
                    console.log(`user: ${JSON.stringify(user), null, 2}`);
                    if (user.email === user_email)
                        await ctx.stub.deleteState(res.value.key);
                } catch (err) {
                    console.error(err);
                    console.error(res.value.value.toString("utf8"));
                }
            }

            if (res.done) {
                ret.message = SUCCESS_MSG;
                await iterator.close();
                iterator_flag = false;
            }
        }

        console.info("=============== END : deleteUser ===============");
        return Buffer.from(JSON.stringify(ret));
    }
}

module.exports = Feedback;
