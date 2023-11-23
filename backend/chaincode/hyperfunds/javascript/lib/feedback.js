/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');
const ClientIdentity = require('fabric-shim').ClientIdentity;

let outlets = [];

let rewardCounter = -1;
let rewardID;

let purchaseCounter = -1;
let purchaseID;


class bphr extends Contract {

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

    async registerStudent(ctx, studentID, location) {
        console.info('============= START : registerOutlet ===========');
        // Create the outlet object
        const student = {
            studentId,
            ashokaId,
            studentName,
            email,
            department,
            enrollmentYear,
            program,
            docType: 'student',
            feedbackIDs: [] // This array will store feedback related to the student
        };
        if (!(students.includes(student))) {
            students.push(student);
        }

        // Store outlet on the ledger
        await ctx.stub.putState(outletID.toString(), Buffer.from(JSON.stringify(outlet)));
        return `Successfully registered Outlet ${outletID}`;
        console.info('============= START : registerOutlet ===========');
    }

    async registerOutlet(ctx, outletID, location) {
        console.info('============= START : registerOutlet ===========');
        // Create the outlet object
        const outlet = {
            outletID,
            location,
        };
        if (!(outlets.includes(outlet))) {
            outlets.push(outlet);
        }

        // Store outlet on the ledger
        await ctx.stub.putState(outletID.toString(), Buffer.from(JSON.stringify(outlet)));
        return `Successfully registered Outlet ${outletID}`;
        console.info('============= START : registerOutlet ===========');
    }

    async queryAllOutlets(ctx) {
        console.info('============= START : queryAllOutlets ===========');

        return JSON.stringify(outlets);
        console.info('============= END : queryAllOutlets ===========');

    }

    // Register a purchase
    //IMPORTANT NOTE: I know the date parameter shouldn't be here since the user can enter any date they want in order to win the reward
    //When deploying this in production, i would just use the current date instead of a user passing in a date.
    //Doing this here so as to check if the redeemreward function works
    async registerPurchase(ctx, outletID, item, date) {

        let cid = new ClientIdentity(ctx.stub);
        let userID = cid.getID();

        //"yyyy-mm-dd"
        const status = 'pending';
        let dateOfPurchase;
        if (date === "x"){
            dateOfPurchase = new Date().toISOString().split('T')[0];
        }
        else{
            dateOfPurchase = date;
        }
        // const dateOfPurchase = date ? date : new Date().toISOString().split('T')[0];
        const used = false;

        purchaseCounter = Number(purchaseCounter);
        purchaseCounter += 1;
        purchaseID = 'P' + purchaseCounter;
        const purchase = {
            purchaseID,
            userID,
            outletID,
            item,
            status,
            dateOfPurchase,
            used,
        };

        await ctx.stub.putState(purchaseID.toString(), Buffer.from(JSON.stringify(purchase)));
        console.log(`Item ${item} purchased successfully from outlet ${outletID} on ${date}! Your Purchase ID is ${purchaseID}. Please save it`);
    }

