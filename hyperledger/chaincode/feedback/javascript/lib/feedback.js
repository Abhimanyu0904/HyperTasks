/* eslint-disable @stylistic/js/max-len */
/*
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

const {Contract, Context} = require("fabric-contract-api"),
    {Iterators} = require("fabric-shim"),
    {STUDENT_KEY_IDENTIFIER, START_KEY, END_KEY, FACULTY_KEY_IDENTIFIER, ADMIN_KEY_IDENTIFIER, STUDENT_TYPE, FACULTY_TYPE, ADMIN_TYPE, SUCCESS_MSG, FAILURE_MSG, FEEDBACK_KEY_IDENTIFIER} = require("../utils/constants"),
    ClientIdentity = require("fabric-shim").ClientIdentity;

// global variables
let faculties = [],
    facultyCounter = 0,
    feedbackCounter = 0,
    feedbackID,
    studentCounter = 0,
    students = [];

/**
 * Resolves an iterator by gathering all the iterator results and performing certain actions.
 * @param {Iterators.StateQueryIterator} iterator - The iterator to be resolved.
 * @returns {Promise<void>} a promise that is resolved when the iterator fetches all results.
 */
async function resolveUserIterator(iterator){
    let iterator_flag = true;
    while (iterator_flag) {
        const res = await iterator.next();

        if (res.value && res.value.value.toString()) {
            try {
                const user = JSON.parse(res.value.value.toString("utf8"));
                switch (user.type){
                case STUDENT_TYPE:
                    students.push(user.name);
                    ++studentCounter;
                    break;

                case FACULTY_TYPE:
                    faculties.push(user.name);
                    ++facultyCounter;
                    break;

                case ADMIN_TYPE:
                    admins.push(user.name);
                    ++adminCounter;
                    break;

                default:
                    console.log(`unknown user type: ${user.type}`);
                }
            } catch (err) {
                console.log(`${err}`);
            }
        }

        if (res.done) {
            await iterator.close();
            iterator_flag = false;
            console.log("Iterator finished fetching results");
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
        console.info("============= START : Initialize Ledger ===========");

        // fetch all iterators asynchronously at the same time
        const [
            admin_iterator,
            faculty_iterator,
            student_iterator,
        ] = await Promise.all([
            ctx.stub.getStateByRange(ADMIN_KEY_IDENTIFIER+START_KEY, ADMIN_KEY_IDENTIFIER+END_KEY),
            ctx.stub.getStateByRange(FACULTY_KEY_IDENTIFIER+START_KEY, FACULTY_KEY_IDENTIFIER+END_KEY),
            ctx.stub.getStateByRange(STUDENT_KEY_IDENTIFIER+START_KEY, STUDENT_KEY_IDENTIFIER+END_KEY),
        ]);

        // resolve all iterators asynchronously
        await Promise.all([
            resolveUserIterator(admin_iterator),
            resolveUserIterator(faculty_iterator),
            resolveUserIterator(student_iterator),
        ]);

        console.info("============= END : Initialize Ledger ===========");
    }

    /**
     * Registers a user of student or faculty type.
     * @param {Context} ctx - context object to interact with the world state
     * @param {string} name - the name of the user
     * @param {string} email - the email of the user
     * @param {string} ashoka_id - the Ashoka ID of the user
     * @param ashoka_id
     * @param {string} password - the hashed password for the user
     * @param {string} type - the type of the user: student | faculty
     * @returns {Promise<Buffer>} - a success or failure message confirming the status of registration
     */
    async registerUser(ctx, name, email, ashoka_id, password, type) {
        console.info("=============== START : registerUser ===============");

        let asset_id,
            cid = new ClientIdentity(ctx.stub),
            id = cid.getID();

        switch (type){
        case FACULTY_TYPE:
            ++facultyCounter;
            asset_id = FACULTY_KEY_IDENTIFIER + facultyCounter;
            if (faculties.includes(name)) {
                console.log("faculty already exists");
                return FAILURE_MSG;
            }
            // add faculty name to global list of faculties
            faculties.push(name);
            break;

        case STUDENT_TYPE:
            ++studentCounter;
            asset_id = STUDENT_KEY_IDENTIFIER + studentCounter;
            if (students.includes(name)) {
                console.log("student already exists");
                return FAILURE_MSG;
            }
            // add student name to global list of students
            students.push(name);
            break;

        default:
            console.log(`unknown user type: ${type}`);
            return FAILURE_MSG;
        }

        // create the user asset object
        const user = {
            ashoka_id,
            asset_id,
            email,
            id,
            name,
            password,
            type,
            verified: false,
        };

        // add user to the ledger
        await ctx.stub.putState(asset_id, Buffer.from(JSON.stringify(user)));
        console.info("============= END : registerStudent ===========");

        return Buffer.from(SUCCESS_MSG);
    }

    async addFeedback(ctx, content, role) {

        console.info("============= START : addFeedback ===========");
        console.log(feedbackCounter);

        let cid = new ClientIdentity(ctx.stub);
        let userID = cid.getID();

        let confirmations = 0;
        confirmations = Number(confirmations);

        feedbackCounter = Number(feedbackCounter);
        feedbackCounter += 1;
        feedbackID = FEEDBACK_KEY_IDENTIFIER + feedbackCounter;

        const confirmedBy = [];
        let isApproved = false;
        let isVisible = false;

        // Create a new feedback object and store it on the blockchain
        const feedback = {
            confirmations,
            confirmedBy,
            content,
            feedbackID,
            isApproved,
            isVisible,
            //student or faculty
            role,
            userID,
        };

        await ctx.stub.putState(feedbackID.toString(), Buffer.from(JSON.stringify(feedback)));
        console.info("============= END : addFeedback ===========");
    }

    async queryAllStudents(ctx) {
        console.info("============= START : queryAllStudents ===========");
        console.info("============= END : queryAllStudents ===========");
        return JSON.stringify(students);
    }

    async queryAllFaculty(ctx) {
        console.info("============= START : queryAllFaculty ===========");
        console.info("============= END : queryAllFaculty ===========");
        return JSON.stringify(faculties);
    }

    async queryFeedbacksByStudent(ctx) {
        console.info("============= START : queryFeedbacksByStudent ===========");

        const startKey = "F0";
        const endKey = "F99999";

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        let cid = new ClientIdentity(ctx.stub);
        let userID = cid.getID();

        const queriedFeedbacksByStudent = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                const Key = res.value.key;
                let feedback;
                try {
                    feedback = JSON.parse(res.value.value.toString("utf8"));
                    console.log(feedback);
                    if (feedback.userID === userID && feedback.role === "student") {
                        queriedFeedbacksByStudent.push({Key, feedback});
                    }
                } catch (err) {
                    console.log(err);
                    feedback = res.value.value.toString("utf8");
                }
            }
            if (res.done) {
                await iterator.close();
                console.info(queriedFeedbacksByStudent);
                console.info("============= END : queryFeedbacksByStudent ===========");
                return JSON.stringify(queriedFeedbacksByStudent);
            }
        }
    }

    async queryFeedbacksByFaculty(ctx) {
        console.info("============= START : queryFeedbacksByFaculty ===========");

        const startKey = "F0";
        const endKey = "F99999";

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        let cid = new ClientIdentity(ctx.stub);
        let userID = cid.getID();

        const queriedFeedbacksByFaculty = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                const Key = res.value.key;
                let feedback;
                try {
                    feedback = JSON.parse(res.value.value.toString("utf8"));
                    console.log(feedback);
                    if (feedback.userID === userID && feedback.role === "faculty") {
                        queriedFeedbacksByFaculty.push({Key, feedback});
                    }
                } catch (err) {
                    console.log(err);
                    feedback = res.value.value.toString("utf8");
                }
            }
            if (res.done) {
                await iterator.close();
                console.info(queriedFeedbacksByFaculty);
                console.info("============= END : queryFeedbacksByFaculty ===========");
                return JSON.stringify(queriedFeedbacksByFaculty);
            }
        }
    }

    //Can only be called by students
    async confirmStudentFeedback(ctx, feedbackID) {

        let cid = new ClientIdentity(ctx.stub);
        let userID = cid.getID();

        // Retrieve the feedback from the ledger
        const feedbackAsBytes = await ctx.stub.getState(feedbackID);
        if (!feedbackAsBytes || feedbackAsBytes.length === 0) {
            throw new Error(`Feedback with ID ${feedbackID} does not exist.`);
        }
        let feedback = JSON.parse(feedbackAsBytes.toString());

        // Check if the user has already confirmed this feedback
        if (feedback.confirmedBy.includes(userID)) {
            throw new Error(`User ${userID} has already confirmed this feedback.`);
        }

        if (feedback.role === "student"){
            // Add the user's confirmation
            feedback.confirmedBy.push(userID);
            feedback.confirmations++;
            if (Number(feedback.confirmations) === Number(students.length)/2) {
                feedback.isVisible = true;
            }
        }
        // Update the feedback in the ledger
        await ctx.stub.putState(feedbackID, Buffer.from(JSON.stringify(feedback)));

        return JSON.stringify(feedback);
    }

    //Can only be called by faculty
    async confirmFacultyFeedback(ctx, feedbackID) {

        let cid = new ClientIdentity(ctx.stub);
        let userID = cid.getID();

        // Retrieve the feedback from the ledger
        const feedbackAsBytes = await ctx.stub.getState(feedbackID);
        if (!feedbackAsBytes || feedbackAsBytes.length === 0) {
            throw new Error(`Feedback with ID ${feedbackID} does not exist.`);
        }
        let feedback = JSON.parse(feedbackAsBytes.toString());

        // Check if the user has already confirmed this feedback
        if (feedback.confirmedBy.includes(userID)) {
            throw new Error(`User ${userID} has already confirmed this feedback.`);
        }

        if (feedback.role === "faculty"){
            // Add the user's confirmation
            feedback.confirmedBy.push(userID);
            feedback.confirmations++;
            if (Number(feedback.confirmations) === Number(faculties.length)/2) {
                feedback.isVisible = true;
            }
        }
        // Update the feedback in the ledger
        await ctx.stub.putState(feedbackID, Buffer.from(JSON.stringify(feedback)));

        return JSON.stringify(feedback);
    }

    //Can only be called by students
    async queryStudentFeedbacks(ctx) {
        console.info("============= START : queryStudentFeedbacks ===========");

        const startKey = "F0";
        const endKey = "F99999";

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        const studentFeedbacks = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                const Key = res.value.key;
                let feedback;
                try {
                    feedback = JSON.parse(res.value.value.toString("utf8"));

                } catch (err) {
                    console.log(err);
                    feedback = res.value.value.toString("utf8");
                }
                if (feedback.role === "student"){
                    studentFeedbacks.push({Key, feedback});
                }
            }
            if (res.done) {
                await iterator.close();
                console.info(studentFeedbacks);
                console.info("============= END : queryStudentFeedbacks ===========");
                return JSON.stringify(studentFeedbacks);
            }
        }
    }

    //Can only be called by faculty
    async queryFacultyFeedbacks(ctx) {
        console.info("============= START : queryFacultyFeedbacks ===========");

        const startKey = "F0";
        const endKey = "F99999";

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        const facultyFeedbacks = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                const Key = res.value.key;
                let feedback;
                try {
                    feedback = JSON.parse(res.value.value.toString("utf8"));

                } catch (err) {
                    console.log(err);
                    feedback = res.value.value.toString("utf8");
                }
                if (feedback.role === "faculty"){
                    facultyFeedbacks.push({Key, feedback});
                }
            }
            if (res.done) {
                await iterator.close();
                console.info(facultyFeedbacks);
                console.info("============= END : queryFacultyFeedbacks ===========");
                return JSON.stringify(facultyFeedbacks);
            }
        }
    }

    //Can only be called by universtiyAdmin
    async queryAllFeedbacks(ctx) {
        console.info("============= START : queryAllFeedbacks ===========");

        const startKey = "F0";
        const endKey = "F99999";

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        const allFeedbacks = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                const Key = res.value.key;
                let feedback;
                try {
                    feedback = JSON.parse(res.value.value.toString("utf8"));

                } catch (err) {
                    console.log(err);
                    feedback = res.value.value.toString("utf8");
                }
                allFeedbacks.push({Key, feedback});
            }
            if (res.done) {
                await iterator.close();
                console.info(allFeedbacks);
                console.info("============= END : queryAllFeedbacks ===========");
                return JSON.stringify(allFeedbacks);
            }
        }
    }
}
module.exports = Feedback;

