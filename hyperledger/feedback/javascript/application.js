/* eslint-disable @stylistic/js/max-len */
"use strict";

// eslint-disable-next-line @stylistic/js/max-len
const {CCP, CHANNEL, CONTRACT, WALLETPATH, CAINFO, ADMIN, ADMINPW, HASH, HASH_ENCODING} = require("./utils/constants"),
    {Gateway, Wallets} = require("fabric-network"),
    FabricCAServices = require("fabric-ca-client"),
    crypto = require("crypto"),
    email = process.argv[3],
    func = process.argv[2];

/**
 * Registers an admin user, enrols them with the Certificate Authority (CA), and creates the wallet.
 * @returns {Promise<void>} - A promise that resolves when the admin wallet is created successfully.
 */
async function createAdminWallet() {
    try {
        // create new CA client for interacting with the CA
        const ca = new FabricCAServices(
                CAINFO.url,
                {
                    trustedRoots: CAINFO.tlsCACerts.pem,
                    verify: false,
                },
                CAINFO.caName,
            ),
            // create a new file system based wallet for managing identities
            wallet = await Wallets.newFileSystemWallet(WALLETPATH);

        // check to see if admin already exists
        const identity = await wallet.get(ADMIN);
        if (identity) {
            console.log("An identity for the admin user already exists in the wallet.");
            process.exit(1);
        }

        // enroll the admin user and import the new identity into the wallet
        const enrolment = await ca.enroll({
                enrollmentID: ADMIN,
                enrollmentSecret: ADMINPW,
            }),
            x509Identity = {
                credentials: {
                    certificate: enrolment.certificate,
                    privateKey: enrolment.key.toBytes(),
                },
                mspId: "Org1MSP",
                type: "X.509",
            };
        await wallet.put(ADMIN, x509Identity);
    } catch (error) {
        console.error(`Failed to enroll admin user: ${error}.`);
        process.exit(1);
    }
}

/**
 * Registers a user, enrols them with the Certificate Authority (CA), and creates the wallet.
 * @param {string} emailHash - The hash of the email id of the user.
 * @returns {Promise<void>} The function does not return anything.
 */
async function createUserWallet(emailHash){
    try {
        // create new CA client for interacting with the CA
        const ca = new FabricCAServices(CAINFO.url),
            // create a new file system based wallet for managing identities
            wallet = await Wallets.newFileSystemWallet(WALLETPATH);

        // check to see if user is already enrolled
        const userIdentity = await wallet.get(emailHash);
        if (userIdentity) {
            console.log("An identity for this user already exists in the wallet.");
            process.exit(1);
        }

        // check to see if admin exists
        let adminIdentity = await wallet.get(ADMIN);
        if (!adminIdentity) {
            await createAdminWallet();
            adminIdentity = await wallet.get(ADMIN);
        }

        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        // build admin user object for authenticating with the CA
        const adminUser = await provider.getUserContext(adminIdentity, ADMIN),
            secret = await ca.register(
                {
                    affiliation: "org1.department1",
                    enrollmentID: emailHash,
                    role: "client",
                },
                adminUser,
            );

        // enroll the new user and import the new identity into the wallet
        const enrollment = await ca.enroll({
                enrollmentID: emailHash,
                enrollmentSecret: secret,
            }),
            x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: "Org1MSP",
                type: "X.509",
            };
        await wallet.put(emailHash, x509Identity);
    } catch (error) {
        console.error(`Failed to register user: ${error}.`);
        process.exit(1);
    }
}

/**
 * Invokes the specified function on the specified user with the specified role
 */
async function executeChaincode() {
    try {
        // create a new file system based wallet for managing identities
        const wallet = await Wallets.newFileSystemWallet(WALLETPATH);

        const hashedEmail = crypto
            .createHash(HASH)
            .update(email)
            .digest(HASH_ENCODING);

        // check to see if client is enrolled
        let identity = await wallet.get(hashedEmail);
        if (!identity) {
            await createUserWallet(hashedEmail);
            identity = await wallet.get(hashedEmail);
        }

        // create new gateway for connecting to peer node
        const gateway = new Gateway();
        await gateway.connect(CCP, {
            discovery: {
                asLocalhost: true,
                enabled: true,
            },
            identity: hashedEmail,
            wallet,
        });

        // get the channel the chaincode is deployed on
        const network = await gateway.getNetwork(CHANNEL);
        // get the contract from the network
        const contract = network.getContract(CONTRACT);

        let response;

        // submit specified transaction
        switch (func) {
        case "registerUser":
            var ashoka_id = process.argv[4],
                name = process.argv[5],
                password = process.argv[6],
                type = process.argv[7];
            response = await contract.submitTransaction("registerUser", name, email, ashoka_id, password, type);
            console.log(JSON
                .stringify(JSON
                    .parse(Buffer
                        .from(JSON.parse(response.toString()).data)
                        .toString()), null, 2));
            break;

        case "addRequest":
            var description = process.argv[4];
            type = process.argv[5];
            response = await contract.submitTransaction("addRequest", description, type);
            console.log(JSON
                .stringify(JSON
                    .parse(Buffer
                        .from(JSON.parse(response.toString()).data)
                        .toString()), null, 2));
            break;

        case "queryRequests":
            var confirmed = process.argv[4];
            type = process.argv[5];
            response = await contract.evaluateTransaction("queryRequests", type, confirmed);
            console.log(JSON
                .stringify(JSON
                    .parse(Buffer
                        .from(JSON.parse(response.toString()).data)
                        .toString()), null, 2));
            break;

        case "confirmRequest":
            var requestID = process.argv[4];
            response = await contract.submitTransaction("confirmRequest", requestID, email);
            console.log(JSON
                .stringify(JSON
                    .parse(Buffer
                        .from(JSON.parse(response.toString()).data)
                        .toString()), null, 2));
            break;

        case "updateRequest":
            var notes = process.argv[4],
                status = process.argv[5];
            requestID = process.argv[6];
            response = await contract.submitTransaction("updateRequest", requestID, notes, status);
            console.log(JSON
                .stringify(JSON
                    .parse(Buffer
                        .from(JSON.parse(response.toString()).data)
                        .toString()), null, 2));
            break;

        case "queryRequestHistory":
            requestID = process.argv[4];
            response = await contract.evaluateTransaction("queryRequestHistory", requestID);
            console.log(JSON
                .stringify(JSON
                    .parse(Buffer
                        .from(JSON.parse(response.toString()).data)
                        .toString()), null, 2));
            break;

        case "validateUser":
            var userID = process.argv[4];
            response = await contract.submitTransaction("validateUser", userID);
            console.log(JSON
                .stringify(JSON
                    .parse(Buffer
                        .from(JSON.parse(response.toString()).data)
                        .toString()), null, 2));
            break;

        case "queryUser":
            response = await contract.evaluateTransaction("queryUser", email);
            console.log(JSON
                .stringify(JSON
                    .parse(Buffer
                        .from(JSON.parse(response.toString()).data)
                        .toString()), null, 2));
            break;

        default:
            console.error(`unknown function: ${func}`);
            process.exit(1);
        }

        // disconnect from gateway
        await gateway.disconnect();
    } catch (error) {
        // print error stack
        console.error(`Failed to submit or evaluate transaction: ${error}.`);
        console.error(error.stack);
        process.exit(1);
    }
}

executeChaincode();
