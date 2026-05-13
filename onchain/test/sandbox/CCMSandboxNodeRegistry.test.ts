import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import type { CCMSandboxNodeRegistry } from "../../typechain-types";

describe("CCMSandboxNodeRegistry", () => {
  let registry: CCMSandboxNodeRegistry;
  let alice: any, bob: any, carol: any;

  beforeEach(async () => {
    [alice, bob, carol] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("CCMSandboxNodeRegistry");
    registry = await Factory.deploy();
    await registry.waitForDeployment();
  });

  it("starts with count 0", async () => {
    expect(await registry.count()).to.equal(0n);
  });

  it("register(): emits NodeRegistered and increments count", async () => {
    await expect(registry.connect(alice).register("alice-1", "https://alice.example/rpc"))
      .to.emit(registry, "NodeRegistered")
      .withArgs(alice.address, 1n, "alice-1", "https://alice.example/rpc");
    expect(await registry.count()).to.equal(1n);
  });

  it("re-register from same address emits NodeUpdated (not NodeRegistered) and does not increment count", async () => {
    await registry.connect(alice).register("alice-1", "ep-1");
    await expect(registry.connect(alice).register("alice-2", "ep-2"))
      .to.emit(registry, "NodeUpdated")
      .withArgs(alice.address, 1n, "alice-2", "ep-2");
    expect(await registry.count()).to.equal(1n);
    const node = await registry.nodeOf(alice.address);
    expect(node.label).to.equal("alice-2");
    expect(node.endpoint).to.equal("ep-2");
  });

  it("update() works only for already-registered addresses", async () => {
    await expect(registry.connect(alice).update("x", "y")).to.be.revertedWith("Registry: not registered");
    await registry.connect(alice).register("a", "ea");
    await expect(registry.connect(alice).update("a2", "ea2"))
      .to.emit(registry, "NodeUpdated")
      .withArgs(alice.address, 1n, "a2", "ea2");
  });

  it("unregister() marks node inactive and decrements count", async () => {
    await registry.connect(alice).register("alice-1", "ep");
    await registry.connect(bob).register("bob-1", "ep");
    expect(await registry.count()).to.equal(2n);
    await expect(registry.connect(alice).unregister())
      .to.emit(registry, "NodeUnregistered")
      .withArgs(alice.address, 1n);
    expect(await registry.count()).to.equal(1n);
    const node = await registry.nodeOf(alice.address);
    expect(node.active).to.equal(false);
  });

  it("unregister() reverts if not registered", async () => {
    await expect(registry.connect(alice).unregister()).to.be.revertedWith("Registry: not registered");
  });

  it("recent(n) returns most recent N active nodes in reverse chronological order", async () => {
    await registry.connect(alice).register("a", "ea");
    await time.increase(2);
    await registry.connect(bob).register("b", "eb");
    await time.increase(2);
    await registry.connect(carol).register("c", "ec");
    const recent = await registry.recent(2);
    expect(recent.length).to.equal(2);
    expect(recent[0].label).to.equal("c");
    expect(recent[1].label).to.equal("b");
  });

  it("recent(n) clamps to count when n > count", async () => {
    await registry.connect(alice).register("a", "ea");
    const recent = await registry.recent(10);
    expect(recent.length).to.equal(1);
    expect(recent[0].label).to.equal("a");
  });

  it("recent(n) skips inactive nodes", async () => {
    await registry.connect(alice).register("a", "ea");
    await registry.connect(bob).register("b", "eb");
    await registry.connect(carol).register("c", "ec");
    await registry.connect(bob).unregister();
    const recent = await registry.recent(3);
    expect(recent.length).to.equal(2);
    expect(recent[0].label).to.equal("c");
    expect(recent[1].label).to.equal("a");
  });

  it("label length cap (64) and endpoint length cap (128) enforced", async () => {
    const longLabel = "x".repeat(65);
    await expect(registry.connect(alice).register(longLabel, "ep")).to.be.revertedWith("Registry: label too long");
    const longEndpoint = "y".repeat(129);
    await expect(registry.connect(alice).register("ok", longEndpoint)).to.be.revertedWith("Registry: endpoint too long");
  });

  it("empty endpoint is allowed", async () => {
    await expect(registry.connect(alice).register("alice-1", ""))
      .to.emit(registry, "NodeRegistered");
    const node = await registry.nodeOf(alice.address);
    expect(node.endpoint).to.equal("");
  });
});
