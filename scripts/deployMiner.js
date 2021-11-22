// This is a script for deploying your contracts. You can adapt it to deploy
// yours, or create new ones.
async function main() {
    const utils = require("./functions.js");

    // This is just a convenience check
    if (network.name === "hardhat") {
        console.warn(
            "You are trying to deploy a contract to the Hardhat Network, which" +
                "gets automatically created and destroyed every time. Use the Hardhat" +
                " option '--network localhost'"
        );
    }

    // ethers is avaialble in the global scope
    const [deployer] = await ethers.getSigners();
    console.log("Deploying the contracts with the account:", await deployer.getAddress());

    console.log("Account balance:", (await deployer.getBalance()).toString());

    // Compress image to progressive JPEG
    utils.toProgressiveJPEG("Logan_3000x1000", "test");

    // Open JPEG in binary
    const scans = utils.getScans("test");

    // Convert scans to B64
    const scansB64 = utils.convertScansToB64(scans);
    const imageScans = scansB64.JpegScansB64;

    // Compute hashes
    const hashes = utils.hashScans(scansB64.JpegScansB64);

    // Deploy JPEG Miner
    const JPEGminer = await ethers.getContractFactory("JPEGminer");
    const jpegMiner = await JPEGminer.deploy(scansB64.JpegHeaderB64, hashes);
    await jpegMiner.deployed();

    console.log("JPEGminer address:", jpegMiner.address);

    // We also save the contract's artifacts and address in the frontend directory
    saveFrontendFiles(imageScans, jpegMiner);
}

function saveFrontendFiles(imageScans, jpegMiner) {
    const fs = require("fs");
    const contractsDir = __dirname + "/../frontend/src/contracts";
    const dataDir = __dirname + "/../frontend/src/imageData";

    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }

    fs.writeFileSync(contractsDir + "/imageScans.json", JSON.stringify(imageScans, undefined, 2));

    if (!fs.existsSync(contractsDir)) {
        fs.mkdirSync(contractsDir);
    }

    fs.writeFileSync(
        contractsDir + "/contract-address.json",
        JSON.stringify({ JPEGminer: jpegMiner.address }, undefined, 2)
    );

    const TokenArtifact = artifacts.readArtifactSync("JPEGminer");

    fs.writeFileSync(contractsDir + "/JPEGminer.json", JSON.stringify(TokenArtifact, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
