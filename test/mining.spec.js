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

const chunkTargetSize = 11527; // [Bytes]

describe("The Buterin Card", async function () {
    this.timeout(100000000);

    let jpegMiner;
    let chunks;
    let tree;

    before(async () => {
        // Compress image to progressive JPEG
        utils.toProgressiveJPEG("Buterin", "scan_script");

        // Open JPEG in binary
        const scans = utils.getScans("Buterin", "scan_script");

        // // Save JPEGs
        // utils.saveShardedJPEGs(scans, "Buterin", "scan_script");

        // Convert scans to B64
        scansB64 = utils.convertScansToB64(scans);

        // Save Base64 links
        utils.saveShardedJPEGSinB64(scansB64, "Buterin", "scan_script");

        // Aggregator function with memory
        const agg = (function () {
            let x = 0;
            return (y) => {
                x += y;
                return x;
            };
        })();

        // Further split scans to 'chunkTargetSize' bytes chunks
        chunks = scansB64.JpegScansB64.map((scanB64, index) => {
            let Nchunks = Math.round(scanB64.length / chunkTargetSize);
            if (Nchunks === 0) Nchunks = 1;
            const tokenIdLastInScan = agg(Nchunks) - 1;
            const tokenIdFirstInScan = tokenIdLastInScan + 1 - Nchunks;

            const chunkSize = Math.round(scanB64.length / Nchunks);

            const chunks = [];
            for (let i = 0; i < Nchunks - 1; i++) {
                chunks.push({
                    dataB64: scanB64.slice(i * chunkSize, (i + 1) * chunkSize),
                    tokenIdFirstInScan,
                    tokenIdLastInScan
                });
            }
            chunks.push({
                dataB64: scanB64.slice((Nchunks - 1) * chunkSize),
                tokenIdFirstInScan,
                tokenIdLastInScan
            });
            return chunks;
        }).flat();

        console.log("Number of chunks:", chunks.length);

        // Compute Merkle tree
        tree = StandardMerkleTree.of(
            chunks.map(({ dataB64, tokenIdLastInScan }, index) => [index, tokenIdLastInScan, dataB64]),
            ["uint256", "uint256", "string"]
        );
        console.log("Merkle Root:", tree.root);

        // Deploy JPEG Miner
        const JPEGminer = await ethers.getContractFactory("JPEGminer");
        jpegMiner = await JPEGminer.deploy(tree.root, scansB64.JpegHeaderB64, scansB64.JpegFooterB64);
    });

    it(`Mining`, async function () {
        for (let i = 0; i < chunks.length; i++) {
            console.log(`Chunk ${i}, ${Math.round(chunks[i].length / 2 ** 10)} KB`);

            // Wrong mining tests
            let indScan;
            while ((indScan = Math.floor(chunks.length * Math.random())) === i);
            await expect(jpegMiner.mine(chunks[indScan], tree.getProof(indScan))).to.be.reverted;

            // Right mining tests
            await expect(jpegMiner.mine(chunks[i], tree.getProof(i))).to.emit(jpegMiner, "Mined");

            const start = Date.now();
            await jpegMiner.tokenURI(i);
            const end = Date.now();
            console.log(`tokenURI: ${(end - start) / 60e3} min`);
        }
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
