// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

contract MyToken {

  bool public completed;

  function complete() public payable {
    completed = true;
  }

}