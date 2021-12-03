import React from "react";
import { ethers } from "ethers";

// Contract artifact
import JPEGminerArtifact from "../contracts/JPEGminer.json";

// Other contract data
import { imageScans, gasMintingFees, chainId, address } from "../contracts/contractParams.json";

// React components
import { ErrorMessage } from "./ErrorMessage";
import { ConnectWallet } from "./ConnectWallet";
import { Mine } from "./Mine";
import { Instructions } from "./Instructions";

// This is an error code that indicates that the user canceled a transaction
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

// Networks chain Ids
const MAINNET_ID = 1;
const RINKEBY_ID = 4;
const HARDHAT_ID = 31337;

export class DappMiner extends React.Component {
    imageScans = imageScans;
    gasMintingFees = gasMintingFees;

    constructor(props) {
        super(props);

        // All state properties
        this.state = {
            nextScan: undefined,
            maxFeeWeiNext: undefined,
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
            // Properties that depend on the user account
            canMine: true,
            selectedAddress: undefined,
            errorMessage: undefined,
            connectMessage: undefined,
            web3: true
        };

        // Initial state that will be used when user changes account
        this.initialState = {
            canMine: true,
            selectedAddress: undefined,
            errorMessage: undefined,
            connectMessage: undefined,
            web3: true
        };

        // Our own provider
        if (chainId === HARDHAT_ID) {
            this._provider = ethers.getDefaultProvider("http://localhost:8545");
        } else if (chainId === MAINNET_ID || chainId === RINKEBY_ID) {
            this._provider = new ethers.providers.InfuraProvider(chainId, {
                projectId: "2f6e2beaa8ff4621b832fa9ec113bd11"
            });
        } else {
            throw new Error("Wrong network");
        }

        // Contract instance
        this._jpegMiner = new ethers.Contract(address, JPEGminerArtifact.abi, this._provider);
    }

    render() {
        // If everything is loaded, we render the application.
        return (
            <div
                className="container p-4"
                style={{
                    maxWidth: "720px",
                    height: "100%"
                }}
            >
                <div className="container py-3">
                    <ConnectWallet
                        connectWallet={() => this._connectWallet()}
                        message={this.state.connectMessage || this.state.selectedAddress}
                        web3={this.state.web3}
                    />
                </div>

                <div
                    className="container text-start py-3"
                    style={{
                        backgroundImage: 'url("minecraft-diamond-light.jpg")',
                        backgroundPosition: "center center",
                        backgroundRepeat: "no-repeat"
                    }}
                >
                    <Instructions />
                </div>

                <div className="container py-3">
                    {/* ADD QUESTION MARK NEXT TO INPUT ETH AMOUNT THAT EXPLAINS THIS IS THE ESTIMATED MINTING FEE IN ADDITION TO THE TX FEE, AND ALSO SPECIFIES HOW MUCH GAS MUST BE PAID */}
                    {this.state.web3 && this.state.nextScan < 100 && (
                        <Mine
                            mineFunc={(amount) => this._mine(amount)}
                            maxFeeETH={() => {
                                if (this.state.maxFeeWeiNext === undefined) return "Amount ETH";

                                const remainder = this.state.maxFeeWeiNext.mod(1e14);
                                return `~${ethers.utils.formatEther(this.state.maxFeeWeiNext.sub(remainder))} ETH`;
                            }}
                            next={this.state.nextScan}
                            enable={this.state.canMine}
                        />
                    )}
                </div>

                {this.state.errorMessage && (
                    <div className="p-3 m-auto rounded-3" style={{ backgroundColor: "Lavender", maxWidth: "500px" }}>
                        <ErrorMessage errorMessage={this.state.errorMessage} />
                    </div>
                )}
            </div>
        );
    }

    componentDidMount() {
        if (!this._checkWeb3()) return;

        // Start polling gas prices
        this.gasInterval = setInterval(() => this._updateGasParams(), 12000);

        // Listen for mining events
        this._jpegMiner.on(this._jpegMiner.filters.Mined(), () => {
            this._getNext();
        });
        this._getNext().then(this._updateGasParams.bind(this));

        // CONNECT EVEN IF IT IS ON THE WRONG NETWORK, BUT SHOW MESSAGE IN CONNECT BUTTON!!
        // If wallet is unlocked and on the right network, then import address without asking the user
        if (window.ethereum._metamask !== undefined) {
            window.ethereum._metamask.isUnlocked().then((isUnlocked) => {
                if (isUnlocked) this._initializeUser();
            });
        }

        this._startListeners();
    }

    componentWillUnmount() {
        // Stop polling gas prices
        clearInterval(this.gasInterval);
        this.gasInterval = undefined;

        this._stopListeners();
    }

    // HANDLE ERRORS SUCH AS INFURA DOES NOT REPLY!!
    async _getNext() {
        let nextScan;
        try {
            nextScan = (await this._jpegMiner.totalSupply()).toNumber();
        } catch (error) {
            this.setState({
                errorMessage: this._getRpcErrorMessage(error)
            });
            return;
        }

        this.setState({ nextScan });
        if (nextScan >= 100) {
            this.setState({
                errorMessage: "100 Mined JPEGS... Mining is over!\nCongratulations everyone that participated."
            });
        }
    }

    _checkWeb3() {
        if (window.ethereum === undefined) {
            this.setState({
                web3: false,
                connectMessage: "Install Metamask"
            });
            return false;
        }

        this.setState({
            web3: true
        });
        return true;
    }