    async queryPurchasesByOutlet(ctx, outletID) {
        console.info('============= START : queryPurchasesByOutlet ===========');

        const startKey = 'P0';
        const endKey = 'P99999';

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        const queriedPurchasesByOutlet = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                const Key = res.value.key;
                let purchase;
                try {
                    purchase = JSON.parse(res.value.value.toString('utf8'));
                    console.log(purchase);
                    if (purchase.outletID === outletID) {
                        queriedPurchasesByOutlet.push({Key, purchase});
                    }

                } catch (err) {
                    console.log(err);
                    purchase = res.value.value.toString('utf8');
                }

            }
            if (res.done) {
                await iterator.close();
                console.info(queriedPurchasesByOutlet);
                console.info('============= END : queryPurchasesByOutlet ===========');
                return JSON.stringify(queriedPurchasesByOutlet);
            }
        }
    }

    async queryPurchasesByUser(ctx) {
        console.info('============= START : queryPurchasesByUser ===========');

        const startKey = 'P0';
        const endKey = 'P99999';

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        let cid = new ClientIdentity(ctx.stub);
        let userID = cid.getID();

        const queriedPurchasesByUser = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                const Key = res.value.key;
                let purchase;
                try {
                    purchase = JSON.parse(res.value.value.toString('utf8'));
                    console.log(purchase);
                    if (purchase.userID === userID) {
                        queriedPurchasesByUser.push({Key, purchase});
                    }
                } catch (err) {
                    console.log(err);
                    purchase = res.value.value.toString('utf8');
                }
            }
            if (res.done) {
                await iterator.close();
                console.info(queriedPurchasesByUser);
                console.info('============= END : queryPurchasesByUser ===========');
                return JSON.stringify(queriedPurchasesByUser);
            }
        }
    }

    // Validate a purchase by an outlet
    async validatePurchase(ctx, purchaseID, outletID) {
        const purchaseAsBytes = await ctx.stub.getState(purchaseID);
        const purchase = JSON.parse(purchaseAsBytes.toString());
        if (!purchase) {
            throw new Error(`Purchase ${purchaseID} does not exist`);
        }

        if (purchase.outletID !== outletID) {
            throw new Error(`Outlet ${outletID} cannot validate a purchase made in another outlet.`);
        }

        if (purchase.item !== "juice") {
            throw new Error(`Purchase ${purchaseID} is not valid. Only juice can be validated.`);
        }

        purchase.status = 'validated';
        await ctx.stub.putState(purchaseID, Buffer.from(JSON.stringify(purchase)));
    }

    async validateAllPurchases(ctx, outletID) {
        console.info('============= START : validateAllUserPurchases ===========');

        const startKey = 'P0';
        const endKey = 'P99999';

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                const Key = res.value.key;
                let purchase;
                try {
                    purchase = JSON.parse(res.value.value.toString('utf8'));
                    if ((purchase.outletID).toString() === outletID) {
                        if (purchase.item === "juice" && purchase.status !== 'validated'){
                            purchase.status = 'validated';
                            let temp_purchaseID = purchase.purchaseID;
                            await ctx.stub.putState(temp_purchaseID.toString(), Buffer.from(JSON.stringify(purchase)));
                        }
                    }

                } catch (err) {
                    console.log(err);
                    purchase = res.value.value.toString('utf8');
                }

            }
            if (res.done) {
                await iterator.close();
                return "Ran successfully. Validated all purchases with juice as an item."
                console.info('============= END : validateAllUserPurchases ===========');
            }
        }
    }

    async addReward(ctx, description) {

        console.info('============= START : addReward ===========');
        console.log(rewardCounter);

        rewardCounter = Number(rewardCounter);
        rewardCounter += 1;
        rewardID = 'R' + rewardCounter;
        let owner = 'university';

        // Create a new reward object and store it on the blockchain
        const reward = {
            rewardID,
            description,
            owner,
        };

        await ctx.stub.putState(rewardID.toString(), Buffer.from(JSON.stringify(reward)));
        console.info('============= END : addReward ===========');

    }


    async queryAllRewards(ctx) {
        console.info('============= START : queryAllRewards ===========');

        const startKey = 'R0';
        const endKey = 'R99999';

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        const allRewards = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                const Key = res.value.key;
                let reward;
                try {
                    reward = JSON.parse(res.value.value.toString('utf8'));

                } catch (err) {
                    console.log(err);
                    reward = res.value.value.toString('utf8');
                }
                allRewards.push({Key, reward});
            }
            if (res.done) {
                await iterator.close();
                console.info(allRewards);
                console.info('============= END : queryAllRewards ===========');
                return JSON.stringify(allRewards);
            }
        }
    }

    async redeemReward(ctx, rewardID) {

        console.info('============= START : redeemReward ===========');

        function areDatesConsecutive(date1, date2) {

            let d1 = new Date(date1);
            let d2 = new Date(date2);
        
            // Calculate the difference in milliseconds
            let difference = d2 - d1;
        
            // Convert the difference to days
            let differenceInDays = difference / (1000 * 60 * 60 * 24);
        
            return differenceInDays === 1;
        }


        const rewardAsBytes = await ctx.stub.getState(rewardID.toString());
        const reward = JSON.parse(rewardAsBytes.toString());        

        const startKey = 'P0';
        const endKey = 'P99999';

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        let cid = new ClientIdentity(ctx.stub);
        let userID = cid.getID();

        let purchaseIDs = [];
        let dates = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                let purchase;
                try {
                    purchase = JSON.parse(res.value.value.toString('utf8'));
                    console.log(purchase);
                    if (purchase.userID === userID && purchase.status === 'validated' && purchase.used === false) {
                        if (dates.length === 0){
                            purchaseIDs.push(purchase.purchaseID);
                            dates.push(purchase.dateOfPurchase);
                        }
                        else{
                            let a = dates[dates.length - 1];
                            a = a.toString();
                            let b = purchase.dateOfPurchase;
                            b = b.toString();
                            if (areDatesConsecutive(a, b)){
                                purchaseIDs.push(purchase.purchaseID);
                                dates.push(purchase.dateOfPurchase);
                                if (dates.length === 7){
                                    reward.owner = userID;
                                    await ctx.stub.putState(rewardID.toString(), Buffer.from(JSON.stringify(reward)));

                                    for (const purchaseid of purchaseIDs) {
                                        const pb = await ctx.stub.getState(purchaseid.toString());
                                        const p = JSON.parse(pb.toString());
                                        p.used = rewardID;
                                        await ctx.stub.putState(purchaseid.toString(), Buffer.from(JSON.stringify(p)));
                                    }
                                    await iterator.close();
                                    return `Reward with rewardID ${rewardID} has been redeemed successfully by user ${userID}`;
                                }
                            }
                            else{
                                dates.length = 0;
                                purchaseIDs.length = 0;
                            }
                        }
                    }
                } catch (err) {
                    console.log(err);
                    purchase = res.value.value.toString('utf8');
                }
            }
            if (res.done) {
                await iterator.close();
                console.info('============= END : redeemReward ===========');
                return "Juice purchases not found on 7 consecutive days. Redeem failed!";
            }
        }
    }
}

module.exports = bphr;
