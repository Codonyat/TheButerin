import React from "react";

// We'll use ethers to interact with the Ethereum network and our contract
import { ethers } from "ethers";

// We import the contract's artifacts and address here, as we are going to be
// using them with ethers
import JPEGminerArtifact from "../contracts/JPEGminer.json";
import { imageScans, gasMintingFees, chainId, address } from "../contracts/contractParams.json";

// All the logic of this dapp is contained in the Dapp component.
// These other components are just presentational ones: they don't have any
// logic. They just render HTML.
import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Mine } from "./Mine";

// const gwei = ethers.BigNumber.from(10).pow(9);

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
            selectedAddress: undefined
        };

        // Initial state that will be used when user changes account
        this.initialState = {
            canMine: true,
            selectedAddress: undefined
        };

        // Our own provider
        if (chainId === HARDHAT_ID) {
            this._provider = ethers.getDefaultProvider("http://localhost:8545");
        } else if (chainId === MAINNET_ID || chainId === RINKEBY_ID) {
            this._provider = ethers.getDefaultProvider(chainId, {
                infura: {
                    projectId: "2f6e2beaa8ff4621b832fa9ec113bd11",
                    projectSecret: "c214e9dc47164d50837d1bd878bea3be"
                }
            });
        } else {
            throw new Error("Wrong network");
        }

        // Contract instance
        this._jpegMiner = new ethers.Contract(address, JPEGminerArtifact.abi, this._provider);
    }

    componentDidMount() {
        // Start polling gas prices
        this.gasInterval = setInterval(() => this._updateGasParams(), 12000);

        // HANDLE ERRORS SUCH AS INFURA DOES NOT REPLY!!
        // Listen for mining events
        this._jpegMiner.on(this._jpegMiner.filters.Mined(), (param1, param2) => {
            this._getNext();
        });
        this._getNext();

        this._updateGasParams();

        // Find out if wallet is unlocked and on the right network
        if (window.ethereum.isConnected()) this._connectWallet(false);

        // We reinitialize it whenever the user changes their account.
        window.ethereum.on("accountsChanged", (addrArray) => {
            // If user is locking wallet
            if (addrArray.length === 0) {
                return this._resetMinerState();
            }

            // If user is changing account
            this._connectWallet(true);
        });
    }

    // HANDLE ERRORS SUCH AS INFURA DOES NOT REPLY!!
    async _getNext() {
        const nextScan = await this._jpegMiner.totalSupply();
        this.setState({ nextScan: nextScan.toNumber() });
    }

    componentWillUnmount() {
        // Stop polling gas prices
        clearInterval(this.gasInterval);
        this.gasInterval = undefined;
    }

    render() {
        // If everything is loaded, we render the application.
        return (
            <div
                className="container p-4"
                style={{
                    maxWidth: "720px",
                    backgroundImage: 'url("minecraft-diamond-pickaxe-cosplay-foam.jpg")',
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    height: "100%"
                }}
            >
                <div className="container p-3">
                    <ConnectWallet
                        connectWallet={() => this._connectWallet(true)}
                        selectedAddress={this.state.selectedAddress}
                    />
                </div>

                <div className="container text-start p-3">
                    {/* USE MINECRAFT FONT?
                        STYLE LIST
                    */}
                    <p>
                        Collective effort to <span style={{ fontStyle: "italic" }}>JPEG-mine</span> the largest on-chain
                        image (<span style={{ fontWeight: "bold" }}>1 MB</span>) on Ethereum.
                    </p>
                    <p>
                        <span style={{ fontWeight: "bold" }}>JPEG-mining</span> is like minting but you also upload a
                        piece of JPEG data in the process.
                    </p>
                    <p>
                        Thanks to the forgotten{" "}
                        <span style={{ fontWeight: "bold" }}>
                            <a href="https://www.liquidweb.com/kb/what-is-a-progressive-jpeg/" className="text-reset">
                                progressive JPEG
                            </a>
                        </span>{" "}
                        tech from the 56k-modem era, the image is viewable during the entire mining process.
                    </p>
                    <p>
                        The JPEG is split in <span style={{ fontWeight: "bold" }}>100 pieces</span> of data and each
                        miner gets a unique JPEG with different degrees of quality:
                    </p>
                    <ul>
                        <li>
                            #0 - #10 are in{" "}
                            <span style={{ fontWeight: "bold", backgroundColor: "white", color: "black" }}>black</span>&
                            <span
                                style={{
                                    fontWeight: "bold",
                                    backgroundColor: "black",
                                    color: "white"
                                }}
                            >
                                white
                            </span>
                        </li>
                        <li>
                            #11 - #32 introduce{" "}
                            <span
                                style={{
                                    fontWeight: "bold",
                                    background: "red",
                                    background:
                                        "-webkit-linear-gradient(to left, violet, indigo, blue, green, yellow, orange, red)",
                                    background:
                                        "-o-linear-gradient(to left, violet, indigo, blue, green, yellow, orange, red)",
                                    background:
                                        "-moz-linear-gradient(to left, violet, indigo, blue, green, yellow, orange, red)",
                                    background:
                                        "linear-gradient(to left, violet, indigo, blue, green, yellow, orange, red)",
                                    WebkitBackgroundClip: "text",
                                    color: "transparent"
                                }}
                            >
                                color
                            </span>{" "}
                            to the image
                        </li>
                        <li>
                            #33 - #98 improve the{" "}
                            <span style={{ fontWeight: "bold", fontSize: "large" }}>resolution</span>
                        </li>
                        <li>
                            #99 gets the <span style={{ fontWeight: "bold" }}>final image</span>
                        </li>
                    </ul>
                    INCLUDE PHOTO HERE OF THE PHASES
                    <p>
                        The total cost (tx fee + minting fee) is{" "}
                        <span style={{ fontWeight: "bold" }}>denonimanted in gas</span>, and therefore it fluctuates
                        with gas prices! (<span style={{ fontWeight: "bold" }}>Trick</span>: wait for low gas prices)
                    </p>
                    {/* <p>
                        Any <span style={{ fontWeight: "bold" }}>ETH paid in excess is returned back</span> so do not
                        worry about overpaying.
                    </p> */}
                    <p>For #0 mining costs 3M gas (minting + tx fee), and increases up to 10M gas for #99.</p>
                    {/* <ul>
                        <li>Previous cost of mining: X gas</li>
                        <li>Current cost of mining: Y gas</li>
                        <li>Next cost of mining: Z gas</li>
                    </ul> */}
                    <p>Good mining (gm)</p>
                </div>

                <div className="container p-3">
                    {/* ADD QUESTION MARK NEXT TO INPUT ETH AMOUNT THAT EXPLAINS THIS IS THE ESTIMATED MINTING FEE IN ADDITION TO THE TX FEE, AND ALSO SPECIFIES HOW MUCH GAS MUST BE PAID */}
                    {this.state.canMine && window.ethereum !== undefined && (
                        <Mine
                            mineFunc={(amount) => this._mine(amount)}
                            maxFeeETH={() => {
                                if (this.state.maxFeeWeiNext === undefined) return "Amount ETH";

                                const remainder = this.state.maxFeeWeiNext.mod(1e14);
                                return `~${ethers.utils.formatEther(this.state.maxFeeWeiNext.sub(remainder))} ETH`;
                            }}
                            next={this.state.nextScan}
                        />
                    )}
                    {!this.state.canMine && (
                        <p className="text-center" style={{ color: "red" }}>
                            Cannot mine if you own 1 Mined JPEG.
                        </p>
                    )}

                    {window.ethereum === undefined && (
                        <p className="text-center" style={{ color: "red" }}>
                            Install Metamask
                        </p>
                    )}
                </div>
            </div>
        );
    }

    async _connectWallet(userTriggered) {
        // If Metamask is not unlocked, do not request the user to sign in their wallet
        if (
            !userTriggered &&
            window.ethereum._metamask !== undefined &&
            !(await window.ethereum._metamask.isUnlocked())
        )
            return;

        // Once we have the address, we can initialize the application.

        // First we check the network
        if (!this._checkNetwork()) {
            if (!userTriggered) return;

            try {
                await window.ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: ethers.utils.hexValue(chainId) }]
                });
            } catch (undefined) {
                // No need to add network because it is mainnet.
                // DISABLE MINE() AND OUTPUT MESSAGE

                return;
            }
        }

        this._initializeUser();

        // We reset the dapp state if the network is changed
        // CONNECT OR DISCONNECT AS NEEDED
        if (window.ethereum.listenerCount(["chainChanged"]) === 0) {
            window.ethereum.on("chainChanged", ([chainId]) => {
                // THIS LISTENER IS NOT TRIGGERED!?
                // SHOULD I REMOVE THE LISTENER UPON DISCONNECT?
                this._initializeUser();
                window.location.reload();
            });
        }
    }

    async _initializeUser() {
        // User's address
        const arrAddr = await window.ethereum.request({ method: "eth_requestAccounts" });

        // We first store the user's address in the component's state
        this.setState({
            selectedAddress: arrAddr.length > 0 ? arrAddr[0] : undefined
        });

        // Get miner state
        this._updateMinerState();

        // Initialize user provider
        this._signer = new ethers.providers.Web3Provider(window.ethereum).getSigner(0);
    }

    async _updateMinerState() {
        // HANDLE ERRORS SUCH AS INFURA DOES NOT REPLY!!
        const Ncopies = await this._jpegMiner.balanceOf(this.state.selectedAddress);
        this.setState({ canMine: Ncopies.toNumber() === 0 });
    }

    async _updateGasParams() {
        // DO SMTH TO DEAL WITH FAILED REQUESTS
        const resp = await fetch("https://api.gasprice.io/v1/estimates");
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

        if (chainId === HARDHAT_ID) {
            this._provider.send("hardhat_setNextBlockBaseFeePerGas", [maxFeePerGas.toHexString()]);
        }
    }

    // Mine JPEG
    async _mine(amount) {
        await this._connectWallet(true);

        try {
            // If a transaction fails, we save that error in the component's state.
            // We only save one such error, so before sending a second transaction, we
            // clear it.
            this._dismissTransactionError();

            // MAKE SURE INPUT CAN ONLY ACCEPT DECIMAL NUMBERS!
            const wei = amount === "" ? this.state.maxFeeWeiNext : ethers.utils.parseEther(amount);

            const tx = await this._jpegMiner.connect(this._signer).mine(imageScans[this.state.nextScan], {
                value: wei,
                maxFeePerGas: this.state.maxFeePerGas,
                maxPriorityFeePerGas: this.state.maxPriorityFeePerGas
            });

            // We use .wait() to wait for the transaction to be mined. This method
            // returns the transaction's receipt.
            const receipt = await tx.wait();

            // The receipt, contains a status flag, which is 0 to indicate an error.
            if (receipt.status === 0) {
                // We can't know the exact error that made the transaction fail when it
                // was mined, so we throw this generic one.
                throw new Error("Transaction failed");
            }

            // Update miner state
            await this._updateMinerState();
        } catch (error) {
            // If user rejected a tx, we do nothing.
            if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
                return;
            }
        }
    }

    // This is an utility method that turns an RPC error into a human readable
    // message.
    _getRpcErrorMessage(error) {
        if (error.data) {
            return error.data.message;
        }

        return error.message;
    }

    // This method resets the state
    _resetMinerState() {
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
