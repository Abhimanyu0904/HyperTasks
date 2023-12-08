#!/bin/bash
# Exit on first error
set -e

# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1
start_time=$(date +%s)
CC_SRC_LANGUAGE=${1:-"javascript"}
CC_SRC_LANGUAGE=$(echo "$CC_SRC_LANGUAGE" | tr [:upper:] [:lower:])

if [ "$CC_SRC_LANGUAGE" = "javascript" ]; then
    CC_SRC_PATH="../chaincode/feedback/javascript/"
else
    echo The chaincode language "${CC_SRC_LANGUAGE}" is not supported by this script
    echo Supported chaincode languages are: javascript
    exit 1
fi

# clean out any old identities in the wallets
rm -rf ./javascript/wallet/*

# launch network; create channel and join peer to channel
pushd ../test-network
./network.sh down
./network.sh up createChannel -ca -s couchdb
./network.sh deployCC -ccn feedback -ccv 1 -cci initLedger -ccl "${CC_SRC_LANGUAGE}" -ccp ${CC_SRC_PATH}
popd

cat <<EOF

Total setup execution time : $(($(date +%s) - start_time)) secs ...

Next, use the application to interact with the deployed a3 contract.
Instructions:
    Start by changing into the "javascript" directory:
    cd javascript

    Next, install all required packages:
    npm install

    Then run the following applications to enroll the admin user, and register a new user which will be used by the other applications to interact with the deployed contract:
    node registerAdmin
    node registerUser <name> <role:university|user|outlet>

    You can run the application as follows:
    node application <func:registerPurchase|registerReward|approvePurchase|queryRewards|redeemReward|queryPurchases> <name> <role:university|user|outlet> <outlet|details|owningUniversity|rewardID> <purchasedOn|purchaseID>

    name: name of the user making this transaction
    role: the role of the user making the transaction. Can only be university, user, or outlet

    registerPurchase: register a new purchase claim. Only a user type role can invoke this function. Need to pass name of outlet from where the purchase was made and the date of purchase in the format: mm-dd-yyyy

    registerReward: register a new reward. Only a university type role can invoke this function. Need to pass the reward description.

    approvePurchase: approve a purchase claim. Only an outlet type role can invoke this function. Need to pass name of the outlet validating this purchase and the purchaseID of the purchase to validate

    queryRewards: query all rewards for a given university or user. Only a user or a university type role can invoke this function. Need to pass name of the owner whose rewards are required.

    redeemReward: redeem a reward. Only a user type role can invoke this function. Need to pass the rewardID of the reward to redeem. The user needs to have 7 consecutive, verified, unredeemed purchases. The reward being redeemed also needs to be unclaimed.

    queryPurchases: query all purchases for a given user or outlet. If a user invokes this command, the user's purchases will be returned. If invoked by an outlet, all the outstanding invalid purchase claims for that outlet will be returned.
EOF
