const fs = require("fs");

// This file is only here to make interacting with the Dapp easier,
// feel free to ignore it if you don't need it.

task("faucet", "Sends ETH to an address").setAction(async () => {
    console.log(network);
    if (network.name === "hardhat") {
        console.warn(
            "You are running the faucet task with Hardhat network, which" +
                " gets automatically created and destroyed every time. Use the Hardhat" +
                " option '--network localhost'"
        );
    }

    const [sender] = await ethers.getSigners();

    const tx = await sender.sendTransaction({
        to: "0x9869cE7745393eBb9ABE6eE84fE0C483230de912",
        value: ethers.constants.WeiPerEther.mul(100)
    });
    await tx.wait();

    console.log("Transferred 100 ETH");
});
