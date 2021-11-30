import React from "react";

// We'll use ethers to interact with the Ethereum network and our contract
import { ethers } from "ethers";

// We import the contract's artifacts and address here, as we are going to be
// using them with ethers
import JPEGminerArtifact from "../contracts/JPEGminer.json";
import contractAddress from "../contracts/contractData.json";

// All the logic of this dapp is contained in the Dapp component.
// These other components are just presentational ones: they don't have any
// logic. They just render HTML.
import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Mine } from "./Mine";

// const gwei = ethers.BigNumber.from(10).pow(9);

// This is an error code that indicates that the user canceled a transaction
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

// This component is in charge of doing these things:
//   1. It connects to the user's wallet
//   2. Initializes ethers and the JPEGminer contract
//   3. Polls the user state in JPEGminer
//   4. Mines NFT
//   5. Renders the whole application
//
export class DappMiner extends React.Component {
    imageScans = contractAddress.imageScans;

    constructor(props) {
        super(props);

        // All state properties
        this.state = {
            nextScan: undefined,
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
            // Properties that depend on the user account
            canMine: undefined,
            selectedAddress: undefined,
            txBeingSent: undefined,
            transactionError: undefined,
            networkError: undefined
        };

        // Initial state that will be used when user changes account
        this.initialState = {
            // Miner's data
            canMine: undefined,
            // The user's address
            selectedAddress: undefined,
            // The ID about transactions being sent, and any possible error with them
            txBeingSent: undefined,
            transactionError: undefined,
            networkError: undefined
        };

        // Our own provider
        if (contractAddress.chainId === 31337) {
            this._provider = ethers.getDefaultProvider("http://localhost:8545");
        } else if (contractAddress.chainId === 1 || contractAddress.chainId === 4) {
            this._provider = ethers.getDefaultProvider(contractAddress.chainId, {
                infura: {
                    projectId: "2f6e2beaa8ff4621b832fa9ec113bd11",
                    projectSecret: "c214e9dc47164d50837d1bd878bea3be"
                }
            });
        } else {
            throw new Error("Wrong network");
        }

        // Contract instance
        this._jpegMiner = {
            read: new ethers.Contract(contractAddress.JPEGminer, JPEGminerArtifact.abi, this._provider)
        };

        // Listen for mining events
        this._jpegMiner.read.on(
            {
                address: contractAddress.JPEGminer,
                topics: [ethers.utils.id("Mined(address,string)")]
            },
            (log, event) => {
                console.log(log);
                console.log(event);
            }
        );
    }

    componentDidMount() {
        // Start polling gas prices
        this.gasInterval = setInterval(() => this._updateGasParams(), 12000);
    }

    componentWillUnmount() {
        // Stop polling gas prices
        clearInterval(this.gasInterval);
        this.gasInterval = undefined;

        this._stopPollingMinerData();
    }

