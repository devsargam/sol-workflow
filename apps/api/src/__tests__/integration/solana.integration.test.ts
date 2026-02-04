import { describe, it, expect, vi } from "vitest";

const defaultConnection = {
  getSlot: vi.fn(async () => 42),
  getBlockHeight: vi.fn(async () => 9001),
  getAccountInfo: vi.fn(async () => ({
    lamports: 777,
    owner: { toBase58: () => "OwnerPubKey" },
    executable: false,
    rentEpoch: 1,
    data: new Uint8Array([1, 2]),
  })),
};

vi.mock("@repo/solana", () => ({
  getDefaultConnection: () => defaultConnection,
  getBalance: async () => ({ address: "TestAddress", lamports: 123, sol: 0.000000123 }),
  formatBalance: (lamports: number) => `${lamports} lamports`,
}));

const fetchJson = async (path: string) => {
  const api = (await import("../../index")).default;
  const res = await api.fetch(new Request(`http://localhost${path}`));
  const body = await res.json();
  return { res, body };
};

describe("Solana API (integration)", () => {
  it("GET /solana/health returns connection info", async () => {
    const { res, body } = await fetchJson("/solana/health");

    expect(res.status).toBe(200);
    expect(body.connected).toBe(true);
    expect(body.slot).toBe(42);
    expect(body.blockHeight).toBe(9001);
  });

  it("GET /solana/balance/:address validates address", async () => {
    const { res, body } = await fetchJson("/solana/balance/short");

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid Solana address");
  });

  it("GET /solana/balance/:address returns balance", async () => {
    const { res, body } = await fetchJson(
      "/solana/balance/11111111111111111111111111111111"
    );

    expect(res.status).toBe(200);
    expect(body.lamports).toBe(123);
    expect(body.formatted).toBe("123 lamports");
  });

  it("GET /solana/account/:address validates address", async () => {
    const { res, body } = await fetchJson("/solana/account/short");

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid Solana address");
  });

  it("GET /solana/account/:address returns account info", async () => {
    const { res, body } = await fetchJson(
      "/solana/account/11111111111111111111111111111111"
    );

    expect(res.status).toBe(200);
    expect(body.owner).toBe("OwnerPubKey");
    expect(body.dataLength).toBe(2);
  });
});