// async registerPurchase(ctx, outletID, item, date) {

//     let cid = new ClientIdentity(ctx.stub);
//     let userID = cid.getID();

//     //"yyyy-mm-dd"
//     const status = 'pending';
//     let dateOfPurchase;
//     if (date === "x"){
//         dateOfPurchase = new Date().toISOString().split('T')[0];
//     }
//     else{
//         dateOfPurchase = date;
//     }
//     // const dateOfPurchase = date ? date : new Date().toISOString().split('T')[0];
//     const used = false;

//     purchaseCounter = Number(purchaseCounter);
//     purchaseCounter += 1;
//     purchaseID = 'P' + purchaseCounter;
//     const purchase = {
//         purchaseID,
//         userID,
//         outletID,
//         item,
//         status,
//         dateOfPurchase,
//         used,
//     };

//     await ctx.stub.putState(purchaseID.toString(), Buffer.from(JSON.stringify(purchase)));
//     console.log(`Item ${item} purchased successfully from outlet ${outletID} on ${date}! Your Purchase ID is ${purchaseID}. Please save it`);
// }

// async queryPurchasesByOutlet(ctx, outletID) {
//     console.info('============= START : queryPurchasesByOutlet ===========');

//     const startKey = 'P0';
//     const endKey = 'P99999';

