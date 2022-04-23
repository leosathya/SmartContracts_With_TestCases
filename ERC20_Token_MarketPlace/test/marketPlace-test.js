const { expect, use } = require("chai");
const { ethers } = require("hardhat");
const { solidity } = require("ethereum-waffle");

use(solidity);

describe("Testing MarketPlace Contract", () => {
	let Eragon,
		eragon,
		Market,
		market,
		owner,
		add1,
		add2,
		add3,
		addr,
		tokenPerEth;

	beforeEach(async () => {
		[owner, add1, add2, add3, ...addr] = await ethers.getSigners();

		Eragon = await ethers.getContractFactory("EragonToken");
		eragon = await Eragon.deploy();
		await eragon.deployed();

		Market = await ethers.getContractFactory("TokenMarket");
		market = await Market.deploy(eragon.address);
		await market.deployed(eragon.address);

		await eragon.transferToken(market.address, ethers.utils.parseEther("1000"));
		await market.transferOwnership(owner.address);

		marketTokenSupply = await eragon.balanceOf(market.address);
		tokenPerEth = await market.tokensPerEth();
	});

	describe("Test buy() Method", () => {
		it("buy method reverted if no eth sent.", async () => {
			const amount = ethers.utils.parseEther("0");
			await expect(
				market.connect(add1).buy({ value: amount })
			).to.be.revertedWith("Nothing you can buy.");
		});
		it("buy method reverted if Market has not enough Token", async () => {
			const amount = ethers.utils.parseEther("110");
			await expect(
				market.connect(add1).buy({ value: amount })
			).to.be.revertedWith("This Mush Eragon not Available.");
		});
		it("buy method success!", async () => {
			const amount = ethers.utils.parseEther("1");
			await expect(market.connect(add1).buy({ value: amount }))
				.to.emit(market, "BuyEra")
				.withArgs(add1.address, amount.mul(tokenPerEth), amount);
		});
	});

	describe("Test sell() Method", () => {
		it("sell method reverted if TokenToSell is 0", async () => {
			const amount = ethers.utils.parseEther("0");
			await expect(market.connect(add1).sell(amount)).to.be.revertedWith(
				"can't sell"
			);
		});
		it("sell method reverted if User don't have that much Token.", async () => {
			const amount = ethers.utils.parseEther("1");
			await expect(market.connect(add1).sell(amount)).to.be.revertedWith(
				"dont have that much eragon"
			);
		});
		it("sell method reverted if Market don't have that much Token", async () => {
			const amount = ethers.utils.parseEther("1");
			await market.connect(add1).buy({ value: amount });
			await market.connect(owner).withdraw();

			const tokenAmountToSell = ethers.utils.parseEther("100");
			await expect(
				market.connect(add1).sell(tokenAmountToSell)
			).to.be.revertedWith("Not that much present in contract.");
		});
		it("sell Token Success !!!", async () => {
			const amountToBuy = ethers.utils.parseEther("10");
			await market.connect(add1).buy({ value: amountToBuy });
			//expect(await eragon.balanceOf(market.address)).to.equal(
			//	ethers.utils.parseEther("0")
			//);

			//const amountToSell = ethers.utils.parseEther("1000");
			//const txSell = await market.connect(add1).sell(amountToSell);
			//await expect(await eragon.balanceOf(market.address)).to.equal(
			//	ethers.utils.parseEther("1000")
			//);

			const amountToSell = ethers.utils.parseEther("1000");
			await eragon.connect(add1).approve(market.address, amountToSell);

			// check that the Vendor can transfer the amount of tokens we want to sell
			const marketAllowance = await eragon.allowance(
				add1.address,
				market.address
			);
			expect(marketAllowance).to.equal(amountToSell);

			const sellTx = await market.connect(add1).sell(amountToSell);

			// Check that the vendor's token balance is 1000
			const marketTokenBalance = await eragon.balanceOf(market.address);
			expect(marketTokenBalance).to.equal(ethers.utils.parseEther("1000"));

			// Check that the user's token balance is 0
			const userTokenBalance = await eragon.balanceOf(add1.address);
			expect(userTokenBalance).to.equal(0);

			// Check that the user's ETH balance is 10
			const userEthBalance = ethers.utils.parseEther("10");
			await expect(sellTx).to.changeEtherBalance(add1, userEthBalance);
		});
	});

	describe("Test withdraw() method", () => {
		it("reverted because called by non-owner", async () => {
			await expect(market.connect(add1).withdraw()).to.be.revertedWith(
				"Ownable: caller is not the owner"
			);
		});
		it("reverted because Nothing to withdraw by owner", async () => {
			await expect(market.connect(owner).withdraw()).to.be.revertedWith(
				"Nothing to withdraw"
			);
		});
		it("Withdraw Success !!!", async () => {
			const amount = ethers.utils.parseEther("1");
			await market.connect(add1).buy({ value: 1 });

			const txWithdraw = await market.connect(owner).withdraw();

			// Market bal will 0
			const marketEthBal = await ethers.provider.getBalance(market.address);
			expect(marketEthBal).to.equal(0);

			// owner bal will change by marketbal eth
			await expect(txWithdraw).to.changeEtherBalance(owner, "1");
		});
	});
});
