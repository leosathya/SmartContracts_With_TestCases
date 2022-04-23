const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

use(solidity);

// Utility methods
const increaseEVMTimeInSeconds = async (seconds, mine = false) => {
	await ethers.provider.send("evm_increaseTime", [seconds]);
	if (mine) {
		await ethers.provider.send("evm_mine", []);
	}
};

describe("Staker Contract Check", () => {
	let Staker, staker, MyToken, myToken, owner, add1, add2, add3, addrs;

	beforeEach(async () => {
		MyToken = await ethers.getContractFactory("MyToken");
		myToken = await MyToken.deploy();

		Staker = await ethers.getContractFactory("Staker");
		staker = await Staker.deploy(myToken.address);
		await staker.deployed();

		[owner, add1, add2, add3, ...addrs] = await ethers.getSigners();
	});

	describe("Test Contract Utility methods", () => {
		it("timeLeft() returns 0 after deadline.", async () => {
			await increaseEVMTimeInSeconds(180, true);

			const timeRemain = await staker.timeLeft();
			expect(timeRemain).to.equal(0);
		});

		it("timeLeft() returns correct timeLeft after 10 Seconds", async () => {
			const secondPassed = 10;
			const initialTime = await staker.timeLeft();
			await increaseEVMTimeInSeconds(secondPassed, true);

			const finalTime = await staker.timeLeft();
			expect(finalTime).to.equal(initialTime.sub(secondPassed));
		});
	});

	describe("Test stake() function", () => {
		it("Stake event emited", async () => {
			const amount = ethers.utils.parseEther("0.5");

			await expect(staker.connect(add1).stake({ value: amount }))
				.to.emit(staker, "Stake")
				.withArgs(add1.address, amount);

			// Contract have Correct amount of Eth
			const contracBal = await ethers.provider.getBalance(staker.address);
			expect(contracBal).to.equal(amount);

			// contract corresctly store add with balance in Global state
			const addBal = await staker.balances(add1.address);
			expect(addBal).to.equal(amount);
		});

		it("Single user stake more than one time", async () => {
			const firstAmount = ethers.utils.parseEther("0.3");
			const tx1 = await staker.connect(add1).stake({ value: firstAmount });
			await tx1.wait();
			const secondAmount = ethers.utils.parseEther("0.6");
			const tx2 = await staker.connect(add1).stake({ value: secondAmount });

			//const net = firstAmount + secondAmount;
			// contract bal
			const contracBal = await ethers.provider.getBalance(staker.address);
			expect(contracBal).to.equal(firstAmount.add(secondAmount));

			// userContract bal
			const userBal = await staker.balances(add1.address);
			expect(userBal).to.equal(firstAmount.add(secondAmount));
		});

		it("Stake reverted if deadline is reached.", async () => {
			await increaseEVMTimeInSeconds(180, true);

			const amount = ethers.utils.parseEther("0.6");

			await expect(
				staker.connect(add1).stake({ value: amount })
			).to.be.revertedWith("Deadline is already reached");
		});

		it("Stake reverted if external contract is complete,", async () => {
			const amount = ethers.utils.parseEther("1");
			const txStake = await staker.connect(add1).stake({ value: amount });
			await txStake.wait();

			const txExecute = await staker.connect(add1).execute();
			await txExecute.wait();

			await expect(
				staker.connect(add1).stake({ value: amount })
			).to.be.revertedWith("staking process already complete");
		});
	});

	describe("Test execute() method", () => {
		it("execute reverted because stake amount not reached thresold", async () => {
			await expect(staker.connect(add1).execute()).to.be.revertedWith(
				"Threshold not reached"
			);
		});

		it("execute reverted because external contract already completed", async () => {
			const amount = ethers.utils.parseEther("1");
			await staker.connect(add1).stake({ value: amount });
			await staker.connect(add1).execute();
			await expect(staker.connect(add1).execute()).to.be.revertedWith(
				"staking process already completed"
			);
		});

		it("execute reverted because deadline is reached.", async () => {
			await increaseEVMTimeInSeconds(180, true);
			await expect(staker.connect(add1).execute()).to.be.revertedWith(
				"Deadline is already reached"
			);
		});

		it("external contract sucessfully complete", async () => {
			const amount = ethers.utils.parseEther("1");
			await staker.connect(add1).stake({ value: amount });
			await staker.connect(add1).execute();

			const tx = await myToken.completed();
			expect(tx).to.equal(true);

			const externalContractBal = await ethers.provider.getBalance(
				myToken.address
			);
			expect(externalContractBal).to.equal(amount);

			const currentContractBal = await ethers.provider.getBalance(
				staker.address
			);
			expect(currentContractBal).to.equal(0);
		});
	});

	describe("Test withdraw() method", () => {
		it("withdraw reverted if deadline is not reached", async () => {
			await expect(staker.connect(add1).withdraw()).to.be.revertedWith(
				"Deadline is not reached yet"
			);
		});

		it("withdraw reverted if external contract is completed.", async () => {
			const txStake = await staker
				.connect(add1)
				.stake({ value: ethers.utils.parseEther("1") });
			await txStake.wait();

			const txExecute = await staker.connect(add1).execute();
			await txExecute.wait();

			await increaseEVMTimeInSeconds(180, true);

			await expect(staker.connect(add1).withdraw()).to.be.revertedWith(
				"staking process already completed"
			);
		});

		it("withdraw reverted if address have no balance.", async () => {
			await increaseEVMTimeInSeconds(180, true);
			await expect(staker.connect(add1).withdraw()).to.be.revertedWith(
				"You don't have balance to withdraw"
			);
		});

		it("withdraw success", async () => {
			const amount = ethers.utils.parseEther("1");
			await staker.connect(add1).stake({ value: amount });

			await increaseEVMTimeInSeconds(180, true);

			const txWithdraw = await staker.connect(add1).withdraw();
			await txWithdraw.wait();

			const contractBal = await ethers.provider.getBalance(staker.address);
			expect(contractBal).to.equal(0);

			// check balance of receiver increase by amount
			await expect(txWithdraw).to.changeEtherBalance(add1, amount);
		});
	});
});