    render() {
        // Ethereum wallets inject the window.ethereum object. If it hasn't been
        // injected, we instruct the user to install MetaMask.
        if (window.ethereum === undefined) {
            return <NoWalletDetected />;
        }

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
                        connectWallet={() => this._connectWallet()}
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
                        <span style={{ fontWeight: "bold" }}>JPEG-miners</span> are NFT minters who upload a piece of
                        JPEG data in the process of minting.
                    </p>
                    <p>
                        Thanks to the forgotten{" "}
                        <span style={{ fontWeight: "bold" }}>
                            <a href="https://www.liquidweb.com/kb/what-is-a-progressive-jpeg/" className="text-reset">
                                progressive JPEG
                            </a>
                        </span>{" "}
                        technology used in the era of 56k-modems, the image is viewable during the entire mining
                        process.
                    </p>
                    <p>
                        The JPEG is split in <span style={{ fontWeight: "bold" }}>100 shards</span> of data and each
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
                    <p>
                        The total cost (tx fee + minting fee) is{" "}
                        <span style={{ fontWeight: "bold" }}>denonimanted in gas</span>, and therefore it fluctuates
                        with gas prices! (Trick: wait for low gas prices)
                    </p>
                    <p>
                        Any <span style={{ fontWeight: "bold" }}>ETH paid in excess is returned back</span> so do not
                        worry about overpaying.
                    </p>
                    <p>
                        Total <span style={{ fontWeight: "bold" }}>gas cost grows linearly</span> with each subsquent
                        mining:
                    </p>
                    <ul>
                        <li>Previous cost of mining: X gas</li>
                        <li>Current cost of mining: Y gas</li>
                        <li>Next cost of mining: Z gas</li>
                    </ul>
                    <p>Good mining (gm)</p>
                </div>

                <div className="container p-3">
                    {!this.state.canMine && this.state.selectedAddress && (
                        <p>You cannot mine if you own 1 or more already.</p>
                    )}

                    {/* ADD QUESTION MARK NEXT TO INPUT ETH AMOUNT THAT EXPLAINS THIS IS THE ESTIMATED MINTING FEE IN ADDITION TO THE TX FEE */}
                    <Mine
                        mineFunc={(amount) => this._mine(amount)}
                        maxFeeWei={this.state.maxFeePerGas}
                        next={this.state.nextScan}
                    />
                </div>
            </div>
        );
    }

    _calcMaxFeeWei() {
        this.state.maxFeePerGas;
    }

    async _connectWallet() {
        // This method is run when the user clicks the Connect. It connects the
        // dapp to the user's wallet, and initializes it.

        // To connect to the user's wallet, we have to run this method.
        // It returns a promise that will resolve to the user's address.
        const [selectedAddress] = await window.ethereum.request({ method: "eth_requestAccounts" });

        // Once we have the address, we can initialize the application.

        // First we check the network
        if (!this._checkNetwork()) {
            try {
                await window.ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: ethers.utils.hexValue(contractAddress.chainId) }]
                });
            } catch (switchError) {
                // DISABLE MINE() AND OUTPUT MESSAGE
                // this.setState({
                //     // ASK METAMASK TO CHANGE NETWORK
                //     networkError: `Please connect Metamask to ${contractAddress.chainId} network`
                // });
                // ALSO ADD 'ADD NETWORK' METHOD
                return;
            }
        }

        this._initializeUser(selectedAddress);

        // We reinitialize it whenever the user changes their account.
        window.ethereum.on("accountsChanged", ([newAddress]) => {
            this._stopPollingMinerData();
            // `accountsChanged` event can be triggered with an undefined newAddress.
            // This happens when the user removes the Dapp from the "Connected
            // list of sites allowed access to your addresses" (Metamask > Settings > Connections)
            // To avoid errors, we reset the dapp state
            if (newAddress === undefined) {
                return this._resetState();
            }

            this._initializeUser(newAddress);
        });

        // We reset the dapp state if the network is changed
        window.ethereum.on("chainChanged ", ([chainId]) => {
            this._stopPollingMinerData();
            this._resetState();
        });
    }

    _initializeUser(userAddress) {
        // This method initializes the dapp

        // We first store the user's address in the component's state
        this.setState({
            selectedAddress: userAddress
        });

        // Then, we initialize ethers, fetch user's state

        // Fetching the user's data
        this._intializeUserProvider();
        this._startPollingMinerData();
    }

    async _intializeUserProvider() {
        // We first initialize ethers by creating a provider using window.ethereum
        this._userProvider = new ethers.providers.Web3Provider(window.ethereum);

        // When, we initialize the contract using that provider and the JPEG miner
        // artifact. You can do this same thing with your contracts.
        this._jpegMiner.write = new ethers.Contract(
            contractAddress.JPEGminer,
            JPEGminerArtifact.abi,
            this._userProvider.getSigner(0)
        );
    }

    // The next two methods are needed to start and stop polling data.
    // CAN I USE A LISTENER?!?!
    _startPollingMinerData() {
        this._pollDataInterval = setInterval(() => this._updateMinerStatus(), 1000);

        // We run it once immediately so we don't have to wait for it
        this._updateMinerStatus();
    }

    _stopPollingMinerData() {
        clearInterval(this._pollDataInterval);
        this._pollDataInterval = undefined;
    }

    async _updateMinerStatus() {
        // HANDLE ERRORS SUCH AS INFURA DOES NOT REPLY!!
        const Ncopies = await this._jpegMiner.read.balanceOf(this.state.selectedAddress);
        this.setState({ canMine: Ncopies.toNumber() === 0 });
    }

    async _updateMiningState() {
        // HANDLE ERRORS SUCH AS INFURA DOES NOT REPLY!!
        const nextScan = await this._jpegMiner.read.totalSupply();
        this.setState({ nextScan: nextScan.toNumber() });
    }

    async _updateGasParams() {
        // DO SMTH TO DEAL WITH FAILED REQUESTS
        const resp = await fetch("https://api.gasprice.io/v1/estimates");
        const {
            result: {
                fast: { feeCap, maxPriorityFee }
            }
        } = await resp.json();

        console.log(feeCap);
        this.setState({
            maxFeePerGas: ethers.utils.parseUnits(feeCap.toFixed(9).toString(), "gwei"),
            maxPriorityFeePerGas: ethers.utils.parseUnits(maxPriorityFee.toFixed(9).toString(), "gwei")
        });
    }

    // This method sends an ethereum transaction to transfer tokens.
    // While this action is specific to this application, it illustrates how to
    // send a transaction.

    /** AMOUNT IS ALWAYS PASSED BY THE USER, BUT IT COULD BE PREFILLD BY THE FRONTEND.
     * TAKE CARE OF THE CASE WHERE AMOUNT IS TOO LARGE
     *  */
    async _mine(amount) {
        // Sending a transaction is a complex operation:
        //   - The user can reject it
        //   - It can fail before reaching the ethereum network (i.e. if the user
        //     doesn't have ETH for paying for the tx's gas)
        //   - It has to be mined, so it isn't immediately confirmed.
        //     Note that some testing networks, like Hardhat Network, do mine
        //     transactions immediately, but your dapp should be prepared for
        //     other networks.
        //   - It can fail once mined.
        //
        // This method handles all of those things, so keep reading to learn how to
        // do it.

        try {
            // If a transaction fails, we save that error in the component's state.
            // We only save one such error, so before sending a second transaction, we
            // clear it.
            this._dismissTransactionError();

            // const gasPrice = await this._userProvider.getGasPrice();

            // We send the transaction, and save its hash in the Dapp's state. This
            // way we can indicate that we are waiting for it to be mined.
            const expectedGasTx = ethers.BigNumber.from(70707).mul(this.state.nextScan).add(3000000);
            const tx = await this._jpegMiner.write.mine(this.imageScans[this.state.nextScan], {
                value: ethers.constants.WeiPerEther.mul(amount),
                maxFeePerGas: this.state.maxFeePerGas,
                maxPriorityFeePerGas: this.state.maxPriorityFeePerGas,
                gasLimit: expectedGasTx.mul(11).div(10)
            });
            this.setState({ txBeingSent: tx.hash });

            // We use .wait() to wait for the transaction to be mined. This method
            // returns the transaction's receipt.
            const receipt = await tx.wait();

            // The receipt, contains a status flag, which is 0 to indicate an error.
            if (receipt.status === 0) {
                // We can't know the exact error that made the transaction fail when it
                // was mined, so we throw this generic one.
                throw new Error("Transaction failed");
            }

            // If we got here, the transaction was successful, so you may want to
            // update your state.
            await this._updateMinerStatus();
        } catch (error) {
            // We check the error code to see if this error was produced because the
            // user rejected a tx. If that's the case, we do nothing.
            if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
                return;
            }

            // Other errors are logged and stored in the Dapp's state. This is used to
            // show them to the user, and for debugging.
            console.error(error);
            this.setState({ transactionError: error });
        } finally {
            // If we leave the try/catch, we aren't sending a tx anymore, so we clear
            // this part of the state.
            this.setState({ txBeingSent: undefined });
        }
    }

    // This method just clears part of the state.
    _dismissTransactionError() {
        this.setState({ transactionError: undefined });
    }

    // This method just clears part of the state.
    _dismissNetworkError() {
        this.setState({ networkError: undefined });
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
    _resetState() {
        this.setState(this.initialState);
    }

    // This method checks if Metamask selected network is Localhost:8545
    _checkNetwork() {
        if (Number(window.ethereum.networkVersion) === contractAddress.chainId) {
            return true;
        }

        return false;
    }
}
