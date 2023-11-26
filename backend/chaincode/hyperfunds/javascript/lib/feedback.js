/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');
const ClientIdentity = require('fabric-shim').ClientIdentity;

let students = [];
let faculties = [];

let studentCounter = -1;
let studentID;

let feedbackCounter = -1;
let feedbackID;

let facultyCounter = -1;
let facultyID;


class feedback extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');

        const startKey = '0';
        const endKey = '99999';

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                let purchase;
                try {
                    purchase = JSON.parse(res.value.value.toString('utf8'));
                    purchaseCounter = Number(purchaseCounter);
                    purchaseCounter += 1;
                    purchaseID = 'P' + purchaseCounter;

                } catch (err) {
                    console.log(err);
                    purchase = res.value.value.toString('utf8');
                }
            }

            if (res.done) {
                await iterator.close();
                console.log(`lastPurchaseID: ${purchaseID}`);
                break;
            }
        }
        console.info('============= END : Initialize Ledger ===========');
    }

    async registerStudent(ctx, studentName, email, ashokaID) {
        console.info('============= START : registerStudent ===========');

        let cid = new ClientIdentity(ctx.stub);
        let userID = cid.getID();
        let hash_pass;

        studentCounter = Number(studentCounter);
        studentCounter += 1;
        studentID = 'S' + studentCounter;

        // Create the student object
        const student = {
            userID,
            studentID,
            ashokaID,
            studentName,
            email,
            hash_pass
            // feedbackIDs: [] // This array will store feedback related to the student
        };
        if (!(students.includes(student))) {
            students.push(student);
        }

        // Store outlet on the ledger
        await ctx.stub.putState(studentID.toString(), Buffer.from(JSON.stringify(student)));
        console.info('============= START : registerStudent ===========');
        return `Successfully registered Student ${studentID}`;
    }

    async registerFaculty(ctx, facultyName, email) {
        console.info('============= START : registerFaculty ===========');

        let cid = new ClientIdentity(ctx.stub);
        let userID = cid.getID();
        let hash_pass;

        facultyCounter = Number(facultyCounter);
        facultyCounter += 1;
        facultyID = 'FA' + facultyCounter;

        // Create the outlet object
        const faculty = {
            userID,
            facultyID,
            facultyName,
            email,
            hash_pass
            // feedbackIDs: [] // This array will store feedback related to the faculty
        };
        if (!(faculties.includes(faculty))) {
            faculties.push(faculty);
        }

        // Store outlet on the ledger
        await ctx.stub.putState(facultyID.toString(), Buffer.from(JSON.stringify(faculty)));
        console.info('============= START : registerFaculty ===========');
        return `Successfully registered Faculty ${facultyID}`;
    }

    async queryAllStudents(ctx) {
        console.info('============= START : queryAllStudents ===========');
        console.info('============= END : queryAllStudents ===========');
        return JSON.stringify(students);
    }

    async queryAllFaculty(ctx) {
        console.info('============= START : queryAllFaculty ===========');
        console.info('============= END : queryAllFaculty ===========');
        return JSON.stringify(faculties);
    }

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

    async queryFeedbacksByStudent(ctx) {
        console.info('============= START : queryFeedbacksByStudent ===========');

        const startKey = 'F0';
        const endKey = 'F99999';

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
                    feedback = JSON.parse(res.value.value.toString('utf8'));
                    console.log(feedback);
                    if (feedback.userID === userID && feedback.role === 'student') {
                        queriedFeedbacksByStudent.push({Key, feedback});
                    }
                } catch (err) {
                    console.log(err);
                    feedback = res.value.value.toString('utf8');
                }
            }
            if (res.done) {
                await iterator.close();
                console.info(queriedFeedbacksByStudent);
                console.info('============= END : queryFeedbacksByStudent ===========');
                return JSON.stringify(queriedFeedbacksByStudent);
            }
        }
    }

    async queryFeedbacksByFaculty(ctx) {
        console.info('============= START : queryFeedbacksByFaculty ===========');

        const startKey = 'F0';
        const endKey = 'F99999';

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
                    feedback = JSON.parse(res.value.value.toString('utf8'));
                    console.log(feedback);
                    if (feedback.userID === userID && feedback.role === 'faculty') {
                        queriedFeedbacksByFaculty.push({Key, feedback});
                    }
                } catch (err) {
                    console.log(err);
                    feedback = res.value.value.toString('utf8');
                }
            }
            if (res.done) {
                await iterator.close();
                console.info(queriedFeedbacksByFaculty);
                console.info('============= END : queryFeedbacksByFaculty ===========');
                return JSON.stringify(queriedFeedbacksByFaculty);
            }
        }
    }

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

    async addFeedback(ctx, content, role) {

        console.info('============= START : addFeedback ===========');
        console.log(feedbackCounter);

        let cid = new ClientIdentity(ctx.stub);
        let userID = cid.getID();

        let confirmations = 0;
        confirmations = Number(confirmations);

        feedbackCounter = Number(feedbackCounter);
        feedbackCounter += 1;
        feedbackID = 'F' + feedbackCounter;

        const confirmedBy = [];
        let isApproved = false;
        let isVisible = false;

        // Create a new feedback object and store it on the blockchain
        const feedback = {
            feedbackID,
            userID,
            content,
            //student or faculty
            role,
            confirmations,
            confirmedBy,
            isApproved,
            isVisible
        };

        await ctx.stub.putState(feedbackID.toString(), Buffer.from(JSON.stringify(feedback)));
        console.info('============= END : addFeedback ===========');
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

        if (feedback.role === 'student'){
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

        if (feedback.role === 'faculty'){
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
        console.info('============= START : queryStudentFeedbacks ===========');

        const startKey = 'F0';
        const endKey = 'F99999';

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        const studentFeedbacks = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                const Key = res.value.key;
                let feedback;
                try {
                    feedback = JSON.parse(res.value.value.toString('utf8'));

                } catch (err) {
                    console.log(err);
                    feedback = res.value.value.toString('utf8');
                }
                if (feedback.role === 'student'){
                    studentFeedbacks.push({Key, feedback});
                }
            }
            if (res.done) {
                await iterator.close();
                console.info(studentFeedbacks);
                console.info('============= END : queryStudentFeedbacks ===========');
                return JSON.stringify(studentFeedbacks);
            }
        }
    }

        //Can only be called by faculty
    async queryFacultyFeedbacks(ctx) {
        console.info('============= START : queryFacultyFeedbacks ===========');

        const startKey = 'F0';
        const endKey = 'F99999';

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        const facultyFeedbacks = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                const Key = res.value.key;
                let feedback;
                try {
                    feedback = JSON.parse(res.value.value.toString('utf8'));

                } catch (err) {
                    console.log(err);
                    feedback = res.value.value.toString('utf8');
                }
                if (feedback.role === 'faculty'){
                    facultyFeedbacks.push({Key, feedback});
                }
            }
            if (res.done) {
                await iterator.close();
                console.info(facultyFeedbacks);
                console.info('============= END : queryFacultyFeedbacks ===========');
                return JSON.stringify(facultyFeedbacks);
            }
        }
    }

    //Can only be called by universtiyAdmin
    async queryAllFeedbacks(ctx) {
        console.info('============= START : queryAllFeedbacks ===========');

        const startKey = 'F0';
        const endKey = 'F99999';

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        const allFeedbacks = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                const Key = res.value.key;
                let feedback;
                try {
                    feedback = JSON.parse(res.value.value.toString('utf8'));

                } catch (err) {
                    console.log(err);
                    feedback = res.value.value.toString('utf8');
                }
                allFeedbacks.push({Key, feedback});
            }
            if (res.done) {
                await iterator.close();
                console.info(allFeedbacks);
                console.info('============= END : queryAllFeedbacks ===========');
                return JSON.stringify(allFeedbacks);
            }
        }
    }

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
}

module.exports = feedback;
