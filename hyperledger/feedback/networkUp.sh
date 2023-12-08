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

Total setup execution time : $(($(date +%s) - start_time)) secs
EOF
