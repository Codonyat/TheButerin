const { ethers } = hre;
const utils = require("../scripts/functions.js");
const _ = require("lodash");
const fs = require("fs");
const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");

const tokenId = 99;

(async function () {
    // Open JPEG in binary
    const scans = utils.getScans("test");

    // Convert scans to B64
    const scansB64 = utils.convertScansToB64(scans);
    const { JpegScansB64 } = scansB64;

    // Save Base64 links
    utils.saveShardedJPEGSinB64(scansB64);

    // Compute Merkle tree
    const tree = StandardMerkleTree.of(
        JpegScansB64.map((scanB64, index) => [index, scanB64]),
        ["uint256", "string"]
    );

    // Deploy JPEG Miner
    const JPEGminer = await ethers.getContractFactory("JPEGminer");
    const jpegMiner = await JPEGminer.deploy(tree.root, scansB64.JpegHeaderB64, scansB64.JpegFooterB64);

    // Mine up to argument
    for (let i = 0; i <= tokenId; i++) {
        jpegMiner.mine(JpegScansB64[i], tree.getProof(i));
    }

    // Get image
    const start = Date.now();
    const uri = await jpegMiner.tokenURI(tokenId);
    const end = Date.now();
    console.log(`${(end - start) / 1e3 / 60} min`);
    fs.writeFileSync(`${__dirname}\\results\\uriB64.txt`, uri);
})();
