//SPDX-License-Identifier: MIT

/// @title JPEG Mining
/// @author Xatarrer
/// @notice Unaudited
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@rari-capital/solmate/src/utils/SSTORE2.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/** 
    @dev Return data URL:
    https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
    https://en.wikipedia.org/wiki/Data_URI_scheme

    @dev Base64 encoding/decoding available at https://github.com/Brechtpd/base64/blob/main/base64.sol
    
    @dev Large efficient immutable storage: https://github.com/0xsequence/sstore2/blob/master/contracts/SSTORE2.sol
*/

contract JPEGminer is ERC721Enumerable, Ownable {
    event Mined(address indexed minerAddress, string indexed phase); // ALSO RECORD BYTES

    bytes32 private immutable _ROOT;

    string private constant _NAME = "The Buterin";
    string private constant _SYMBOL = "VIT";
    string private constant _DESCRIPTION =
        "JPEG Mining is a collaborative effort to store %2a%2athe largest on-chain image%2a%2a %281.5MB in Base64 format %26 1.1MB in binary%29. "
        "The image is split into 100 pieces which are uploaded by every wallet that calls the function mine%28%29. "
        "Thanks to the %2a%2aprogressive JPEG%2a%2a technology the image is viewable since its first piece is mined, "
        "and its quality gradually improves until the last piece is mined.  %5Cr  %5Cr"
        "As the image's quality improves over each successive mining, it goes through 3 different clear phases%3A  %5Cr"
        "1. image is %2a%2black & white%2a%2 only,  %5Cr2. %2a%2color%2a%2 is added, and  %5Cr3. %2a%2resolution%2a%2 improves until the final version.  %5Cr"
        "The B&W phase is the shortest and only lasts 11 uploads, "
        "the color phase last 22 uploads, and the resolution phase is the longest with 67 uploads.  %5Cr  %5Cr"
        "Every JPEG miner gets an NFT of the image with the quality at the time of minting.  %5Cr  %5Cr"
        "Art by Logan Turner. Idea and code by Xatarrer.";

    // Image data
    address private immutable _IMAGE_HEADER_POINTER;
    address[] private _IMAGE_SCANS_POINTERS;
    bytes private _IMAGE_FOOTER;

    // bytes("/9k=");

    constructor(
        bytes32 root,
        string memory imageHeaderB64,
        string memory imageFooterB64
    ) ERC721(_NAME, _SYMBOL) {
        _ROOT = root;
        _IMAGE_HEADER_POINTER = SSTORE2.write(bytes(imageHeaderB64));
        _IMAGE_FOOTER = bytes(imageFooterB64);
    }

    function _verifyDataChunk(bytes32[] calldata proof, string calldata imageScanB64) private view {
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(totalSupply(), imageScanB64))));
        require(MerkleProof.verifyCalldata(proof, _ROOT, leaf), "Invalid data");
    }

    /// @return JSON with properties
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");

        uint256 Nscans = tokenId + 1;

        // Read all scans upto tokenId
        bytes[] memory imageScans = new bytes[](Nscans);
        uint256 Nbytes;
        for (uint256 i = 0; i < Nscans; i++) {
            imageScans[i] = SSTORE2.read(_IMAGE_SCANS_POINTERS[i]);
            Nbytes += imageScans[i].length;
        }

        // Count pre image data, image header, image footer and post image data
        bytes memory preImage = abi.encodePacked(
            "data:application/json;charset=UTF-8,%7B%22name%22%3A %22",
            _NAME,
            "%3A ",
            Strings.toString(tokenId + 1),
            "%22, %22description%22%3A %22",
            _DESCRIPTION,
            "%22, %22image%22%3A %22data%3Aimage/jpeg;base64,",
            string(SSTORE2.read(_IMAGE_HEADER_POINTER))
        );
        bytes memory imageHeader = SSTORE2.read(_IMAGE_HEADER_POINTER);
        bytes memory imageFooter = _IMAGE_FOOTER;
        bytes memory posImage = abi.encodePacked(
            "%22,%22attributes%22%3A %5B%7B%22trait_type%22%3A %22kilobytes%22, %22value%22%3A "
        );
        Nbytes += preImage.length + imageHeader.length + imageFooter.length + posImage.length;

        // Merge pre image data and header
        bytes memory URI = new bytes(Nbytes);
        uint256 offset = 32;
        assembly {
            mstore(add(URI, offset), preImage)
        }
        offset += preImage.length;
        assembly {
            mstore(add(URI, offset), imageHeader)
        }
        offset += imageHeader.length;

        // Merge scans
        for (uint256 i = 0; i < Nscans; i++) {
            Nbytes += imageScans.length;
            bytes memory imageScan = imageScans[i];
            assembly {
                mstore(add(URI, offset), imageScan)
            }
            offset += imageScans[i].length;
        }

        // Merge footer and pos image data
        assembly {
            mstore(add(URI, offset), imageFooter)
        }
        offset += imageFooter.length;
        assembly {
            mstore(add(URI, offset), posImage)
        }

        return string(URI);

        // abi.encodePacked(
        //     "%7D, %7B%22trait_type%22%3A %22phase%22, %22value%22%3A %22",
        //     getPhase(tokenId),
        //     "%22%7D%5D%7D"
        // )
    }

    // function _createURI(
    //     uint256 tokenId,
    //     bytes memory preImage,
    //     bytes memory posImage
    // ) private view returns (bytes memory URI) {}

    function getPhase(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");

        if (tokenId <= 10) return "Black & White";
        else if (tokenId <= 32) return "Color";
        else return "Resolution";
    }

    /// @param imageScanB64 Piece of image data in base64
    function mine(string calldata imageScanB64, bytes32[] calldata proof) external {
        // Check hash matches
        _verifyDataChunk(proof, imageScanB64);

        // SSTORE2 scan
        _IMAGE_SCANS_POINTERS.push(SSTORE2.write(bytes(imageScanB64)));

        // Mint scan
        uint256 tokenId = totalSupply();
        _mint(msg.sender, tokenId);

        emit Mined(msg.sender, getPhase(tokenId));
    }
}
