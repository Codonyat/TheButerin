require("@nomiclabs/hardhat-waffle");

module.exports = {
    solidity: {
        compilers: [
            {
                version: "0.7.3"
            },
            {
                version: "0.8.4",
                settings: {}
            }
        ]
    },
    networks: {
        hardhat: {
            gasPrice: 1e11, // 100 gwei
            accounts: {
                count: 101
            },
            chainId: 1337
        },
        rinkeby: {
            gasPrice: 1000000008, // 1 gwei
            url: "https://rinkeby.infura.io/v3/2f6e2beaa8ff4621b832fa9ec113bd11",
            accounts: ["0x47dfe5cadbb4c8fe8dc3f2b7d1e9348ea3681e7bcc73d26013e41be13409d516"]
            // address: 0x9aE075025245E05eFD180a65fde8E258712493b5
            // pubKey: 0x0475fd443c00f246e45d46accd18f7ed8ef31bdb0f65aba08908430905e95591fa4a5a867a8c649c1f64c21332759e9ce824a7790199f84353819d3dfc488e7245
            // privKey: 0x47dfe5cadbb4c8fe8dc3f2b7d1e9348ea3681e7bcc73d26013e41be13409d516
        }
    }
};