    async _connectWallet() {
        // Change the network if necessary
        if (!this._checkNetwork()) {
            try {
                await window.ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: ethers.utils.hexValue(chainId) }]
                });
            } catch (switchError) {
                // No need to call wallet_addEthereumChain because it is mainnet.
                // DISABLE MINE() AND OUTPUT MESSAGE

                this.setState({
                    // errorMessage: "this._getRpcErrorMessage(switchError)"
                    connectMessage: "Connect to Ethereum mainnet"
                });
                return;
            }
        }

        this._initializeUser();
    }

    _getRpcErrorMessage(error) {
        if (error.data) {
            return error.data.message;
        }

        return error.message;
    }

    async _initializeUser() {
        if (!this._checkNetwork()) {
            this._resetUser();
            this.setState({
                connectMessage: "Change to Ethereum Mainnet"
            });
        } else {
            // Get address
            let selectedAddress;
            try {
                [selectedAddress] = await window.ethereum.request({ method: "eth_requestAccounts" });
            } catch (error) {
                this.setState({
                    errorMessage: this._getRpcErrorMessage(error)
                });
                return;
            }

            // We first store the user's address in the component's state
            this.setState({
                selectedAddress
            });

            // Get miner state
            this._updateMinerState();

            // Initialize user provider
            this._signer = new ethers.providers.Web3Provider(window.ethereum).getSigner(0);
        }

        this._startListeners();
    }

    _startListeners() {
        if (window.ethereum === undefined) return;

        // Add listener in case user changes network if necessary
        if (window.ethereum.listenerCount(["chainChanged"]) === 0) {
            window.ethereum.on("chainChanged", () => {
                window.location.reload();
            });
        }

        // We reinitialize it whenever the user changes their account.
        if (window.ethereum.listenerCount(["accountsChanged"]) === 0) {
            window.ethereum.on("accountsChanged", (addrArray) => {
                window.location.reload();
            });
        }
    }

    _stopListeners() {
        if (window.ethereum === undefined) return;

        window.ethereum.removeAllListeners(["chainChanged", "accountsChanged"]);
    }

    async _updateMinerState() {
        let Ncopies;
        try {
            Ncopies = await this._jpegMiner.balanceOf(this.state.selectedAddress);
        } catch (error) {
            this.setState({
                errorMessage: this._getRpcErrorMessage(error)
            });
            return;
        }

        const canMine = Ncopies.toNumber() === 0;
        this.setState({
            canMine,
            errorMessage: canMine ? undefined : "Cannot mine if you own 1 Mined JPEG (MJ) already."
        });
    }

    async _updateGasParams() {
        if (this.state.nextScan >= 100) {
            // Stop polling gas prices
            clearInterval(this.gasInterval);
            this.gasInterval = undefined;
            return;
        }

        let resp;
        try {
            resp = await fetch("https://api.gasprice.io/v1/estimates");
        } catch (error) {
            this.setState({
                errorMessage: this._getRpcErrorMessage(error)
            });
            return;
        }

        const {
            result: {
                fast: { feeCap, maxPriorityFee }
            }
        } = await resp.json();

        const maxFeePerGas = ethers.utils.parseUnits(feeCap.toFixed(9).toString(), "gwei");
        const maxPriorityFeePerGas = ethers.utils.parseUnits(maxPriorityFee.toFixed(9).toString(), "gwei");

        this.setState({
            maxFeePerGas,
            maxPriorityFeePerGas
        });

        if (this.state.nextScan !== undefined) {
            const maxFeeWeiNext = maxFeePerGas.mul(gasMintingFees[this.state.nextScan]);
            this.setState({
                maxFeeWeiNext
            });
        }

        // // @debug
        // if (chainId === HARDHAT_ID && maxFeePerGas !== undefined) {
        //     this._provider.send("hardhat_setNextBlockBaseFeePerGas", [maxFeePerGas.toHexString()]);
        // }
    }

    // Mine JPEG
    async _mine(amount) {
        if (this.state.nextScan >= 100) return;
        await this._connectWallet();

        try {
            // Get user input or estimate eth
            const wei = amount === "" ? this.state.maxFeeWeiNext : ethers.utils.parseEther(amount);

            // Compute tx gas based on the formula for the total gas
            const totalGas = ethers.BigNumber.from(70707).mul(this.state.nextScan).add(3000000);
            const mintGas = gasMintingFees[this.state.nextScan];
            const gasLimit = totalGas.lt(mintGas) ? 1e5 : totalGas.sub(mintGas).add(1e5);

            // Send tx
            await this._jpegMiner.connect(this._signer).mine(imageScans[this.state.nextScan], {
                value: wei,
                maxFeePerGas: this.state.maxFeePerGas,
                maxPriorityFeePerGas: this.state.maxPriorityFeePerGas,
                gasLimit
            });

            // Update miner state
            this._updateMinerState();
        } catch (error) {
            // If user did not reject the tx, show what was the error
            if (error.code !== ERROR_CODE_TX_REJECTED_BY_USER) {
                this.setState({
                    errorMessage: this._getRpcErrorMessage(error)
                });
            }
        }
    }

    // Turns an RPC error into a human readable message.
    _getRpcErrorMessage(error) {
        if (error.data) {
            return error.data.message;
        }

        return error.message;
    }

    // This method resets the state
    _resetUser() {
        this.setState(this.initialState);
    }

    // This method checks if Metamask selected network is Localhost:8545
    _checkNetwork() {
        if (Number(window.ethereum.networkVersion) === chainId) {
            return true;
        }

        return false;
    }
}
