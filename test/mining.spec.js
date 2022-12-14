const { expect } = require("chai");
const {
    ethers: {
        BigNumber,
        constants: { Two }
    },
    waffle
} = hre;
const utils = require("../scripts/functions.js");
const _ = require("lodash");
const fs = require("fs");
const { mean } = require("mathjs");
const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");

describe("The Buterin Card", async function () {
    this.timeout(1000000);

    let jpegMiner;
    let scansB64;
    let tree;

    before(async () => {
        // Compress image to progressive JPEG
        utils.toProgressiveJPEG("Logan_3000x1000", "scan_script");

        // Open JPEG in binary
        const scans = utils.getScans("Logan_3000x1000", "scan_script");

        // Save JPEGs
        utils.saveShardedJPEGs(scans, "Logan_3000x1000", "scan_script");

        // Convert scans to B64
        scansB64 = utils.convertScansToB64(scans);

        // Save Base64 links
        utils.saveShardedJPEGSinB64(scansB64, "Logan_3000x1000", "scan_script");

        // // TEST
        // let temp = [];
        // for (let index = 0; index < 10; index++) {
        //     temp = temp.concat(...scansB64.JpegScansB64);
        // }
        // scansB64.JpegScansB64 = temp;
        // // TEST

        // Compute Merkle tree
        tree = StandardMerkleTree.of(
            scansB64.JpegScansB64.map((scanB64, index) => [index, scanB64]),
            ["uint256", "string"]
        );
        console.log("Merkle Root:", tree.root);

        // Deploy JPEG Miner
        const JPEGminer = await ethers.getContractFactory("JPEGminer");
        jpegMiner = await JPEGminer.deploy(tree.root, scansB64.JpegHeaderB64, scansB64.JpegFooterB64);
    });

    it(`Mining`, async function () {
        for (let i = 0; i < scansB64.JpegScansB64.length; i++) {
            console.log(`Mining scan ${i} of length ${scansB64.JpegScansB64[i].length / 1024} kB`);

            // // Wrong mining tests
            // let indScan;
            // while ((indScan = Math.floor(scansB64.JpegScansB64.length * Math.random())) === i);

            // await expect(jpegMiner.mine(scansB64.JpegScansB64[indScan], tree.getProof(indScan))).to.be.reverted;

            // Right mining tests
            await expect(jpegMiner.mine(scansB64.JpegScansB64[i], tree.getProof(i))).to.emit(jpegMiner, "Mined");
        }
    });

    it(`TokenURI`, async function () {
        const start = Date.now();
        await jpegMiner.tokenURI(scansB64.JpegScansB64.length - 1);
        const end = Date.now();
        console.log(`Token URI took ${(end - start) / 1e3} s`);
        expect(1).to.equal(1);
    });

    it(`Mining fails cuz it is over`, async function () {
        await expect(jpegMiner.mine("Dummy data here", tree.getProof(0))).to.be.reverted;
    });

    const [from, fromFake, to] = await ethers.getSigners();

    it("Transfer of NFT fails", async function () {
        await expect(jpegMiner.connect(to).transferFrom(fromFake.address, to.address, tokenId)).to.be.revertedWith(
            "ERC721: transfer caller is not owner nor approved"
        );
    });

    it("transfer of NFT succeed", async function () {
        await expect(jpegMiner.transferFrom(from.address, to.address, tokenId)).to.emit(jpegMiner, "Transfer");
    });
});
