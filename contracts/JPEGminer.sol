//SPDX-License-Identifier: MIT

/// @title JPEG Mining Proof of Concept
/// @author Xatarrer
/// @notice Unaudited
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@rari-capital/solmate/src/utils/SSTORE2.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/** 
    @dev Total gas (mint fee + dev fee) is monotonically increassing according to gas = 177551*tokenId+2422449
    @dev At 100 gwei this reprents an initial mining price of 0.24 ETH and a final price of 2 ETH.

    @dev Return data URL:
    https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
    https://en.wikipedia.org/wiki/Data_URI_scheme

    @dev Base64 encoding/decoding available at https://github.com/Brechtpd/base64/blob/main/base64.sol
    
    @dev Large efficient immutable storage: https://github.com/0xsequence/sstore2/blob/master/contracts/SSTORE2.sol
*/

contract JPEGminer is ERC721Enumerable, Ownable {
    using SafeMath for uint256;

    event Mined(
        // Also include the phase it was mined on
        address minerAddress,
        string indexed phase
    );

    uint256 public constant NSCANS = 100;

    string private constant _NAME = "Mined JPEG";
    string private constant _SYMBOL = "MJ";
    string private constant _DESCRIPTION =
        "Mined%20JPEG%20is%20a%20collaborative%20effort%20to%20store%20a%201.45MB%20on-chain%20image%20in%20Base64%20format%20%281.09MB%20in%20binary%29.%20"
        "The%20image%20is%20split%20into%20100%20pieces%20which%20are%20stored%20on-chain%20by%20every%20wallet%20that%20calls%20the%20function%20mine%28%29.%20"
        "Thanks%20to%20the%20progressive%20JPEG%20technology%20the%20image%20is%20viewable%20since%20its%20first%20piece%20is%20mined,%20"
        "and%20its%20quality%20gradually%20improves%20until%20the%20final%20image%20when%20the%20last%20piece%20is%20mined.%20"
        "As%20the%20image's%20quality%20improves%20over%20each%20successive%20mining,%20it%20goes%20through%203%20different%20clear%20phases%3A%20%20%5Cr"
        "1%29%20image%20is%20black%20&%20white%20only,%20%20%5Cr2%29%20color%20is%20added,%20and%20%20%5Cr3%29%20resolution%20improves%20until%20the%20final%20version.%20%5Cr"
        "The%20B&W%20phase%20is%20the%20shortest%20and%20only%20lasts%2011%20uploads,%20"
        "the%20color%20phase%20last%2022%20uploads,%20and%20the%20resolution%20phase%20is%20the%20longest%20with%2067%20uploads.%20"
        "Every%20miner%20gets%20an%20NFT%20of%20the%20image%20but%20with%20the%20quality%20at%20the%20time%20of%20mining;%20"
        "or%20in%20other%20words,%20each%20NFT%20represents%20a%20step%20of%20the%20progressive%20JPEG.%20%20%5Cr"
        "Art%20by%20Logan%20Turner.%20Idea%20and%20code%20by%20Xatarrer.";

    // Replace the hashes before deployment
    address private immutable _mintingGasFeesPointer;
    address private immutable _imageHashesPointer;
    address private immutable _imageHeaderPointer;
    address[] private _imageScansPointers;
    string private constant _imageFooterB64 = "/9k=";

    constructor(
        string memory imageHeaderB64,
        bytes32[] memory imageHashes,
        uint256[] memory mintingGasFees
    ) ERC721(_NAME, _SYMBOL) {
        require(imageHashes.length == NSCANS);

        // Store minting gas fees
        _mintingGasFeesPointer = SSTORE2.write(abi.encodePacked(mintingGasFees));

        // Store header
        _imageHeaderPointer = SSTORE2.write(bytes(imageHeaderB64));

        // Store hashes
        _imageHashesPointer = SSTORE2.write(abi.encodePacked(imageHashes));

        // Initialize array of pointers to scans
        _imageScansPointers = new address[](NSCANS);
    }

    /// @return JSON with properties
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");

        return
            mergeScans(
                tokenId,
                string(
                    abi.encodePacked(
                        "data:application/json;charset=UTF-8,%7B%22name%22%3A%20%22",
                        _NAME,
                        "%3A%20",
                        Strings.toString(tokenId + 1),
                        "%20of%20",
                        Strings.toString(NSCANS),
                        "%20copies%22,%20%22description%22%3A%20%22",
                        _DESCRIPTION,
                        "%22,%20%22image%22%3A%20%22data%3Aimage/jpeg;base64,",
                        string(SSTORE2.read(_imageHeaderPointer))
                    )
                ),
                string(
                    abi.encodePacked(
                        _imageFooterB64,
                        "%22,%22attributes%22%3A%20%5B%7B%22trait_type%22%3A%20%22kilobytes%22,%20%22value%22%3A%20"
                    )
                ),
                string(
                    abi.encodePacked(
                        "%7D,%20%7B%22trait_type%22%3A%20%22phase%22,%20%22value%22%3A%20%22",
                        getPhase(tokenId),
                        "%22%7D%5D%7D"
                    )
                )
            );
    }

    function mergeScans(
        uint256 tokenId,
        string memory preImage,
        string memory posImage,
        string memory lastText
    ) private view returns (string memory) {
        // Get scans
        uint256 KB = 0;
        string[] memory data = new string[](9);

        for (uint256 i = 0; i < 9; i++) {
            if (tokenId < 12 * i) break;

            string[] memory scans = new string[](12);

            for (uint256 j = 0; j < 12; j++) {
                if (tokenId < 12 * i + j) break;

                bytes memory scan = SSTORE2.read(_imageScansPointers[12 * i + j]);
                scans[j] = string(scan);
                KB += scan.length;
            }

            data[i] = string(
                abi.encodePacked(
                    scans[0],
                    scans[1],
                    scans[2],
                    scans[3],
                    scans[4],
                    scans[5],
                    scans[6],
                    scans[7],
                    scans[8],
                    scans[9],
                    scans[10],
                    scans[11]
                )
            );
        }

        return (
            string(
                abi.encodePacked(
                    preImage,
                    data[0],
                    data[1],
                    data[2],
                    data[3],
                    data[4],
                    data[5],
                    data[6],
                    data[7],
                    data[8],
                    posImage,
                    string(abi.encodePacked(Strings.toString(KB / 1024), lastText))
                )
            )
        );
    }

    function getPhase(uint256 tokenId) public pure returns (string memory) {
        require(tokenId < NSCANS);

        if (tokenId <= 10) return "Black%20&%20White";
        else if (tokenId <= 32) return "Color";
        else return "Resolution";
    }

    function getMintingGasFee(uint256 tokenId) public view returns (uint256) {
        require(tokenId < NSCANS);

        bytes memory hashBytes = SSTORE2.read(_mintingGasFeesPointer, tokenId * 32, (tokenId + 1) * 32);

        bytes32 out;
        for (uint256 i = 0; i < 32; i++) {
            out |= bytes32(hashBytes[i] & 0xFF) >> (i * 8);
        }
        return uint256(out);
    }

    function getHash(uint256 tokenId) public view returns (bytes32) {
        require(tokenId < NSCANS);

        bytes memory hashBytes = SSTORE2.read(_imageHashesPointer, tokenId * 32, (tokenId + 1) * 32);

        bytes32 out;
        for (uint256 i = 0; i < 32; i++) {
            out |= bytes32(hashBytes[i] & 0xFF) >> (i * 8);
        }
        return out;
    }

    /// @param imageScanB64 Piece of image data in base64
    function mine(string calldata imageScanB64) external payable {
        // Checks
        require(msg.sender == tx.origin, "Only EA's can mine");
        require(balanceOf(msg.sender) == 0, "Cannot mine more than once");
        require(totalSupply() < NSCANS, "Mining is over");

        // Check gas minting fee
        // IMPORTANT TO CHECK IN RINKEBY THAT TX.GASPRICE = PRIORITY + BASE FEE
        uint256 mintingFee = tx.gasprice.mul(getMintingGasFee(totalSupply()));
        require(msg.value >= mintingFee, "ETH fee insufficient");

        // Check hash matches
        require(keccak256(bytes(imageScanB64)) == getHash(totalSupply()), "Wrong data");

        // SSTORE2 scan
        _imageScansPointers[totalSupply()] = SSTORE2.write(bytes(imageScanB64));

        // Return change
        payable(msg.sender).transfer(msg.value - mintingFee);

        // Mint scan
        uint256 tokenId = totalSupply();
        _mint(msg.sender, tokenId);

        emit Mined(msg.sender, getPhase(tokenId));
    }

    function withdrawEth() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function withdrawToken(address addrERC20) external onlyOwner {
        uint256 balance = IERC20(addrERC20).balanceOf(address(this));
        IERC20(addrERC20).transfer(owner(), balance);
    }
}

// LINEAR GAS INCREASE (MINING+FEE)
// PRICE NFT IN GAS