//     const iterator = await ctx.stub.getStateByRange(startKey, endKey);

//     const queriedPurchasesByOutlet = [];
//     while (true) {
//         const res = await iterator.next();

//         if (res.value && res.value.value.toString()) {
//             const Key = res.value.key;
//             let purchase;
//             try {
//                 purchase = JSON.parse(res.value.value.toString('utf8'));
//                 console.log(purchase);
//                 if (purchase.outletID === outletID) {
//                     queriedPurchasesByOutlet.push({Key, purchase});
//                 }

//             } catch (err) {
//                 console.log(err);
//                 purchase = res.value.value.toString('utf8');
//             }

//         }
//         if (res.done) {
//             await iterator.close();
//             console.info(queriedPurchasesByOutlet);
//             console.info('============= END : queryPurchasesByOutlet ===========');
//             return JSON.stringify(queriedPurchasesByOutlet);
//         }
//     }
// }

// async queryPurchasesByUser(ctx) {
//     console.info('============= START : queryPurchasesByUser ===========');

//     const startKey = 'P0';
//     const endKey = 'P99999';

//     const iterator = await ctx.stub.getStateByRange(startKey, endKey);

//     let cid = new ClientIdentity(ctx.stub);
//     let userID = cid.getID();

//     const queriedPurchasesByUser = [];
//     while (true) {
//         const res = await iterator.next();

