const { expect } = require("chai");
const {
    ethers: {
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
    let JpegHeaderB64, JpegScansB64, JpegFooterB64;

    before(async () => {
        // Compress image to progressive JPEG
        utils.toProgressiveJPEG("Logan_3000x1000", "test");

        // Open JPEG in binary
        const scans = utils.getScans("test");

        // Save JPEGs
        utils.saveShardedJPEGs(scans);

        // Convert scans to B64
        ({ JpegHeaderB64, JpegScansB64, JpegFooterB64 } = utils.convertScansToB64(scans));

        // Save Base64 links
        utils.saveShardedJPEGSinB64(scansB64);

        // Compute Merkle tree
        const tree = StandardMerkleTree.of(
            scansB64.map((scanB64, index) => [index, scanB64]),
            ["uint256", "string"]
        );
        console.log("Merkle Root:", tree.root);

        // Deploy JPEG Miner
        const JPEGminer = await ethers.getContractFactory("JPEGminer");
        jpegMiner = await JPEGminer.deploy(tree.root, JpegHeaderB64, JpegFooterB64);
    });

    for (let i = 0; i < Nscans; i++) {
        describe(`Mining of ${i + 1}/${Nscans}`, function () {
            // Wrong mining tests
            it(`fails cuz wrong data`, async function () {
                let indScan;
                while ((indScan = Math.floor(Nscans * Math.random())) === i);

                await expect(
                    jpegMiner.mine(JpegScansB64[indScan], {
                        gasLimit: BigNumber.from(10).pow(7)
                    })
                ).to.be.revertedWith("Wrong data");
            });

            // Right mining tests
            it(`succeeds`, async function () {
                await expect(
                    jpegMiner.mine(JpegScansB64[i], {
                        gasLimit: BigNumber.from(10).pow(7)
                    })
                ).to.emit(jpegMiner, "Mined");
            });
        });
    }

    describe("Final mining checks", function () {
        it(`mining of ${Nscans + 1}/${Nscans} fails cuz it is over`, async function () {
            await expect(
                jpegMiner.connect(accounts[Nscans + 1]).mine("Dummy data here", {
                    gasLimit: BigNumber.from(10).pow(7)
                })
            ).to.be.reverted;
        });

        const tokenId = Math.floor(Math.random() * Nscans);
        let to;
        while ((to = Math.floor(Math.random() * Nscans)) === tokenId);

        it("transfer of NFT copy fails", async function () {
            await expect(
                jpegMiner.connect(accounts[to]).transferFrom(accounts[tokenId].address, accounts[to].address, tokenId)
            ).to.be.revertedWith("ERC721: transfer caller is not owner nor approved");
        });

        it("transfer of NFT copy succeed", async function () {
            await expect(
                jpegMiner
                    .connect(accounts[tokenId])
                    .transferFrom(accounts[tokenId].address, accounts[to].address, tokenId)
            ).to.emit(jpegMiner, "Transfer");
        });
    });
});
