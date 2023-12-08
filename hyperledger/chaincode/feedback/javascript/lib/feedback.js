/* eslint-disable @stylistic/js/max-len */
/*
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

const {Contract, Context} = require("fabric-contract-api"),
    {Iterators} = require("fabric-shim"),
    {UNIVERSITY_TYPE, STUDENT_KEY_IDENTIFIER, START_KEY, END_KEY, FACULTY_KEY_IDENTIFIER, STUDENT_TYPE, FACULTY_TYPE, SUCCESS_MSG, FAILURE_MSG, REQUEST_KEY_IDENTIFIER, NOT_STARTED, UNIVERSITY_KEY_IDENTIFIER, HASH, HASH_ENCODING, CREATION, CONFIRMATION, STATUS, CONFIRMED} = require("../utils/constants"),
    ClientIdentity = require("fabric-shim").ClientIdentity,
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

                switch (asset.asset_id[0]){
                case STUDENT_KEY_IDENTIFIER:
                    var identifier = crypto
                        .createHash(HASH)
                        .update(asset.email)
                        .digest(HASH_ENCODING);

                    ++studentCounter;
                    users.students[identifier] = true;
                    break;

                case FACULTY_KEY_IDENTIFIER:
                    identifier = crypto
                        .createHash(HASH)
                        .update(asset.email)
                        .digest(HASH_ENCODING);

                    ++facultyCounter;
                    users.faculties[identifier] = true;
                    break;

                case REQUEST_KEY_IDENTIFIER:
                    ++requestCounter;
                    break;

                case UNIVERSITY_KEY_IDENTIFIER:
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
        const cid = new ClientIdentity(ctx.stub),
            id = cid.getID();

        // fetch all iterators asynchronously at the same time
        const [
            faculty_iterator,
            requests_iterator,
            student_iterator,
            university_iterator,
        ] = await Promise.all([
            ctx.stub.getStateByRange(FACULTY_KEY_IDENTIFIER+START_KEY, FACULTY_KEY_IDENTIFIER+END_KEY),
            ctx.stub.getStateByRange(REQUEST_KEY_IDENTIFIER+START_KEY, REQUEST_KEY_IDENTIFIER+END_KEY),
            ctx.stub.getStateByRange(STUDENT_KEY_IDENTIFIER+START_KEY, STUDENT_KEY_IDENTIFIER+END_KEY),
            ctx.stub.getStateByRange(UNIVERSITY_KEY_IDENTIFIER+START_KEY, UNIVERSITY_KEY_IDENTIFIER+END_KEY),
        ]);
        console.log("iterators fetched");

        // wait for all iterators to resolve
        await Promise.all([
            resolveIterator(faculty_iterator),
            resolveIterator(requests_iterator),
            resolveIterator(student_iterator),
            resolveIterator(university_iterator),
        ]);
        console.log("iterators resolved");

        if (!users.university) {
            console.log("creating university asset");
            const asset_id = UNIVERSITY_KEY_IDENTIFIER+1;
            const ashoka = {
                ashoka_id: "0000000000",
                asset_id,
                email: "admin@ashoka.edu.in",
                id,
                name: "ashoka",
                password: crypto
                    .createHash(HASH)
                    .update("admin")
                    .digest(HASH_ENCODING),
                type: UNIVERSITY_TYPE,
                verified: true,
            };
            await ctx.stub.putState(asset_id, Buffer.from(JSON.stringify(ashoka)));
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
     * @param {string} type - the type of the user: student | faculty
     * @returns {Promise<Buffer>} - a success or failure message confirming the status of registration
     */
    async registerUser(ctx, name, email, ashoka_id, password, type) {
        console.info("=============== START : registerUser ===============");
        let asset_id,
            cid = new ClientIdentity(ctx.stub),
            id = cid.getID(),
            ret = {};
        const identifier = crypto
            .createHash(HASH)
            .update(email)
            .digest(HASH_ENCODING);

        switch (type){
        case FACULTY_TYPE:
            ++facultyCounter;
            asset_id = FACULTY_KEY_IDENTIFIER + facultyCounter;
            if (Object.hasOwn(users.faculties, identifier)) {
                console.error("faculty already exists");
                ret = {
                    error: "faculty already exists",
                    message: FAILURE_MSG,
                };
                return Buffer.from(JSON.stringify(ret));
            }

            // add faculty identifier to global list of faculties
            users.faculties[identifier] = true;
            break;

        case STUDENT_TYPE:
            ++studentCounter;
            asset_id = STUDENT_KEY_IDENTIFIER + studentCounter;
            if (Object.hasOwn(users.students, identifier)) {
                console.error("student already exists");
                ret = {
                    error: "student already exists",
                    message: FAILURE_MSG,
                };
                return Buffer.from(JSON.stringify(ret));
            }

            // add student identifier to global list of students
            users.students[identifier] = true;
            break;

        default:
            console.error(`unknown user type: ${type}`);
            ret = {
                error: `unknown user type: ${type}`,
                message: FAILURE_MSG,
            };
            return Buffer.from(JSON.stringify(ret));
        }

        // create the user asset object
        const user = {
            ashoka_id,
            asset_id,
            email,
            id,
            name,
            password: crypto
                .createHash(HASH)
                .update(password)
                .digest(HASH_ENCODING),
            type,
            verified: false,
        };

        // add user to the ledger
        await ctx.stub.putState(asset_id, Buffer.from(JSON.stringify(user)));
        ret = {
            message: SUCCESS_MSG,
        };

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

        let cid = new ClientIdentity(ctx.stub),
            id = cid.getID(),
            required_confirmations = 0,
            ret = {};

        ++requestCounter;
        const asset_id = REQUEST_KEY_IDENTIFIER + requestCounter;

        switch (user_type){
        case FACULTY_TYPE:
            required_confirmations = Math.ceil(facultyCounter/2);
            break;

        case STUDENT_TYPE:
            required_confirmations = Math.ceil(studentCounter/2);
            break;

        default:
            console.error(`unknown user type: ${user_type}`);
            ret = {
                error: `unknown user type: ${user_type}`,
                message: FAILURE_MSG,
            };
            return Buffer.from(JSON.stringify(ret));
        }

        // create a new request asset
        const feedback = {
            admin_notes: "",
            asset_id,
            confirmations: 0,
            confirmed: false,
            confirmed_by: [],
            description,
            id,
            required_confirmations,
            status: NOT_STARTED,
            update_type: CREATION,
            updated_at: new Date().getTime(),
            user_type,
        };

        await ctx.stub.putState(asset_id, Buffer.from(JSON.stringify(feedback)));
        ret = {
            message: SUCCESS_MSG,
        };
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

        let end = "",
            iterator_flag = true,
            requests = [],
            ret = {},
            start = "";

        switch (user_type){
        case FACULTY_TYPE:
            start = FACULTY_KEY_IDENTIFIER+START_KEY;
            end = FACULTY_KEY_IDENTIFIER+END_KEY;
            break;

        case STUDENT_TYPE:
            start = STUDENT_KEY_IDENTIFIER+START_KEY;
            end = STUDENT_KEY_IDENTIFIER+END_KEY;
            break;

        default:
            console.error(`unknown user type: ${user_type}`);
            ret = {
                error: `unknown user type: ${user_type}`,
                message: FAILURE_MSG,
            };
            return Buffer.from(JSON.stringify(ret));
        }

        const iterator = await ctx.stub.getStateByRange(start, end);

        while (iterator_flag) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                try {
                    const request = JSON.parse(res.value.value.toString("utf8"));
                    if (request.user_type == user_type && request.confirmed == confirmed) {
                        requests.push(request);
                    }
                } catch (err) {
                    console.error(err);
                    console.error(res.value.value.toString("utf8"));
                }
            }
            if (res.done) {
                await iterator.close();
                iterator_flag = false;
            }
        }

        console.info("=============== END : queryRequests ===============");
        return Buffer.from(JSON.stringify(requests));
    }

    /**
     * Confirm the request for a given request ID.
     * @param {Context} ctx - context object to interact with the world state
     * @param {string} requestID - The asset ID of the request.
     * @param {string} email - The email of the user.
     * @param {string} name - The name of the user.
     * @returns {Promise<Buffer>} a promise that resolves after feedback is updated giving indication of success or failure of the operation.
     */
    async confirmRequest(ctx, requestID, email) {
        console.info("=============== START : confirmRequest ===============");
        const identifier = crypto
            .createHash(HASH)
            .update(email)
            .digest(HASH_ENCODING);
        let ret = {};

        // retrieve the request from the ledger
        const requestAsBytes = await ctx.stub.getState(requestID);
        if (!requestAsBytes || requestAsBytes.length === 0) {
            console.error(`Request with ID ${requestID} does not exist.`);
            ret = {
                error: `Request with ID ${requestID} does not exist.`,
                message: FAILURE_MSG,
            };
            return Buffer.from(JSON.stringify(ret));
        }
        const request = JSON.parse(requestAsBytes.toString());

        // check if user has already confirmed
        if (Object.hasOwn(request.confirmedBy, identifier)) {
            console.error("User has already confirmed this feedback.");
            ret = {
                error: "User has already confirmed this feedback.",
                message: FAILURE_MSG,
            };
            return Buffer.from(JSON.stringify(ret));
        }

        // add confirmation
        request.confirmedBy[identifier] = true;
        ++request.confirmations;
        request.update_type = CONFIRMATION;
        if (request.confirmations === request.required_confirmations){
            request.confirmed = true;
            request.update_type = CONFIRMED;
            console.log(`request confirmed at ${request.confirmations}. required: ${request.required_confirmations}`);
        }
        request.updated_at = new Date().getTime();

        // update request in the ledger
        await ctx.stub.putState(requestID, Buffer.from(JSON.stringify(request)));
        ret = {
            message: SUCCESS_MSG,
        };
        console.info("=============== END : confirmRequest ===============");
        return Buffer.from(JSON.stringify(ret));
    }

    /**
     * Updates a request.
     * @param {Context} ctx - context object to interact with the world state
     * @param {string} requestID - The asset ID of the request to update.
     * @param {string} notes - The notes for the request.
     * @param {string} status - The status of the request.
     * @returns {Promise<Buffer>} a promise that resolves after feedback is updated giving indication of success or failure of the operation.
     */
    async updateRequest(ctx, requestID, notes, status) {
        console.info("=============== START : updateRequest ===============");
        let ret = {};

        const requestAsBytes = await ctx.stub.getState(requestID);
        if (!requestAsBytes || requestAsBytes.length === 0) {
            console.error(`Request with ID ${requestID} does not exist.`);
            ret = {
                error: `Request with ID ${requestID} does not exist.`,
                message: FAILURE_MSG,
            };
            return Buffer.from(JSON.stringify(ret));
        }
        const request = JSON.parse(requestAsBytes.toString());

        if (notes !== "")
            request.admin_notes = notes;

        if (status === ""){
            console.error("Status needs to be updated.");
            ret = {
                error: "Status needs to be updated.",
                message: FAILURE_MSG,
            };
            return Buffer.from(JSON.stringify(ret));
        }

        request.status = status;
        request.update_type = STATUS;
        request.updated_at = new Date().getTime();

        await ctx.stub.putState(requestID, Buffer.from(JSON.stringify(request)));
        ret = {
            message: SUCCESS_MSG,
        };
        console.info("=============== END : updateRequest ===============");
        return Buffer.from(JSON.stringify(ret));
    }

    /**
     * Retrieves the history for a given request ID.
     * @param {Context} ctx - context object to interact with the world state
     * @param {string} requestID - The ID of the request to retrieve history for.
     * @returns {Promise<Buffer>} A promise that resolves with the request history.
     */
    async queryRequestHistory(ctx, requestID) {
        console.info("=============== START : queryRequestHistory ===============");

        const iterator = await ctx.stub.getHistoryForKey(requestID);
        let iterator_flag = true,
            requests = [];

        while (iterator_flag) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                try {
                    const request = JSON.parse(res.value.value.toString("utf8"));
                    if (request.update_type !== CONFIRMATION) // filter out confirmation updates
                        requests.unshift(request); // have a list starting from oldest to latest update
                } catch (err) {
                    console.error(err);
                    console.error(res.value.value.toString("utf8"));
                }
            }

            if (res.done) {
                await iterator.close();
                iterator_flag = false;
            }
        }

        console.info("=============== END : queryRequestHistory ===============");
        return Buffer.from(JSON.stringify(requests));
    }
}

module.exports = Feedback;
