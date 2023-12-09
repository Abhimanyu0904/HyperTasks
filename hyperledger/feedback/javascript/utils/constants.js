const fs = require("fs"),
    path = require("path");

// eslint-disable-next-line @stylistic/js/max-len
const CCPPATH = path.resolve(__dirname, "..", "..", "..", "test-network", "organizations", "peerOrganizations", "org1.example.com", "connection-org1.json");
const CCP = JSON.parse(fs.readFileSync(CCPPATH, "utf8"));
const CAINFO = CCP.certificateAuthorities["ca.org1.example.com"];

module.exports.ADMIN = "admin";
module.exports.ADMINPW = "adminpw";
module.exports.CAINFO = CAINFO;
module.exports.CCP = CCP;
module.exports.CHANNEL = "mychannel";
module.exports.CONTRACT = "feedback";
module.exports.WALLETPATH = path.join(__dirname, "..", "wallet");
module.exports.HASH = "sha256";
module.exports.HASH_ENCODING = "hex";
