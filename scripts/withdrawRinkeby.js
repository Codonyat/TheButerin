const { imageScans, gasMintingFees, address } = require("../frontend/src/contracts/contractParams.json");

const gwei = ethers.utils.parseUnits("1", "gwei");

// Quick mine on Rinkeby
(async function main() {
    // This is just a convenience check
    if (network.name !== "rinkeby") {
        throw new Error("Not rinkeby!");
    }

    // Get wallet
    const wallet = new ethers.Wallet(
        "0x47dfe5cadbb4c8fe8dc3f2b7d1e9348ea3681e7bcc73d26013e41be13409d516",
        ethers.provider
    );
    console.log("Wallet balance:", ethers.utils.formatEther(await wallet.getBalance()), "ETH");

    // Get artifact
    const JPEGminer = await ethers.getContractFactory("JPEGminer");
    const jpegMiner = await JPEGminer.attach(address);

    [user] = await ethers.getSigners();
    console.log(user.address);
    await jpegMiner.connect(user).withdrawEth({
        maxFeePerGas: gwei.mul(2),
        maxPriorityFeePerGas: gwei.mul(11).div(10),
        gasLimit: 1e5
    });
})();