//         if (res.value && res.value.value.toString()) {
//             const Key = res.value.key;
//             let purchase;
//             try {
//                 purchase = JSON.parse(res.value.value.toString('utf8'));
//                 console.log(purchase);
//                 if (purchase.userID === userID) {
//                     queriedPurchasesByUser.push({Key, purchase});
//                 }
//             } catch (err) {
//                 console.log(err);
//                 purchase = res.value.value.toString('utf8');
//             }
//         }
//         if (res.done) {
//             await iterator.close();
//             console.info(queriedPurchasesByUser);
//             console.info('============= END : queryPurchasesByUser ===========');
//             return JSON.stringify(queriedPurchasesByUser);
//         }
//     }
// }

// Validate a purchase by an outlet
// async validatePurchase(ctx, purchaseID, outletID) {
//     const purchaseAsBytes = await ctx.stub.getState(purchaseID);
//     const purchase = JSON.parse(purchaseAsBytes.toString());
//     if (!purchase) {
//         throw new Error(`Purchase ${purchaseID} does not exist`);
//     }

//     if (purchase.outletID !== outletID) {
//         throw new Error(`Outlet ${outletID} cannot validate a purchase made in another outlet.`);
//     }

//     if (purchase.item !== "juice") {
//         throw new Error(`Purchase ${purchaseID} is not valid. Only juice can be validated.`);
//     }

