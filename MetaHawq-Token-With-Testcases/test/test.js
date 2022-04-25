const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("test token contract and inheritances", async function () {
	let Token,
		token,
		Stakeable,
		stakeable,
		Airdrop,
		airdrop,
		owner,
		add1,
		add2,
		add3,
		addrs;

	const ONE_WEEK = 604800;
	const ONE_MONTH = 2419200;
	const ONE_DAY = 86400;
	const MORE_THAN_ONE_DAY = 86405;

	// utility method
	const increaseEVMTimeInSeconds = async (seconds, mine = false) => {
		await ethers.provider.send("evm_increaseTime", [seconds]);
		if (mine) {
			await ethers.provider.send("evm_mine", []);
		}
	};

	before(async function () {
		[
			owner,
			add1,
			add2,
			add3,
			add4,
			add5,
			add6,
			add7,
			add8,
			add9,
			add10,
			add11,
			...addrs
		] = await ethers.getSigners();

		Token = await ethers.getContractFactory("RDCoin");
		token = await Token.deploy();
		await token.deployed();

		Stakeable = await ethers.getContractFactory("Stakeable");
		stakeable = await Stakeable.deploy();
		await stakeable.deployed();

		Airdrop = await ethers.getContractFactory("Airdrop");
		airdrop = await Airdrop.deploy();
		await airdrop.deployed();
	});

	describe("basic tests for RDCoins", () => {
		it("Should return the correct name and symbol", async function () {
			expect(await token.name()).to.equal("RDCoin");
			expect(await token.symbol()).to.equal("RDC");
		});

		it("Should return the correct balance the deployer address", async function () {
			//const signers = await ethers.getSigners();

			//const deployerAdd = signers[0].address;
			const balance = ethers.utils.parseEther("1500000000");
			expect(await token.balanceOf(owner.address)).to.equal(balance);
		});

		it("test for total supply", async function () {
			const balance = ethers.utils.parseEther("1500000000");
			expect(await token.totalSupply()).to.equal(balance);
		});

		it("test for approve function", async function () {
			//const signers = await ethers.getSigners();
			//const deployerAdd = signers[0];
			//const deployerAdd_ = signers[0].address;
			//const address2 = signers[1].address;
			const aproveAmount = ethers.utils.parseEther("1000000");
			const tx1 = await token
				.connect(owner)
				.approve(add2.address, aproveAmount);
			expect(await token.allowance(owner.address, add2.address)).to.equal(
				aproveAmount
			);
		});

		it("test for transfer function", async function () {
			//const signers = await ethers.getSigners();
			//const deployerAdd = signers[0];
			//const deployerAdd_ = signers[0].address;
			//const address2 = signers[1].address;
			const transferAmount = ethers.utils.parseEther("1000000");
			const tx1 = await token
				.connect(owner)
				.transfer(add2.address, transferAmount);
			expect(await token.balanceOf(add2.address)).to.equal(transferAmount);
		});

		it("test for transfer function", async function () {
			//const signers = await ethers.getSigners();
			//const deployerAdd = signers[0];
			//const deployerAdd_ = signers[0].address;
			//const address2_ = signers[1];
			//const address2 = signers[1].address;
			//const address3 = signers[2].address;
			const transferAmount = ethers.utils.parseEther("1000000");
			const tx1 = await token.connect(owner).approve(add2.address, "1000000");
			await token
				.connect(add2)
				.transferFrom(owner.address, add3.address, "1000000");

			expect(await token.balanceOf(add3.address)).to.equal("1000000");
		});
	});

	describe("Testing stake() method", () => {
		it("stake amount larger than address balance", async () => {
			const amount = ethers.utils.parseEther("1");
			//await token.transfer(add1.address, amount);

			await expect(token.connect(add1).stake(amount)).to.be.revertedWith(
				"insufficient balance"
			);
		});

		it("stake more than one times", async () => {
			const amount = ethers.utils.parseEther("2");
			const amountToStake = ethers.utils.parseEther("1");
			await token.transfer(add1.address, amount);

			await token.connect(add1).stake(amountToStake);
			await expect(token.connect(add1).stake(amountToStake)).to.be.revertedWith(
				"can submit upto one stake"
			);
		});

		it("add stake above 150000000", async () => {
			const amount = ethers.utils.parseEther("200000000");
			await token.transfer(add2.address, amount);

			await expect(token.connect(add2).stake(amount)).to.be.revertedWith(
				"total stakes exceeded 150000000"
			);
		});

		it("stake() success", async () => {
			const amount = ethers.utils.parseEther("1");
			await token.transfer(add2.address, amount);
			const totalSuppBefore = await token.totalSupply();

			await expect(token.connect(add2).stake(amount))
				.to.emit(token, "Staked")
				.withArgs(add2.address, amount);
			const bal = await token.connect(add2).getStakes();

			await expect(amount).to.equal(bal);
			const totalSuppAfter = await token.totalSupply();
			expect(totalSuppAfter).to.equal(totalSuppBefore.sub(amount));
		});
	});

	describe("Testing withraw() method", () => {
		it("Trying to withdraw zero amount", async () => {
			const amount = ethers.utils.parseEther("0");
			await expect(token.connect(add1).withraw(amount)).to.be.revertedWith(
				"stake amount <= 0"
			);
		});

		it("withdraw using Zero address", async () => {});

		it("nothing staked, but trying to withdraw", async () => {
			const amount = ethers.utils.parseEther("1");
			await expect(token.connect(add4).withraw(amount)).to.be.revertedWith(
				"stake amount <= 0"
			);
		});

		it("withdraw limit exceed", async () => {
			const stakeAmount = ethers.utils.parseEther("100");
			const withdrawAmount = ethers.utils.parseEther("27");

			await token.transfer(add8.address, stakeAmount);
			await token.connect(add8).stake(stakeAmount);
			await expect(
				token.connect(add8).withraw(withdrawAmount)
			).to.be.revertedWith("withdraw limit exceeded");
		});

		it("amount not available to withdraw", async () => {});

		it("can't withdraw before 1 Week", async () => {
			const stakeAmount = ethers.utils.parseEther("100");
			const withdrawAmount = ethers.utils.parseEther("20");

			await token.transfer(add7.address, stakeAmount);
			await token.connect(add7).stake(stakeAmount);
			await expect(
				token.connect(add7).withraw(withdrawAmount)
			).to.be.revertedWith("cannot withdraw before one week");
		});

		it("withdraw success !!!!", async () => {
			withdrawAmount = ethers.utils.parseEther("20");
			await increaseEVMTimeInSeconds(ONE_WEEK, true);
			const accPrevBal = await token.balanceOf(add7.address);
			const prevTotalSupply = await token.totalSupply();

			await expect(token.connect(add7).withraw(withdrawAmount))
				.to.emit(token, "Withdraw")
				.withArgs(add7.address, withdrawAmount);

			const accCurrBal = await token.balanceOf(add7.address);
			const currTotalSupply = await token.totalSupply();
			await expect(accCurrBal).to.equal(accPrevBal.add(withdrawAmount));
			await expect(currTotalSupply).to.equal(
				prevTotalSupply.add(withdrawAmount)
			);
		});
	});

	describe("Testing reward() method", () => {
		it("Trying get reward without staking token", async () => {
			await expect(token.connect(add5).reward()).to.be.revertedWith(
				"no token staked"
			);
		});

		it("Reward before 1 month", async () => {
			const stakeAmount = ethers.utils.parseEther("100");
			await token.transfer(add6.address, stakeAmount);
			await token.connect(add6).stake(stakeAmount);

			await expect(token.connect(add6).reward()).to.be.revertedWith(
				"cannot reward before one month"
			);
		});

		it("Reward after 1 month / Reward Success !!!", async () => {
			const accPrevBal = await token.balanceOf(add6.address);
			const prevTotalSupply = await token.totalSupply();

			await increaseEVMTimeInSeconds(ONE_MONTH, true);
			const rewardAmount = ethers.utils.parseEther("10");
			await expect(token.connect(add6).reward())
				.to.emit(token, "Reward")
				.withArgs(add6.address, rewardAmount);

			const accCurrBal = await token.balanceOf(add6.address);
			const currTotalSupply = await token.totalSupply();

			expect(accCurrBal).to.equal(accPrevBal.add(rewardAmount));
			expect(currTotalSupply).to.equal(prevTotalSupply.add(rewardAmount));
		});
	});

	describe("Testing airdrop() method", () => {
		it("airdrop success !!!", async () => {
			const prevBal = await token.connect(add10).balanceOf(add10.address);
			await expect(token.connect(add10).airdrop(add10.address))
				.to.emit(token, "Drop")
				.withArgs(add10.address);

			const currBal = await token.connect(add10).balanceOf(add10.address);
			expect(currBal).to.equal(prevBal.add(1));
			//await increaseEVMTimeInSeconds(ONE_DAY, true);
			//await token.connect(add10).airdrop(add10.address);

			//const dropTokenCount = await airdrop
			//	.connect(add10)
			//	.returnDropTokenCounts_(add10.address);
			//expect(dropTokenCount).to.equal("1");
		});

		it("airdrop on same day", async () => {
			await expect(
				token.connect(add10).airdrop(add10.address)
			).to.be.revertedWith("invalid drop");
		});

		it("airdrop exceed max-Limit", async () => {
			const prevBal = await token.connect(add11).balanceOf(add11.address);

			for (let i = 1; i <= 150; i++) {
				await increaseEVMTimeInSeconds(ONE_DAY, true);
				await token.connect(add11).airdrop(add11.address);
			}

			const currBal = await token.connect(add11).balanceOf(add11.address);
			expect(currBal).to.equal(prevBal.add(150));

			await increaseEVMTimeInSeconds(ONE_DAY, true);
			await expect(
				token.connect(add11).airdrop(add11.address)
			).to.be.revertedWith("max drops reached");
		});
	});
});
