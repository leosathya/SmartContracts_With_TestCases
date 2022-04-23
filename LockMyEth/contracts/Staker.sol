// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./MyToken.sol";

contract Staker {

  MyToken public myToken;

  mapping(address => uint256) public balances;

  uint256 public constant threshold = 1 ether;

  uint256 public deadline = block.timestamp + 30 seconds;

  event Stake(address indexed sender, uint256 amount);

  modifier deadlineReached( bool requireReached ) {
    uint256 timeRemaining = timeLeft();
    if( requireReached ) {
      require(timeRemaining == 0, "Deadline is not reached yet");
    } else {
      require(timeRemaining > 0, "Deadline is already reached");
    }
    _;
  }

  modifier stakeNotCompleted() {
    bool completed = myToken.completed();
    require(!completed, "staking process already completed");
    _;
  }
  

  constructor(address _addr){
      myToken = MyToken(_addr);
  }

  function execute() public stakeNotCompleted deadlineReached(false) {
    uint256 contractBalance = address(this).balance;

    // check the contract has enough ETH to reach the treshold
    require(contractBalance >= threshold, "Threshold not reached");

    // Execute the external contract, transfer all the balance to the contract
    // (bool sent, bytes memory data) = exampleExternalContract.complete{value: contractBalance}();
    (bool sent,) = address(myToken).call{value: contractBalance}(abi.encodeWithSignature("complete()"));
    require(sent, "myToken.complete failed");
  }


  function stake() public payable deadlineReached(false) stakeNotCompleted {
    // update the user's balance
    balances[msg.sender] += msg.value;
    
    // emit the event to notify the blockchain that we have correctly Staked some fund for the user
    emit Stake(msg.sender, msg.value);
  }

  /**
  * @notice Allow users to withdraw their balance from the contract only if deadline is reached but the stake is not completed
  */
  function withdraw() public deadlineReached(true) stakeNotCompleted {
    uint256 userBalance = balances[msg.sender];

    // check if the user has balance to withdraw
    require(userBalance > 0, "You don't have balance to withdraw");

    // reset the balance of the user
    balances[msg.sender] = 0;

    // Transfer balance back to the user
    (bool sent,) = msg.sender.call{value: userBalance}("");
    require(sent, "Failed to send user balance back to the user");
  }

  /**
  * @notice The number of seconds remaining until the deadline is reached
  */
  function timeLeft() public view returns (uint256 timeleft) {
    if( block.timestamp >= deadline ) {
      return 0;
    } else {
      return deadline - block.timestamp;
    }
  }

}