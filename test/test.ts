import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { base64imgs } from "../mockbase64Images/base64imgs";

describe("NftMarket", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployNftMarket() {


    // Contracts are deployed using the first signer/account by default
    const [owner, addr1, addr2, addr3] = await hre.ethers.getSigners();

    const NftMarket = await hre.ethers.getContractFactory("NftMarket");
    const nftMarket = await NftMarket.deploy();

    return { nftMarket, owner, addr1, addr2, addr3 };
  }

  describe("Mint", function () {
    it("Should mint nft to valid address", async function () {
      const { nftMarket, addr1, addr2, addr3 } = await loadFixture(deployNftMarket);
      await expect(nftMarket.mint(base64imgs.nft2, ethers.ZeroAddress)).to.be.revertedWithCustomError(nftMarket, "AddressZeroDetected");
      await nftMarket.mint(base64imgs.nft2, addr1.address);
      expect(await nftMarket.balanceOf(addr1.address)).to.equal(1);
      expect(await nftMarket.ownerOf(0)).to.equal(addr1.address);
    });

    it("Should allow only nft owner to list nft for sale", async function () {
      const { nftMarket, addr1, addr2, addr3 } = await loadFixture(deployNftMarket);
      await nftMarket.mint(base64imgs.nft2, addr1.address);
      const price = ethers.parseEther("0.01");
      await expect(nftMarket.connect(addr1).listNFT(0, ethers.parseEther("0"))).to.be.revertedWithCustomError(nftMarket, "PriceMustBeGreaterThanZero");
      await nftMarket.connect(addr1).listNFT(0, price);
      expect((await nftMarket.listings(0)).isListed).to.equal(true);
      await expect(nftMarket.listNFT(0, price)).to.be.revertedWithCustomError(nftMarket, "OnlyNftOwner");
    });

    it("Should not allow already listed nft to be listed", async function () {
      const { nftMarket, addr1, addr2, addr3 } = await loadFixture(deployNftMarket);
      await nftMarket.mint(base64imgs.nft2, addr1.address);
      const price = ethers.parseEther("0.01");
      await nftMarket.connect(addr1).listNFT(0, price);
      await expect(nftMarket.connect(addr1).listNFT(0, price)).to.be.revertedWithCustomError(nftMarket, "AlreadyListed");
    });
    it("Should buy nft", async function () {
      const { nftMarket, addr1, addr2, addr3 } = await loadFixture(deployNftMarket);
      await nftMarket.mint(base64imgs.nft2, addr1.address);
      const price = ethers.parseEther("0.01");

      await nftMarket.connect(addr1).listNFT(0, price);
      await expect(nftMarket.connect(addr2).buyNFT(1, { value: ethers.parseEther("0") })).to.be.revertedWithCustomError(nftMarket, "NotListed");
      await expect(nftMarket.connect(addr2).buyNFT(0, { value: ethers.parseEther("0") })).to.be.revertedWithCustomError(nftMarket, "InsufficientFunds");
      await nftMarket.connect(addr2).buyNFT(0, { value: price });
      expect((await nftMarket.listings(0)).isListed).to.equal(false);
      expect(await nftMarket.ownerOf(0)).to.equal(addr2.address);
    });
    it("Should allow nft owner transfer ownership", async function () {
      const { nftMarket, addr1, addr2, addr3 } = await loadFixture(deployNftMarket);
      await nftMarket.mint(base64imgs.nft2, addr1.address);
      await expect(nftMarket.connect(addr3)["transferOwnership(uint256,address)"](0, addr2.address)).to.be.revertedWithCustomError(nftMarket, "OnlyNftOwner");
      await expect(nftMarket.connect(addr3)["transferOwnership(uint256,address)"](0, ethers.ZeroAddress)).to.be.revertedWithCustomError(nftMarket, "AddressZeroDetected");
      await nftMarket.connect(addr1)["transferOwnership(uint256,address)"](0, addr3.address);
      expect(await nftMarket.ownerOf(0)).to.equal(addr3.address);
    });
    it("should get token uri of valid tokenid information and log into console", async function () {
      const { nftMarket, addr1, addr2, addr3 } = await loadFixture(deployNftMarket);
      await nftMarket.mint(base64imgs.nft2, addr1.address);
      await nftMarket.connect(addr1)["transferOwnership(uint256,address)"](0, addr3.address);
      await expect(nftMarket.tokenURI(1)).to.be.revertedWithCustomError(nftMarket, "InvalidTokenId");
      const tokenUri = await nftMarket.tokenURI(0);
      // console.log({
      //   tokenUri
      // })
    });
  });
});
