const { imageScans, gasMintingFees, address } = require("../frontend/src/contracts/contractParams.json");

const gwei = ethers.utils.parseUnits("1", "gwei");

// Quick mine on Rinkeby
(async function main() {
    // This is just a convenience check
    if (network.name !== "rinkeby") {
        throw new Error("Not rinkeby!");
    }

    // Get accounts
    accounts = await ethers.getSigners();

    // Get wallet
    const wallet = new ethers.Wallet(
        "0x47dfe5cadbb4c8fe8dc3f2b7d1e9348ea3681e7bcc73d26013e41be13409d516",
        ethers.provider
    );
    console.log("Wallet balance:", ethers.utils.formatEther(await wallet.getBalance()), "ETH");

    // Get artifact
    const JPEGminer = await ethers.getContractFactory("JPEGminer");
    const jpegMiner = await JPEGminer.attach(address);

    for (i = 63; i < 100; i++) {
        console.log(`Mining #${i}`);

        // Transfer ETH from account 101
        await (
            await wallet.sendTransaction({
                to: accounts[i].address,
                value: ethers.utils.parseEther("0.03")
            })
        ).wait();

        // Send tx
        const totalGas = ethers.BigNumber.from(70707).mul(i).add(3000000);
        const mintGas = gasMintingFees[i];
        const gasLimit = totalGas.sub(mintGas).mul(11).div(10);

        // console.log(ethers.utils.formatEther(gwei.mul(31).div(10).mul(mintGas)));
        await jpegMiner.connect(accounts[i]).mine(imageScans[i], {
            value: gwei.mul(31).div(10).mul(mintGas),
            maxFeePerGas: gwei.mul(2),
            maxPriorityFeePerGas: gwei.mul(11).div(10),
            gasLimit
        });
    }
})();
