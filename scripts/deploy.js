// This is a script for deploying your contracts. You can adapt it to deploy
// yours, or create new ones.
async function main() {
    const utils = require("./functions.js");

    const gasMintingFees = [
        735094, 418153, 488853, 775233, 990879, 1116059, 1278984, 1380845, 1473082, 1555182, 1630064, 1475189, 1564849,
        1439494, 874059, 1580895, 1015457, 1727279, 1157765, 1907348, 1509213, 2114637, 2203394, 2329378, 2474955,
        2560437, 2690427, 2769423, 2871352, 2942053, 3022723, 3094224, 3178899, 1209024, 1048723, 666363, 2097316,
        1424907, 785999, 1630687, 653204, 1454467, 1317226, 2009252, 2153344, 691349, 2522271, 1641774, 1663039,
        1312673, 2093147, 3489125, 1321568, 1993318, 1755231, 2475626, 2070122, 2099411, 3062246, 3338363, 2798503,
        1819070, 4153908, 4070527, 4296914, 4250687, 4417728, 3078899, 4728961, 4502914, 3611900, 4559369, 4677046,
        2713661, 4726902, 4765530, 4877481, 4183576, 5069969, 5221490, 3664359, 4123879, 5423603, 5431732, 5471052,
        4971942, 5728761, 4329346, 3784898, 6070177, 5387231, 3913479, 5393358, 4811345, 4223082, 4936136, 5324583,
        5972086, 6169759, 6581885
    ];

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

    console.log("Main account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

    // Compress image to progressive JPEG
    // utils.toProgressiveJPEG("Logan_3000x1000", "test");
    utils.toProgressiveJPEG("landscape0", "test");

    // Open JPEG in binary
    const scans = utils.getScans("test");

    // Convert scans to B64
    const scansB64 = utils.convertScansToB64(scans);
    const imageScans = scansB64.JpegScansB64;

    // Compute hashes
    const hashes = utils.hashScans(scansB64.JpegScansB64);

    // Deploy JPEG Miner
    const JPEGminer = await ethers.getContractFactory("JPEGminer");
    console.log("Deploying...");
    const jpegMiner = await JPEGminer.deploy(scansB64.JpegHeaderB64, hashes, gasMintingFees);
    await jpegMiner.deployed();
    console.log("Deployed...");

    console.log("JPEGminer address:", jpegMiner.address);

    // We also save the contract's artifacts and address in the frontend directory
    saveFrontendFiles(imageScans, jpegMiner, gasMintingFees);
}

function saveFrontendFiles(imageScans, jpegMiner, gasMintingFees) {
    const fs = require("fs");
    const contractsDir = __dirname + "/../frontend/src/contracts";

    if (!fs.existsSync(contractsDir)) {
        fs.mkdirSync(contractsDir);
    }

    let chainId;
    switch (network.name) {
        case "localhost":
            chainId = 31337;
            break;
        case "rinkeby":
            chainId = 4;
            break;
        case "mainnet":
            chainId = 1;
            break;
        default:
            throw new Error("Incorrect network");
    }

    fs.writeFileSync(
        contractsDir + "/contractParams.json",
        JSON.stringify({ address: jpegMiner.address, imageScans, chainId, gasMintingFees }, undefined, 2)
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