//     purchase.status = 'validated';
//     await ctx.stub.putState(purchaseID, Buffer.from(JSON.stringify(purchase)));
// }

// async validateAllPurchases(ctx, outletID) {
//     console.info('============= START : validateAllUserPurchases ===========');

//     const startKey = 'P0';
//     const endKey = 'P99999';

//     const iterator = await ctx.stub.getStateByRange(startKey, endKey);

//     while (true) {
//         const res = await iterator.next();

//         if (res.value && res.value.value.toString()) {
//             const Key = res.value.key;
//             let purchase;
//             try {
//                 purchase = JSON.parse(res.value.value.toString('utf8'));
//                 if ((purchase.outletID).toString() === outletID) {
//                     if (purchase.item === "juice" && purchase.status !== 'validated'){
//                         purchase.status = 'validated';
//                         let temp_purchaseID = purchase.purchaseID;
//                         await ctx.stub.putState(temp_purchaseID.toString(), Buffer.from(JSON.stringify(purchase)));
//                     }
//                 }

//             } catch (err) {
//                 console.log(err);
//                 purchase = res.value.value.toString('utf8');
//             }

//         }
//         if (res.done) {
//             await iterator.close();
//             return "Ran successfully. Validated all purchases with juice as an item."
//             console.info('============= END : validateAllUserPurchases ===========');
//         }
//     }
// }

// async redeemReward(ctx, rewardID) {

//     console.info('============= START : redeemReward ===========');

//     function areDatesConsecutive(date1, date2) {

//         let d1 = new Date(date1);
//         let d2 = new Date(date2);

//         // Calculate the difference in milliseconds
//         let difference = d2 - d1;

//         // Convert the difference to days
//         let differenceInDays = difference / (1000 * 60 * 60 * 24);

//         return differenceInDays === 1;
//     }

//     const rewardAsBytes = await ctx.stub.getState(rewardID.toString());
//     const reward = JSON.parse(rewardAsBytes.toString());

//     const startKey = 'P0';
//     const endKey = 'P99999';

//     const iterator = await ctx.stub.getStateByRange(startKey, endKey);

//     let cid = new ClientIdentity(ctx.stub);
//     let userID = cid.getID();

//     let purchaseIDs = [];
//     let dates = [];
//     while (true) {
//         const res = await iterator.next();

//         if (res.value && res.value.value.toString()) {
//             let purchase;
//             try {
//                 purchase = JSON.parse(res.value.value.toString('utf8'));
//                 console.log(purchase);
//                 if (purchase.userID === userID && purchase.status === 'validated' && purchase.used === false) {
//                     if (dates.length === 0){
//                         purchaseIDs.push(purchase.purchaseID);
//                         dates.push(purchase.dateOfPurchase);
//                     }
//                     else{
//                         let a = dates[dates.length - 1];
//                         a = a.toString();
//                         let b = purchase.dateOfPurchase;
//                         b = b.toString();
//                         if (areDatesConsecutive(a, b)){
//                             purchaseIDs.push(purchase.purchaseID);
//                             dates.push(purchase.dateOfPurchase);
//                             if (dates.length === 7){
//                                 reward.owner = userID;
//                                 await ctx.stub.putState(rewardID.toString(), Buffer.from(JSON.stringify(reward)));

//                                 for (const purchaseid of purchaseIDs) {
//                                     const pb = await ctx.stub.getState(purchaseid.toString());
//                                     const p = JSON.parse(pb.toString());
//                                     p.used = rewardID;
//                                     await ctx.stub.putState(purchaseid.toString(), Buffer.from(JSON.stringify(p)));
//                                 }
//                                 await iterator.close();
//                                 return `Reward with rewardID ${rewardID} has been redeemed successfully by user ${userID}`;
//                             }
//                         }
//                         else{
//                             dates.length = 0;
//                             purchaseIDs.length = 0;
//                         }
//                     }
//                 }
//             } catch (err) {
//                 console.log(err);
//                 purchase = res.value.value.toString('utf8');
//             }
//         }
//         if (res.done) {
//             await iterator.close();
//             console.info('============= END : redeemReward ===========');
//             return "Juice purchases not found on 7 consecutive days. Redeem failed!";
//         }
//     }
// }
