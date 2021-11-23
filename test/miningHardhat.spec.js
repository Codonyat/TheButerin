const { expect } = require("chai");
const { ethers, waffle } = hre;
const utils = require("../scripts/functions.js");
const _ = require("lodash");
const fs = require("fs");
const gasPrice = ethers.BigNumber.from(require("../hardhat.config.js").networks.hardhat.gasPrice);
const { mean } = require("mathjs");

const gwei = ethers.BigNumber.from(10).pow(9);
const Nscans = 100;
let arrayOfScans;

describe("JPEG Miner", function () {
    let accounts;
    let jpegMiner;
    let deployGas;

    before(async () => {
        // Get accounts
        accounts = await ethers.getSigners();

        // Compress image to progressive JPEG
        utils.toProgressiveJPEG("Logan_3000x1000", "test");

        // Open JPEG in binary
        const scans = utils.getScans("test");

        // Save JPEGs
        utils.saveShardedJPEGs(scans);

        // Convert scans to B64
        const scansB64 = utils.convertScansToB64(scans);
        arrayOfScans = scansB64.JpegScansB64;

        // Save Base64 links
        utils.saveShardedJPEGSinB64(scansB64);

        // Compute hashes
        const hashes = utils.hashScans(scansB64.JpegScansB64);

        // Deploy JPEG Miner
        const JPEGminer = await ethers.getContractFactory("JPEGminer");
        jpegMiner = await JPEGminer.connect(accounts[Nscans]).deploy(scansB64.JpegHeaderB64, hashes);

        const tx = await jpegMiner.deployTransaction;
        deployGas = (await tx.wait()).gasUsed.toNumber();
    });

    it(`NSCANS()`, async function () {
        expect(await jpegMiner.NSCANS()).to.be.equal(Nscans);
    });

    const gasSpent = [];
    const totalGasArr = [];
    let minGas = Infinity;
    let maxGas = 0;
    let profit = ethers.constants.Zero;
    for (let i = 0; i < Nscans; i++) {
        describe(`Mining of ${i + 1}/${Nscans}`, function () {
            // Wrong mining tests
            it(`fails cuz wrong data`, async function () {
                let indScan;
                while ((indScan = Math.floor(Nscans * Math.random())) === i);

                await expect(
                    jpegMiner.connect(accounts[i]).mine(arrayOfScans[indScan], {
                        value: ethers.constants.WeiPerEther,
                        gasLimit: 6e6
                    })
                ).to.be.revertedWith("Wrong data");
            });

            if (i > 0) {
                it(`fails cuz user cannot mine twice`, async function () {
                    await expect(
                        jpegMiner.connect(accounts[i - 1]).mine(arrayOfScans[i], {
                            value: ethers.constants.WeiPerEther,
                            gasLimit: 6e6
                        })
                    ).to.be.revertedWith("Cannot mine more than once");
                });
            }

            it(`fails cuz no fee`, async function () {
                await expect(
                    jpegMiner.connect(accounts[i]).mine(arrayOfScans[i], {
                        gasLimit: 6e6
                    })
                ).to.be.revertedWith("ETH fee insufficient");
            });

            // Right mining tests
            const expectedGas = ethers.BigNumber.from(70707).mul(i).add(3000000);
            it(`succeeds`, async function () {
                const initialBalance = await waffle.provider.getBalance(accounts[i].address);

                const txResp = jpegMiner.connect(accounts[i]).mine(arrayOfScans[i], {
                    value: expectedGas.mul(gasPrice),
                    gasLimit: expectedGas.mul(11).div(10)
                });
                await expect(txResp).to.emit(jpegMiner, "Mined");

                const tx = await txResp;
                const { gasUsed, effectiveGasPrice } = await tx.wait();
                gasSpent.push(gasUsed.toNumber());

                const finalBalance = await waffle.provider.getBalance(accounts[i].address);

                totalGasArr.push(initialBalance.sub(finalBalance).div(gasPrice).toNumber());
                console.log("      ", Math.round((totalGasArr[i] / gasSpent[i] - 1) * 100), "% gas premium paid");

                const feeGas = effectiveGasPrice.mul(gasUsed);
                const feeMint = initialBalance.sub(finalBalance).sub(feeGas);

                profit = profit.add(feeMint);
            });

            it(` and the right fee is paid`, async function () {
                expect(totalGasArr[i]).to.be.closeTo(expectedGas, expectedGas.div(10));
            });

            let phase;
            if (i <= 10) phase = "Black & White";
            else if (i <= 32) phase = "Color";
            else phase = "Resolution";

            // // Properties
            // let tokenURI;
            // it(`tokenURI()`, async function () {
            //     tokenURI = JSON.parse(await jpegMiner.tokenURI(i, { gasLimit: 300e6 }));
            //     expect(tokenURI.name).to.be.equal(`JPEG Mining: ${i + 1} of ${Nscans} copies`);

            //     fs.writeFileSync(`${__dirname}/images/test${String(i).padStart(3, "0")}B64.txt`, tokenURI.image);

            //     expect(tokenURI.attributes[0].trait_type).to.be.equal("kilobytes");
            //     expect(tokenURI.attributes[0].value).to.be.greaterThan(0);

            //     expect(tokenURI.attributes[1].trait_type).to.be.equal("phase");
            //     expect(tokenURI.attributes[1].value).to.be.equal(phase);
            // }).timeout(1000000);

            // it(`imageURI()`, async function () {
            //     expect(await jpegMiner.imageURI(i, { gasLimit: 300e6 })).to.be.equal(tokenURI.image);
            // }).timeout(1000000);

            it(`getPhase()`, async function () {
                expect(await jpegMiner.getPhase(i)).to.be.equal(phase);
            });

            it(`ownerOf()`, async function () {
                expect(await jpegMiner.ownerOf(i)).to.be.equal(accounts[i].address);
            });
        });
    }

    describe("Final mining checks", function () {
        it(`mining of ${Nscans + 1}/${Nscans} fails cuz it is over`, async function () {
            await expect(
                jpegMiner.connect(accounts[Nscans + 1]).mine("Dummy data here", {
                    value: ethers.constants.WeiPerEther,
                    gasLimit: 6e6
                })
            ).to.be.revertedWith("Mining is over");
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

        // it("gas spent by tokenURI() is less than 10 blocks worth of gas", async function () {
        //     const gasTokenURI = (
        //         await jpegMiner.estimateGas.tokenURI(99, {
        //             gasLimit: 100e6
        //         })
        //     ).toNumber();
        //     expect(gasTokenURI).to.be.at.most(10 * 30e6);
        //     console.log("Gas spent on eth_call of tokenURI() when full image is uploaded is", gasTokenURI);
        // }).timeout(1000000);

        it("balance in SC is correct", async function () {
            expect(await waffle.provider.getBalance(jpegMiner.address)).to.be.equal(profit);
        });
    });

    after(async () => {
        console.log(
            deployGas,
            "gas (",
            Number(ethers.utils.formatEther(gasPrice.mul(deployGas))),
            "ETH) used for contract deployment"
        );

        console.log(
            "Min paid gas is",
            Math.min(...totalGasArr),
            "which @ price of 100 gwei is",
            Number(ethers.utils.formatEther(gasPrice.mul(Math.min(...totalGasArr)))),
            "ETH"
        );
        console.log(
            "Max paid gas is",
            Math.max(...totalGasArr),
            "which @ price of 100 gwei is",
            Number(ethers.utils.formatEther(gasPrice.mul(Math.max(...totalGasArr)))),
            "ETH"
        );

        console.log("Total gas per mining is", totalGasArr);
    });

    describe("Withdrawal", function () {
        it(" of ETH fails when it is not the owner", async function () {
            await expect(jpegMiner.connect(accounts[0]).withdrawEth()).to.be.revertedWith(
                "Ownable: caller is not the owner"
            );
        });

        it(" of ETH succeeds when it is the owner", async function () {
            await expect(await jpegMiner.connect(accounts[Nscans]).withdrawEth()).to.changeEtherBalance(
                accounts[Nscans],
                profit
            );
        });

        it("SC is empty of ETH", async function () {
            expect(await waffle.provider.getBalance(jpegMiner.address)).to.be.equal(0);
        });
    });
});
