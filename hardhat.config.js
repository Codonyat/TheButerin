require("@nomiclabs/hardhat-waffle");

require("./tasks/scans");
require("hardhat-gas-reporter");

module.exports = {
    solidity: {
        compilers: [
            {
                version: "0.7.3",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200
                    }
                }
            },
            {
                version: "0.8.17"
                // settings: {
                //     optimizer: {
                //         enabled: true,
                //         runs: 1
                //     }
                // }
            }
        ]
    },
    networks: {
        hardhat: {
            // gasPrice: 1e9, // 100 gwei
            // initialBaseFeePerGas: 1e9,
            gasLimit: 3e7,
            blockGasLimit: 3e7
            // accounts: {
            //     count: 102,
            //     mnemonic: "test test test test test test test test test test test junk"
            // }
            // chainId: 1337
        },
        rinkeby: {
            gasPrice: 1100000000, // 1.1 gwei
            url: "https://rinkeby.infura.io/v3/2f6e2beaa8ff4621b832fa9ec113bd11",
            // accounts: {
            //     count: 102,
            //     mnemonic: "test test test potato test test test test test test test junk"
            // }
            accounts: ["0x47dfe5cadbb4c8fe8dc3f2b7d1e9348ea3681e7bcc73d26013e41be13409d516"]
            // address: 0x9aE075025245E05eFD180a65fde8E258712493b5
            // pubKey: 0x0475fd443c00f246e45d46accd18f7ed8ef31bdb0f65aba08908430905e95591fa4a5a867a8c649c1f64c21332759e9ce824a7790199f84353819d3dfc488e7245
            // privKey: 0x47dfe5cadbb4c8fe8dc3f2b7d1e9348ea3681e7bcc73d26013e41be13409d516
        },
        mainnet: {
            chainId: 1,
            url: "https://mainnet.infura.io/v3/2f6e2beaa8ff4621b832fa9ec113bd11",
            gasMultiplier: 1
        }
    }
};
