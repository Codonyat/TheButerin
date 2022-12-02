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

const Nscans = 100;

describe("The Vuterin Card", function () {
    let jpegMiner;
    let JpegScansB64;
    let tree;

    before(async () => {
        // Compress image to progressive JPEG
        utils.toProgressiveJPEG("Logan_3000x1000", "test");

        // Open JPEG in binary
        const scans = utils.getScans("test");

        // Save JPEGs
        utils.saveShardedJPEGs(scans);

        // Convert scans to B64
        const scansB64 = utils.convertScansToB64(scans);
        ({ JpegScansB64 } = scansB64);

        // Save Base64 links
        utils.saveShardedJPEGSinB64(scansB64);

        // Compute Merkle tree
        tree = StandardMerkleTree.of(
            JpegScansB64.map((scanB64, index) => [index, scanB64]),
            ["uint256", "string"]
        );
        console.log("Merkle Root:", tree.root);

        // Deploy JPEG Miner
        const JPEGminer = await ethers.getContractFactory("JPEGminer");
        jpegMiner = await JPEGminer.deploy(tree.root, scansB64.JpegHeaderB64, scansB64.JpegFooterB64);
    });

    for (let i = 0; i < Nscans; i++) {
        describe(`Mining of ${i + 1}/${Nscans}`, function () {
            // Wrong mining tests
            it(`fails cuz wrong data`, async function () {
                let indScan;
                while ((indScan = Math.floor(Nscans * Math.random())) === i);

                await expect(jpegMiner.mine(JpegScansB64[indScan], tree.getProof(indScan))).to.be.revertedWith(
                    "Invalid data"
                );
            });

            // Right mining tests
            it(`succeeds`, async function () {
                await expect(jpegMiner.mine(JpegScansB64[i], tree.getProof(i))).to.emit(jpegMiner, "Mined");
            });
        });
    }

    describe("Final mining checks", async function () {
        it(`mining of ${Nscans + 1}/${Nscans} fails cuz it is over`, async function () {
            await expect(jpegMiner.mine("Dummy data here", tree.getProof(0))).to.be.reverted;
        });

        const [from, fromFake, to] = await ethers.getSigners();

        it("transfer of NFT fails", async function () {
            await expect(jpegMiner.connect(to).transferFrom(fromFake.address, to.address, tokenId)).to.be.revertedWith(
                "ERC721: transfer caller is not owner nor approved"
            );
        });

        it("transfer of NFT succeed", async function () {
            await expect(jpegMiner.transferFrom(from.address, to.address, tokenId)).to.emit(jpegMiner, "Transfer");
        });
    });
});
